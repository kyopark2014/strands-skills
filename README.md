# Strands Agent

여기에서는 [Strands agent](https://strandsagents.com/0.1.x/)를 이용해 Agentic AI를 구현하는것을 설명합니다. Strands Agent는 AI agent 구축 및 실행을 위해 설계된 오픈소스 SDK입니다. 계획(planning), 사고 연결(chaining thoughts), 도구 호출, Reflection과 같은 agent 기능을 쉽게 활용할 수 있습니다. 이를 통해 LLM model과 tool을 연결하며, 모델의 추론 능력을 이용하여 도구를 계획하고 실행합니다. 현재 Amazon Bedrock, Anthropic, Meta의 모델을 지원하며, Accenture, Anthropic, Meta와 같은 기업들이 참여하고 있습니다. 

여기에서 사용하는 architecture는 아래와 같습니다. Agent의 기본동작 확인 및 구현을 위해 EC2에 docker 형태로 탑재되어 ALB와 CloudFront를 이용해 사용자가 streamlit으로 동작을 테스트 할 수 있습니다. Agent가 생성하는 그림이나 문서는 S3를 이용해 공유될 수 있으며, EC2에 내장된 MCP server/client를 이용해 인터넷검색(Tavily), RAG(knowledge base) AWS tools(use-aws), AWS Document를 이용할 수 있습니다.

<img width="900" alt="image" src="https://github.com/user-attachments/assets/69327c04-ea88-4647-bfce-4e2cae6beba0" />





Strands agent는 아래와 같은 [Agent Loop](https://strandsagents.com/0.1.x/user-guide/concepts/agents/agent-loop/)을 가지고 있으므로, 적절한 tool을 선택하여 실행하고, reasoning을 통해 반복적으로 필요한 동작을 수행합니다. 

![image](https://github.com/user-attachments/assets/6f641574-9d0b-4542-b87f-98d7c2715e09)

Tool들을 아래와 같이 병렬로 처리할 수 있습니다.

```python
agent = Agent(
    max_parallel_tools=4  
)
```

## Strands Agent 활용 방법

### Streamlit에서 agent의 실행

[app.py](./application/app.py)와 같이 사용자가 "RAG", "Agent"을 선택할 수 있습니다. "Agent"은 Strands agent를 이용하여 MCP로 필요시 tool들을 이용하여 RAG등을 활용할 수 있습니다. Streamlit의 UI를 위하여 user의 입력과 결과인 response을 [Session State](https://docs.streamlit.io/develop/api-reference/caching-and-state/st.session_state)로 관리합니다. 

```python
if prompt := st.chat_input("메시지를 입력하세요."):
    with st.chat_message("user"):  
        st.markdown(prompt)
    st.session_state.messages.append({"role": "user", "content": prompt})

    with st.chat_message("assistant"):
        containers = {
            "tools": st.empty(),
            "status": st.empty(),
            "notification": [st.empty() for _ in range(1000)],
            "key": st.empty()
        }
        if mode == 'Agent':
            response, image_urls = asyncio.run(chat.run_strands_agent(
                query=prompt, 
                strands_tools=selected_strands_tools, 
                mcp_servers=selected_mcp_servers, 
                containers=containers))
        st.session_state.messages.append({
            "role": "assistant", 
            "content": response,
            "images": image_urls if image_urls else []
        })
```

### Agent의 실행

아래와 같이 system prompt, model, tool 정보를 가지고 agent를 생성합니다.

```python
def create_agent(system_prompt, tools):
    if system_prompt==None:
        system_prompt = (
            "당신의 이름은 서연이고, 질문에 대해 친절하게 답변하는 사려깊은 인공지능 도우미입니다."
            "상황에 맞는 구체적인 세부 정보를 충분히 제공합니다." 
            "모르는 질문을 받으면 솔직히 모른다고 말합니다."
        )
    model = get_model()    
    agent = Agent(
        model=model,
        system_prompt=system_prompt,
        tools=tools,
        conversation_manager=conversation_manager
    )
    return agent
```

[chat.py](./application/chat.py)와 같이 Agent를 실행하고 stream으로 결과를 받아서 보여줍니다. 이때, 아래와 같이 event에서 "data"만을 추출한 후에 full_response로 저장한 후에 markdown으로 표시합니다. 

```python
async def run_strands_agent(query, strands_tools, mcp_servers, containers):
    await strands_agent.initiate_agent(
        system_prompt=None, 
        strands_tools=strands_tools, 
        mcp_servers=mcp_servers
    )

    final_result = current = ""
    with strands_agent.mcp_manager.get_active_clients(mcp_servers) as _:
        agent_stream = strands_agent.agent.stream_async(query)
        
        async for event in agent_stream:
            text = ""            
            if "data" in event:
                text = event["data"]
                logger.info(f"[data] {text}")
                current += text

            elif "result" in event:
                final = event["result"]                
                message = final.message
                if message:
                    content = message.get("content", [])
                    result = content[0].get("text", "")
                    final_result = result
    return final_result
```

### 대화 이력의 활용

대화 내용을 이용해 대화를 이어나가고자 할 경우에 아래와 같이 SlidingWindowConversationManager을 이용해서 window_size만큼 이전 대화를 가져와 활용할 수 있습니다. 상세한 코드는 [chat.py](./application/chat.py)을 참조합니다.

```python
from strands.agent.conversation_manager import SlidingWindowConversationManager

conversation_manager = SlidingWindowConversationManager(
    window_size=10,  
)

agent = Agent(
    model=model,
    system_prompt=system,
    tools=[    
        calculator, 
        current_time,
        use_aws    
    ],
    conversation_manager=conversation_manager
)
```

### MCP 활용

아래와 같이 MCPClient로 stdio_mcp_client을 지정한 후에 list_tools_sync을 이용해 tool 정보를 추출합니다. MCP tool은 strands tool과 함께 아래처럼 사용할 수 있습니다.

```python
from strands.tools.mcp import MCPClient
from strands_tools import calculator, current_time, use_aws

stdio_mcp_client = MCPClient(lambda: stdio_client(
    StdioServerParameters(command="uvx", args=["awslabs.aws-documentation-mcp-server@latest"])
))

with stdio_mcp_client as client:
    aws_documentation_tools = client.list_tools_sync()
    logger.info(f"aws_documentation_tools: {aws_documentation_tools}")

    tools=[    
        calculator, 
        current_time,
        use_aws
    ]

    tools.extend(aws_documentation_tools)

    agent = Agent(
        model=model,
        system_prompt=system,
        tools=tools,
        conversation_manager=conversation_manager
    )
```

또한, wikipedia 검색을 위한 MCP server의 예는 아래와 같습니다. 상세한 코드는 [mcp_server_wikipedia.py](./application/mcp_server_wikipedia.py)을 참조합니다.

```python
from mcp.server.fastmcp import FastMCP
import wikipedia
import logging
import sys

logging.basicConfig(
    level=logging.INFO,  # Default to INFO level
    format='%(filename)s:%(lineno)d | %(message)s',
    handlers=[
        logging.StreamHandler(sys.stderr)
    ]
)
logger = logging.getLogger("rag")

mcp = FastMCP(
    "Wikipedia",
    dependencies=["wikipedia"],
)

@mcp.tool()
def search(query: str):
    logger.info(f"Searching Wikipedia for: {query}")
    
    return wikipedia.search(query)

@mcp.tool()
def summary(query: str):
    return wikipedia.summary(query)

@mcp.tool()
def page(query: str):
    return wikipedia.page(query)

@mcp.tool()
def random():
    return wikipedia.random()

@mcp.tool()
def set_lang(lang: str):
    wikipedia.set_lang(lang)
    return f"Language set to {lang}"

if __name__ == "__main__":
    mcp.run()
```

### 동적으로 MCP Server를 binding하기

MCP Server를 동적으로 관리하기 위하여 MCPClientManager를 정의합니다. add_client는 MCP 서버의 name, command, args, env로 MCP Client를 정의합니다. 

```python
class MCPClientManager:
    def __init__(self):
        self.clients: Dict[str, MCPClient] = {}
        
    def add_client(self, name: str, command: str, args: List[str], env: dict[str, str] = {}) -> None:
        """Add a new MCP client"""
        self.clients[name] = MCPClient(lambda: stdio_client(
            StdioServerParameters(
                command=command, args=args, env=env
            )
        ))
    
    def remove_client(self, name: str) -> None:
        """Remove an MCP client"""
        if name in self.clients:
            del self.clients[name]
    
    @contextmanager
    def get_active_clients(self, active_clients: List[str]):
        """Manage active clients context"""
        active_contexts = []
        for client_name in active_clients:
            if client_name in self.clients:
                active_contexts.append(self.clients[client_name])

        if active_contexts:
            with contextlib.ExitStack() as stack:
                for client in active_contexts:
                    stack.enter_context(client)
                yield
        else:
            yield

# Initialize MCP client manager
mcp_manager = MCPClientManager()
```

Streamlit으로 구현한 [app.py](./application/app.py)에서 tool들을 선택하면 mcp_tools를 얻을 수 있습니다. 이후 아래와 같이 agent 생성시에 active client으로 부터 tool list를 가져와서 tools로 활용합니다.

```python
tools = []
for mcp_tool in mcp_servers:
    with mcp_manager.get_active_clients([mcp_tool]) as _:
        client = mcp_manager.get_client(mcp_tool)
        mcp_servers_list = client.list_tools_sync()
        tools.extend(mcp_servers_list)

agent = create_agent(system_prompt, tools)
tool_list = get_tool_list(tools)
```

생성된 agent는 아래와 같이 mcp_manager를 이용해 실행합니다.

```python
with mcp_manager.get_active_clients(mcp_tools) as _:
    agent_stream = agent.stream_async(question)
    
    tool_name = ""
    async for event in agent_stream:
        if "message" in event:
            message = event["message"]
            for content in message["content"]:                
                if "text" in content:
                    final_response = content["text"]
```

### Streamlit에 맞게 출력문 조정하기

Agent를 아래와 같이 실행하여 agent_stream을 얻습니다.

```python
with mcp_manager.get_active_clients(mcp_servers) as _:
    agent_stream = agent.stream_async(question)
```

사용자 경험을 위해서는 stream형태로 출력을 얻을 수 있어야 합니다. 이는 아래와 같이 agent_stream에서 event를 꺼낸후 "data"에서 추출하여 아래와 같이 current_response에 stream 결과를 모아서 보여줍니다.

```python
async for event in agent_stream:
    if "data" in event:
        text_data = event["data"]
        current_response += text_data

        containers["notification"][index].markdown(current_response)
```

Strands agent는 multi step reasoning을 통해 여러번 결과가 나옵니다. 최종 결과를 얻기 위해 아래와 같이 message의 content에서 text를 추출하여 마지막만을 추출합니다. 또한 tool마다 reference가 다르므로 아래와 같이 tool content의 text에서 reference를 추출합니다.  

```python
if "message" in event:
    message = event["message"]
    for msg_content in message["content"]:                
        result = msg_content["text"]
        current_response = ""

        tool_content = msg_content["toolResult"]["content"]
        for content in tool_content:
            content, urls, refs = get_tool_info(tool_name, content["text"])
            if refs:
                for r in refs:
                    references.append(r)
```

generate_image_with_colors라는 tool의 최종 이미지 경로는 아래와 같이 event_loop_metrics에서 추출합하여 image_urls로 활용합니다.

```python
if "event_loop_metrics" in event and \
    hasattr(event["event_loop_metrics"], "tool_metrics") and \
    "generate_image_with_colors" in event["event_loop_metrics"].tool_metrics:
    tool_info = event["event_loop_metrics"].tool_metrics["generate_image_with_colors"].tool
    if "input" in tool_info and "filename" in tool_info["input"]:
        fname = tool_info["input"]["filename"]
        if fname:
            url = f"{path}/{s3_image_prefix}/{parse.quote(fname)}.png"
            if url not in image_urls:
                image_urls.append(url)
```


### MCP

Plugin의 Connector는 MCP를 이용해 구현합니다. 이때 필요한 MCP 설정은 아래를 참조합니다. 

- [Slack](https://github.com/kyopark2014/mcp/blob/main/mcp-slack.md): Slack 내용을 조회하고 메시지를 보낼 수 있습니다. SLACK_TEAM_ID, SLACK_BOT_TOKEN으로 설정합니다.

- [Tavily](https://github.com/kyopark2014/mcp/blob/main/mcp-tavily.md): Tavily를 이용해 인터넷을 검색합니다. [installer.py](./installer.py)에서 secret으로 설정후에 [utils.py](./application/utils.py)에서 TAVILY_API_KEY로 등록하여 활용합니다.

- [RAG](https://github.com/kyopark2014/mcp/blob/main/mcp-rag.md): Knowledge Base를 이용해 RAG를 활용합니다. IAM 인증을 이용하므로 별도로 credential 설정하지 않습니다.

- [web_fetch](https://github.com/kyopark2014/mcp/blob/main/mcp-web-fetch.md): playwright기반으로 url의 문서를 markdown으로 불러올 수 있습니다. 별도 인증이 필요하지 않습니다.

- [Google 메일/캘린더](https://github.com/kyopark2014/mcp/blob/main/mcp-gog.md): 구글 메일을 조회하거나 보낼 수 있습니다. Gog CLI를 설치하여 google 인증을 통해 활용합니다.

- [Notion](https://github.com/kyopark2014/mcp/blob/main/mcp-notion.md): Notion을 읽거나 쓸 수 있습니다. [installer.py](./installer.py)에서 secret으로 설정후에 [utils.py](./application/utils.py)에서 NOTION_TOKEN을 등록하여 활용합니다.

- [text_extraction](https://github.com/kyopark2014/mcp/blob/main/mcp-text-extraction.md): 이미지의 텍스트를 추출합니다. 별도 인증이 필요하지 않습니다.


### Plugin

[Plugin 폴더](./application/plugins)에 plugin을 저장하면 [plugin.py](./application/plugin.py)와 같이 pluin 리스트를 가져와서 왼쪽 메뉴에 표시합니다.

```python
def available_plugins_list():
    plugin_dir = PLUGINS_DIR
    if not os.path.isdir(plugin_dir):
        return []
    
    plugin_list = []
    for plugin in os.listdir(plugin_dir):
        plugin_list.append({"name": plugin})
        
    return plugin_list
```

사용자가 plugin을 선택하면 아래와 같이 [plugin_agent.py](./application/plugin_agent.py)의 run_plugin_agent을 실행합니다. 
  
```python
for plugin in plugin_list:
    if mode == plugin["name"]:
        with st.status("thinking...", expanded=True, state="running") as status:
            containers = {
                "tools": st.empty(),
                "status": st.empty(),
                "notification": [st.empty() for _ in range(1000)],
                "key": st.empty()
            }
        response, image_urls = asyncio.run(plugin_agent.run_plugin_agent(prompt, selected_strands_tools, selected_mcp_servers, plugin["name"], containers))
```

이때, [strands_agent.py](./application/strands_agent.py)와 같이 mcp_server를 초기화하고 strands와 MCP로 제공되는 tool을 설정합니다. 이후에 아래의 get_builtin_tools으로 SKILL 동작에 필요한 tool을 등록합니다. 이때, Strands나 MCP tool들이 SKILL에 필요한 tool들과 같은 이름이 있는지 확인합니다.

```python
init_mcp_clients(mcp_servers)
tools = update_tools(strands_tools, mcp_servers)

builtin_tools = get_builtin_tools()

tool_names = {tool.tool_name for tool in tools}
for bt in builtin_tools:
    if bt.tool_name not in tool_names:
        tools.append(bt)
```

SKILL을 위해 파일을 읽고 쓰는 read_file, write_file 뿐 아니라 script등의 code를 실행하는 execute_code가 필요합니다. get_skill_instructions은 skil의 description을 가져올 때 필요한 tool입니다.

```python
def get_builtin_tools():
    """Return the list of built-in tools for the skill-aware agent."""
    return [execute_code, write_file, read_file, upload_file_to_s3, get_skill_instructions]
```

Agent를 생성할 때에 아래와 같이 plugin 이름과 command에 대한 정보가 필요합니다. 이때 build_system_prompt으로 SKILL/Command를 처리할 수 있는 prompt를 생성합니다.

```python
agent = create_agent(system_prompt, tools, plugin_name, command)

def create_agent(system_prompt: Optional[str], tools: list, plugin_name: Optional[str], command: Optional[str] = None):
    if system_prompt==None:
        system_prompt = (
            "당신의 이름은 서연이고, 질문에 대해 친절하게 답변하는 사려깊은 인공지능 도우미입니다."
            "상황에 맞는 구체적인 세부 정보를 충분히 제공합니다." 
            "모르는 질문을 받으면 솔직히 모른다고 말합니다."
        )

    if not system_prompt or not system_prompt.strip():
        system_prompt = "You are a helpful AI assistant."
    
    # add skills metadata to system prompt
    system_prompt = build_system_prompt(system_prompt, plugin_name, command)

    model = get_model()    
    agent = Agent(
        model=model,
        system_prompt=system_prompt,
        tools=tools,
        conversation_manager=conversation_manager,
    )

    return agent
```

SKILL은 아래와 같이 SKILL_SYSTEM_PROMPT와 실행에 필요한 경로를 가지고 있습니다.

```python
SKILL_USAGE_GUIDE = (
    "\n## Skill 사용 가이드\n"
    "위의 <available_skills>에 나열된 skill이 사용자의 요청과 관련될 때:\n"
    "1. 먼저 get_skill_instructions 도구로 해당 skill의 상세 지침을 로드하세요.\n"
    "2. 지침에 포함된 코드 패턴을 execute_code 도구로 실행하세요.\n"
    "3. skill 지침이 없는 일반 질문은 직접 답변하세요.\n"
)

def build_skill_prompt(plugin_name: str) -> str:
    """Build skill-related prompt: path info, available skills XML, and usage guide."""
    skill_info = selected_skill_info(plugin_name)
    logger.info(f"plugin_name: {plugin_name}, skill_info: {skill_info}")

    if plugin_name != "base":
        default_skill_info = selected_skill_info("base")
        if default_skill_info:
            skill_info.extend(default_skill_info)
            logger.info(f"default_skill_info: {default_skill_info}")

    path_info = (
        f"## Paths (use absolute paths for write_file, read_file)\n"
        f"- WORKING_DIR: {WORKING_DIR}\n"
        f"- ARTIFACTS_DIR: {ARTIFACTS_DIR}\n"
        f"Example: write_file(filepath='{os.path.join(ARTIFACTS_DIR, 'report.drawio')}', content='...')\n\n"
    )

    skills_xml = get_skills_xml(skill_info)
    if skills_xml:
        return f"{SKILL_SYSTEM_PROMPT}\n{path_info}\n{skills_xml}\n{SKILL_USAGE_GUIDE}"
    return f"{SKILL_SYSTEM_PROMPT}\n{path_info}"
```

Command는 사용자의 입력이 슬랙시(/)로 시작할 때에 첫번째 단어를 추출해 활용합니다. 이때, is_command로 해당 plugin에 command 이름을 가지는 markdown 파일이 있는지 확인합니다.

```python
command = None
if plugin.is_command(query, plugin_name):
    command = query.split(" ")[0].lstrip("/")
```

Command를 위한 prompt는 아래와 같습니다. Command의 경우에 SKILL_SYSTEM_PROMPT, 경로, skill 리스트, COMMAND_USAGE_GUIDE를 포함합니다.

```python
COMMAND_USAGE_GUIDE = (
    "\n## Command 사용 가이드\n"
    "위의 <command_instructions>에 따라 사용자 요청을 처리하세요.\n"
    "필요한 경우 get_skill_instructions로 skill 지침을 추가 로드하거나, execute_code, write_file 등 도구를 사용하세요.\n"
)

def build_command_prompt(plugin_name: str, command: str) -> str:
    """Build prompt for command mode: path info, command instructions, and available skills."""
    skill_info = selected_skill_info(plugin_name)
    logger.info(f"plugin_name: {plugin_name}, command: {command}, skill_info: {skill_info}")

    if plugin_name != "base":
        default_skill_info = selected_skill_info("base")
        if default_skill_info:
            skill_info.extend(default_skill_info)
            logger.info(f"default_skill_info: {default_skill_info}")

    path_info = (
        f"## Paths (use absolute paths for write_file, read_file)\n"
        f"- WORKING_DIR: {WORKING_DIR}\n"
        f"- ARTIFACTS_DIR: {ARTIFACTS_DIR}\n"
        f"Example: write_file(filepath='{os.path.join(ARTIFACTS_DIR, 'report.drawio')}', content='...')\n\n"
    )

    command_instructions = get_command_instructions(plugin_name, command)
    command_section = f"## Command Instructions\n<command_instructions>\n{command_instructions}\n</command_instructions>\n\n"

    skills_xml = get_skills_xml(skill_info)
    skills_section = f"{skills_xml}\n" if skills_xml else ""

    return f"{SKILL_SYSTEM_PROMPT}\n{path_info}\n{command_section}\n{skills_section}\n{COMMAND_USAGE_GUIDE}"
```



## 배포하기

### EC2로 배포하기

AWS console의 EC2로 접속하여 [Launch an instance](https://us-west-2.console.aws.amazon.com/ec2/home?region=us-west-2#Instances:)를 선택합니다. [Launch instance]를 선택한 후에 적당한 Name을 입력합니다. (예: es) key pair은 "Proceed without key pair"을 선택하고 넘어갑니다. 

<img width="700" alt="ec2이름입력" src="https://github.com/user-attachments/assets/c551f4f3-186d-4256-8a7e-55b1a0a71a01" />


Instance가 준비되면 [Connet] - [EC2 Instance Connect]를 선택하여 아래처럼 접속합니다. 

<img width="700" alt="image" src="https://github.com/user-attachments/assets/e8a72859-4ac7-46af-b7ae-8546ea19e7a6" />

이후 아래와 같이 python, pip, git, boto3를 설치합니다.

```text
sudo yum install python3 python3-pip git docker -y
pip install boto3
```

Workshop의 경우에 아래 형태로 된 Credential을 복사하여 EC2 터미널에 입력합니다.

<img width="700" alt="credential" src="https://github.com/user-attachments/assets/261a24c4-8a02-46cb-892a-02fb4eec4551" />

아래와 같이 git source를 가져옵니다.

```python
git clone https://github.com/kyopark2014/strands-agent
```

아래와 같이 installer.py를 이용해 설치를 시작합니다.

```python
cd strands-agent && python3 installer.py
```

API 구현에 필요한 credential은 secret으로 관리합니다. 따라서 설치시 필요한 credential 입력이 필요한데 아래와 같은 방식을 활용하여 미리 credential을 준비합니다. 

- 일반 인터넷 검색: [Tavily Search](https://app.tavily.com/sign-in)에 접속하여 가입 후 API Key를 발급합니다. 이것은 tvly-로 시작합니다.  
- 날씨 검색: [openweathermap](https://home.openweathermap.org/api_keys)에 접속하여 API Key를 발급합니다. 이때 price plan은 "Free"를 선택합니다.

설치가 완료되면 아래와 같은 CloudFront로 접속하여 동작을 확인합니다. 

<img width="500" alt="cloudfront_address" src="https://github.com/user-attachments/assets/7ab1a699-eefb-4b55-b214-23cbeeeb7249" />


인프라가 더이상 필요없을 때에는 uninstaller.py를 이용해 제거합니다.

```text
python uninstaller.py
```


### 배포된 Application 업데이트 하기

AWS console의 EC2로 접속하여 [Launch an instance](https://us-west-2.console.aws.amazon.com/ec2/home?region=us-west-2#Instances:)를 선택하여 아래와 같이 아래와 같이 "app-for-es-us"라는 이름을 가지는 instance id를 선택합니다.

<img width="750" alt="image" src="https://github.com/user-attachments/assets/7d6d756a-03ba-4422-9413-9e4b6d3bc1da" />

[connect]를 선택한 후에 Session Manager를 선택하여 접속합니다. 

<img width="700" alt="image" src="https://github.com/user-attachments/assets/d1119cd6-08fb-4d3e-b1c2-77f2d7c1216a" />

이후 아래와 같이 업데이트한 후에 다시 브라우저에서 확인합니다.

```text
cd ~/strands-agent/ && sudo ./update.sh
```

### 실행 로그 확인

[EC2 console](https://us-west-2.console.aws.amazon.com/ec2/home?region=us-west-2#Instances:)에서 "app-for-es-us"라는 이름을 가지는 instance id를 선택 한 후에, EC2의 Session Manager를 이용해 접속합니다. 

먼저 아래와 같이 현재 docker container ID를 확인합니다.

```text
sudo docker ps
```

이후 아래와 같이 container ID를 이용해 로그를 확인합니다.

```text
sudo docker logs [container ID]
```

실제 실행시 결과는 아래와 같습니다.

<img width="600" src="https://github.com/user-attachments/assets/2ca72116-0077-48a0-94be-3ab15334e4dd" />

### Local에서 실행하기

AWS 환경을 잘 활용하기 위해서는 [AWS CLI를 설치](https://docs.aws.amazon.com/ko_kr/cli/v1/userguide/cli-chap-install.html)하여야 합니다. EC2에서 배포하는 경우에는 별도로 설치가 필요하지 않습니다. Local에 설치시는 아래 명령어를 참조합니다.

```text
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" 
unzip awscliv2.zip
sudo ./aws/install
```

AWS credential을 아래와 같이 AWS CLI를 이용해 등록합니다.

```text
aws configure
```

설치하다가 발생하는 각종 문제는 [Kiro-cli](https://aws.amazon.com/ko/blogs/korea/kiro-general-availability/)를 이용해 빠르게 수정합니다. 아래와 같이 설치할 수 있지만, Windows에서는 [Kiro 설치](https://kiro.dev/downloads/)에서 다운로드 설치합니다. 실행시는 셀에서 "kiro-cli"라고 입력합니다. 

```python
curl -fsSL https://cli.kiro.dev/install | bash
```

venv로 환경을 구성하면 편리하게 패키지를 관리합니다. 아래와 같이 환경을 설정합니다.

```text
python -m venv .venv
source .venv/bin/activate
```

이후 다운로드 받은 github 폴더로 이동한 후에 아래와 같이 필요한 패키지를 추가로 설치 합니다.

```text
pip install -r requirements.txt
```

이후 아래와 같은 명령어로 streamlit을 실행합니다. 

```text
streamlit run application/app.py
```



### 실행 결과

"us-west-2의 AWS bucket 리스트는?"와 같이 입력하면, aws cli를 통해 필요한 operation을 수행하고 얻어진 결과를 아래와 같이 보여줍니다.

<img src="https://github.com/user-attachments/assets/d7a99236-185b-4361-8cbf-e5a45de07319" width="600">


MCP로 wikipedia를 설정하고 "strand에 대해 설명해주세요."라고 질문하면 wikipedia의 search tool을 이용하여 아래와 같은 결과를 얻습니다.

<img src="https://github.com/user-attachments/assets/f46e7f47-65e0-49d8-a5c0-49e834ff5de8" width="600">


특정 Cloudwatch의 로그를 읽어서, 로그의 특이점을 확인할 수 있습니다.

<img src="https://github.com/user-attachments/assets/da48a443-bd53-4c2f-a083-cfcd4e954360" width="600">

"Image generation" MCP를 선택하고, "AWS의 한국인 solutions architect의 모습을 그려주세요."라고 입력하면 아래와 같이 이미지를 생성할 수 있습니다.

<img src="https://github.com/user-attachments/assets/a0b46a64-5cb7-4261-82df-b5d4095fdfd2" width="600">


## Reference

[Strands Python Example](https://github.com/strands-agents/docs/tree/main/docs/examples/python)

[Strands Agents SDK](https://strandsagents.com/0.1.x/)

[Strands Agents Samples](https://github.com/strands-agents/samples/tree/main)

[Example Built-in Tools](https://strandsagents.com/0.1.x/user-guide/concepts/tools/example-tools-package/)

[Introducing Strands Agents, an Open Source AI Agents SDK](https://aws.amazon.com/ko/blogs/opensource/introducing-strands-agents-an-open-source-ai-agents-sdk/)

[use_aws.py](https://github.com/strands-agents/tools/blob/main/src/strands_tools/use_aws.py)

[Strands Agents와 오픈 소스 AI 에이전트 SDK 살펴보기](https://aws.amazon.com/ko/blogs/tech/introducing-strands-agents-an-open-source-ai-agents-sdk/)

[Drug Discovery Agent based on Amazon Bedrock](https://github.com/hsr87/drug-discovery-agent)

[Strands Agent - Swarm](https://strandsagents.com/latest/user-guide/concepts/multi-agent/swarm/)

[Strands Agent Streamlit Demo](https://github.com/NB3025/strands-streamlit-chat-demo)


[생성형 AI로 AWS 보안 점검 자동화하기: Q CLI에서 Strands Agents까지](https://catalog.us-east-1.prod.workshops.aws/workshops/89fc3def-0260-4fa7-91ce-623ad9a4d04a/ko-KR)

[AI Agent를 활용한 EKS 애플리케이션 및 인프라 트러블슈팅](https://catalog.us-east-1.prod.workshops.aws/workshops/bbd8a1df-c737-4f88-9d19-17bcecb7e712/ko-KR)

[Strands Agents 및 AgentCore와 함께하는 바이오·제약 연구 어시스턴트 구현하기](https://catalog.us-east-1.prod.workshops.aws/workshops/fe97ac91-ff75-4753-a269-af39e7c3d765/ko-KR)

[Strands Agents & Amazon Bedrock AgentCore 워크샵](https://github.com/hsr87/strands-agents-for-life-science)

[Agentic AI로 구현하는 리뷰 관리 자동화](https://catalog.us-east-1.prod.workshops.aws/workshops/59ea75b5-532c-4b57-982e-e58152ae5c46/ko-KR)

[Strands Agent Workshop (한국어)](https://github.com/chloe-kwak/strands-agent-workshop)

[Agentic AI Workshop: AI Fund Manager](https://catalog.us-east-1.prod.workshops.aws/workshops/a8702b51-fcf3-43b3-8d37-511ef1b38688/ko-KR)

[Agentic AI 펀드 매니저](https://github.com/ksgsslee/investment_advisor_strands)

[Workshop - Strands SDK와 AgentCore를 활용한 에이전틱 AI](https://catalog.workshops.aws/strands/ko-KR)
