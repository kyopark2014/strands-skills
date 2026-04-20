import os
import chat
import logging
import sys
import plugin
import skill
import strands_agent
from typing import Optional
from strands import Agent, tool
from strands.agent.conversation_manager import SlidingWindowConversationManager

logging.basicConfig(
    level=logging.INFO,
    format='%(filename)s:%(lineno)d | %(message)s',
    handlers=[
        logging.StreamHandler(sys.stderr)
    ]
)

logger = logging.getLogger("plugin-agent")

WORKING_DIR = os.path.dirname(os.path.abspath(__file__))
ARTIFACTS_DIR = os.path.join(WORKING_DIR, "artifacts")
PLUGINS_DIR = os.path.join(WORKING_DIR, "plugins")

conversation_manager = SlidingWindowConversationManager(
    window_size=10,  
)

def create_agent(strands_tools: list[str], mcp_servers: list[str], skill_list: list[str], \
 plugin_name: Optional[str], plugin_skill_list: list[str], command: Optional[str] = None):
    strands_agent.init_mcp_clients(mcp_servers)

    tools = strands_agent.update_tools(strands_tools, mcp_servers)
    logger.info(f"tools count: {len(tools)}")

    if chat.skill_mode == 'Enable':
        tools.append(strands_agent.get_skill_instructions)

        skill_info = skill.get_skill_info(skill_list)
        logger.info(f"skill_info: {skill_info}")

        plugin_skill_info = skill.get_plugin_skill_info(plugin_name, plugin_skill_list)
        logger.info(f"plugin_name: {plugin_name}, plugin_skill_info: {plugin_skill_info}")        
        skill_info.extend(plugin_skill_info)

        if command:
            system_prompt = skill.build_command_prompt(plugin_name, skill_info, command)
        else:
            system_prompt = skill.build_skill_prompt(skill_info)        
        logger.info(f"system prompt: {system_prompt}")

    else:
        system_prompt = strands_agent.BASE_SYSTEM_PROMPT

    model = strands_agent.get_model()
    
    agent = Agent(
        model=model,
        system_prompt=system_prompt,
        tools=tools,
        conversation_manager=conversation_manager,
        #max_parallel_tools=2
    )

    return agent

selected_strands_tools = []
selected_mcp_servers = []
selected_skill_list = []
selected_plugin_skill_list = []
active_plugin = None

async def run_plugin_agent(query: str, strands_tools: list[str], mcp_servers: list[str], skill_list: list[str], plugin_name: Optional[str], plugin_skill_list: list[str], notification_queue):
    """Run the plugin agent with streaming and tool notifications."""    

    global selected_strands_tools, selected_mcp_servers, selected_skill_list, selected_plugin_skill_list, active_plugin

    queue = notification_queue
    queue.reset()

    image_url = []
    references = []

    command = None
    if plugin.is_command(query, plugin_name):
        command = query.split(" ")[0].lstrip("/")
        logger.info(f"command: {command}")

    if selected_strands_tools != strands_tools or selected_mcp_servers != mcp_servers or selected_skill_list != skill_list or selected_plugin_skill_list != plugin_skill_list or active_plugin != plugin_name:
        selected_strands_tools = strands_tools
        selected_mcp_servers = mcp_servers
        selected_skill_list = skill_list
        selected_plugin_skill_list = plugin_skill_list
        active_plugin = plugin_name

        strands_agent.mcp_manager.stop_agent_clients()
        
        strands_agent.agent = create_agent(strands_tools, mcp_servers, skill_list, \
         plugin_name, plugin_skill_list, command)

        strands_agent.mcp_manager.start_agent_clients(mcp_servers)

    if strands_agent.agent is None:
        logger.error("Failed to create agent - app is None")
        return "에이전트를 생성할 수 없습니다. MCP 서버 설정 또는 도구 구성을 확인해주세요.", []

    # run agent
    final_result = current = ""
    with strands_agent.mcp_manager.get_active_clients(mcp_servers) as _:
        agent_stream = strands_agent.agent.stream_async(query)

        async for event in agent_stream:
            text = ""
            if "data" in event:
                text = event["data"]
                logger.info(f"[data] {text}")
                current += text
                queue.stream(current)

            elif "result" in event:
                final = event["result"]
                message = final.message
                if message:
                    content = message.get("content", [])
                    result = content[0].get("text", "")
                    logger.info(f"[result] {result}")
                    final_result = result

            elif "current_tool_use" in event:
                current_tool_use = event["current_tool_use"]
                name = current_tool_use.get("name", "")
                input_val = current_tool_use.get("input", "")
                toolUseId = current_tool_use.get("toolUseId", "")

                text = f"name: {name}, input: {input_val}"

                queue.register_tool(toolUseId, name)
                queue.tool_update(toolUseId, f"Tool: {name}, Input: {input_val}")
                current = ""

            elif "message" in event:
                message = event["message"]

                if "content" in message:
                    msg_content = message["content"]
                    for item in msg_content:
                        if "toolResult" not in item:
                            continue
                        toolResult = item["toolResult"]
                        toolUseId = toolResult["toolUseId"]
                        toolContent = toolResult["content"]
                        toolResultText = toolContent[0].get("text", "")
                        tool_name = queue.get_tool_name(toolUseId)
                        logger.info(f"[toolResult] {toolResultText}, [toolUseId] {toolUseId}")
                        queue.notify(f"Tool Result: {str(toolResultText)}")

                        info_content, urls, refs = chat.get_tool_info(tool_name, toolResultText)
                        if refs:
                            for r in refs:
                                references.append(r)
                            logger.info(f"refs: {refs}")
                        if urls:
                            for url in urls:
                                image_url.append(url)
                            logger.info(f"urls: {urls}")

                        if info_content:
                            logger.info(f"content: {info_content}")

            elif "contentBlockDelta" or "contentBlockStop" or "messageStop" or "metadata" in event:
                pass

            else:
                logger.info(f"event: {event}")

        if references:
            ref = "\n\n### Reference\n"
            for i, reference in enumerate(references):
                content = reference['content'][:100].replace("\n", "")
                ref += f"{i+1}. [{reference['title']}]({reference['url']}), {content}...\n"
            final_result += ref

        if notification_queue is not None:
            queue.result(final_result)

    return final_result, image_url
