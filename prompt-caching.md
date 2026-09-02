# Prompt Caching

Strands 에이전트는 tool loop마다 동일한 **system prompt + tool schema**를 Bedrock에 다시 보냅니다. [Amazon Bedrock prompt caching](https://docs.aws.amazon.com/bedrock/latest/userguide/prompt-caching.html)과 Strands SDK cache 옵션으로 이 정적 prefix를 재사용합니다. 구현은 [`application/strands_agent.py`](./application/strands_agent.py)의 `get_model()`에 있습니다.

## 대상 모델

| 경로 | model_type | 캐싱 방식 |
|------|------------|-----------|
| **Claude / Nova** | `claude`, `nova` | Strands `CacheConfig` / `cache_tools` / `cache_prompt` (5m) |
| **GPT 5.6+ (Mantle)** | `openai` | `MantleGPTResponsesModel` explicit (30m) |
| **GPT 5.5 이하** | `openai` | AWS implicit (자동) |

## Claude / Nova

`get_model()`에서 `BedrockModel` 생성 시 `_prompt_cache_kwargs()`를 전달합니다.

## GPT 5.6+ (Mantle)

`MantleGPTResponsesModel`이 system prompt를 `input` developer message + `prompt_cache_breakpoint`로 보냅니다. `prompt_cache_key`는 `{projectName}:{user_id}:strands` 형식입니다.

## 참고

- [Prompt caching (AWS)](https://docs.aws.amazon.com/bedrock/latest/userguide/prompt-caching.html)
- [GPT-5.6 explicit caching (AWS Blog)](https://aws.amazon.com/blogs/machine-learning/introducing-explicit-prompt-caching-for-openai-gpt-5-6-models-on-amazon-bedrock/)
