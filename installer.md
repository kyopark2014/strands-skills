# AWS Infrastructure Installer

boto3를 사용하여 Strands Skills 애플리케이션에 필요한 AWS 백엔드 리소스를 생성하는 Python 스크립트입니다.

## 목차

1. [개요](#개요)
2. [설정값](#설정값)
3. [생성되는 리소스](#생성되는-리소스)
4. [공유 리소스](#공유-리소스)
5. [주요 함수](#주요-함수)
6. [실행 방법](#실행-방법)
7. [배포 순서](#배포-순서)
8. [리소스 제거](#리소스-제거)

---

## 개요

이 스크립트는 **Strands Skills** 애플리케이션에 필요한 AWS 백엔드 리소스를 자동으로 생성합니다. 애플리케이션은 로컬에서 `streamlit run application/app.py`로 실행합니다.

ALB·EC2 배포는 별도 프로젝트에서 관리하며, 이 installer는 **로컬 개발용 백엔드**만 프로비저닝합니다.

### 주요 특징
- **완전 자동화**: 단일 스크립트로 백엔드 인프라 배포
- **멱등성**: 이미 존재하는 리소스는 재사용
- **공유 RAG 인프라**: OpenSearch, S3, CloudFront, Knowledge Base는 `agent-skills` 등과 공유 가능
- **에러 핸들링**: 각 단계별 예외 처리
- **로깅**: 상세한 배포 진행 상황 출력

---

## 설정값

```python
# 프로젝트 전용
project_name = "strands-skills"        # 프로젝트 이름 (최소 3자)
region = "us-west-2"                   # AWS 리전
AGENTCORE_GATEWAY_REGION = "us-east-1"

# 공유 RAG 리소스 (agent-skills와 동일)
vector_index_name = "rag-project"
cloudfront_comment = "CloudFront-for-rag-project"
oai_comment = f"OAI for {vector_index_name}"

# 자동 생성되는 변수
account_id = sts_client.get_caller_identity()["Account"]
bucket_name = f"storage-for-rag-project-{account_id}-{region}"
knowledge_base_name = vector_index_name
knowledge_base_role_name = f"role-knowledge-base-for-{vector_index_name}-{region}"
```

---

## 생성되는 리소스

### 1. S3 버킷 (공유)
- **이름**: `storage-for-rag-project-{account_id}-{region}`
- **설정**:
  - CORS 활성화 (GET, POST, PUT)
  - 퍼블릭 액세스 차단
  - `docs/`, `artifacts/` 폴더 자동 생성

### 2. IAM 역할

| 역할 | 범위 | 설명 |
|------|------|------|
| `role-knowledge-base-for-rag-project-{region}` | 공유 | Bedrock Knowledge Base용 역할 |
| `role-agent-for-strands-skills-{region}` | 프로젝트 전용 | Strands Agent용 역할 |
| `role-agentcore-memory-for-strands-skills-{region}` | 프로젝트 전용 | AgentCore Memory용 역할 |
| `role-agentcore-gateway-websearch-for-strands-skills` | 프로젝트 전용 | AgentCore Web Search Gateway용 역할 |

### 3. Secrets Manager (프로젝트 전용)
- `tavilyapikey-strands-skills`: Tavily API 키 (인터넷 검색)
- `notionapikey-strands-skills`: Notion API 키
- `slackapikey-strands-skills`: Slack Team ID / Bot Token

배포 시 프롬프트로 API 키를 입력할 수 있으며, Enter만 누르면 빈 값으로 생성됩니다.

### 4. OpenSearch Serverless (공유)
- **컬렉션**: `rag-project` (VECTORSEARCH)
- **정책**:
  - `enc-rag-project-{region}` (암호화)
  - `net-rag-project-{region}` (네트워크)
  - `data-rag-project` (데이터 액세스)
- **인덱스**: `rag-project` — KNN 벡터 검색 (1024차원)

### 5. Bedrock Knowledge Base (공유)
- **이름**: `rag-project`
- **스토리지**: OpenSearch Serverless (`rag-project` 컬렉션)
- **임베딩 모델**: Amazon Titan Embed Text v2 (1024차원)
- **파싱 모델**: Claude Sonnet 4
- **청킹**: Hierarchical (1500/300 토큰, overlap 60)
- **Data Source**: S3 `docs/` prefix

### 6. CloudFront (공유, S3 오리진)
- **Comment**: `CloudFront-for-rag-project`
- **오리진**: 공유 S3 버킷 (`docs/`, `artifacts/` 등 정적 컨텐츠 공유용)
- **OAI**: S3 버킷 정책으로 CloudFront 접근 허용
- **sharing_url**: `https://{cloudfront_domain}` → `application/config.json`에 저장

### 7. AgentCore Web Search Gateway (공유 가능)
- **Gateway**: `gateway-websearch` (`us-east-1`)
- **Target**: 관리형 `web-search` 커넥터
- 이미 존재하면 재사용

---

## 공유 리소스

`agent-skills`와 동일한 RAG 인프라를 사용합니다. 한 프로젝트에서 먼저 배포했다면 다른 프로젝트는 기존 리소스를 재사용합니다.

| 리소스 | 식별자 |
|--------|--------|
| S3 버킷 | `storage-for-rag-project-{account_id}-us-west-2` |
| OpenSearch 컬렉션 | `rag-project` |
| Knowledge Base | `rag-project` |
| CloudFront | `CloudFront-for-rag-project` |
| AgentCore Gateway | `gateway-websearch` (us-east-1) |

프로젝트별로 독립적으로 유지되는 리소스는 **Secrets**, **Agent IAM 역할**, **AgentCore Memory 역할**입니다.

---

## 주요 함수

### 인프라 생성 함수

| 함수 | 설명 |
|------|------|
| `create_secrets()` | Tavily / Notion / Slack 시크릿 생성 |
| `create_s3_bucket()` | S3 버킷 생성 및 CORS, 퍼블릭 액세스 차단 설정 |
| `create_knowledge_base_role()` | Knowledge Base IAM 역할 생성 |
| `create_agent_role()` | Strands Agent IAM 역할 생성 |
| `create_agentcore_memory_role()` | AgentCore Memory IAM 역할 생성 |
| `create_agentcore_websearch_gateway_role()` | Web Search Gateway IAM 역할 생성 |
| `get_or_create_agentcore_websearch_gateway()` | Gateway 및 Target 생성/재사용 |
| `create_opensearch_collection()` | OpenSearch Serverless 컬렉션 및 보안 정책 생성 |
| `create_knowledge_base_with_opensearch()` | Bedrock Knowledge Base 및 Data Source 생성 |
| `create_cloudfront_distribution()` | S3 오리진 CloudFront 배포 생성 (OAI + 버킷 정책) |
| `build_app_environment()` / `write_application_config()` | `application/config.json` 생성 및 갱신 |

### OpenSearch 공유 헬퍼

| 함수 | 설명 |
|------|------|
| `_ensure_opensearch_data_access_principals()` | 공유 컬렉션 데이터 액세스 정책에 설치자/KB 역할 추가 |
| `_find_opensearch_data_policy_name()` | 기존 데이터 액세스 정책 탐색 |
| `_shared_opensearch_policy_names()` | 공유 정책 이름 반환 |

---

## 실행 방법

### 사전 요구사항
- Python 3.x, boto3
- AWS 자격 증명 설정 (`aws configure` 또는 환경 변수)
- Bedrock, OpenSearch Serverless, AgentCore 관련 IAM 권한

### 인프라 배포

```bash
cd strands-skills
python installer.py
```

### 로컬 애플리케이션 실행

```bash
streamlit run application/app.py
```

---

## 배포 순서

```
[1/6] Secrets Manager 시크릿 생성 (tavily, notion, slack)
       ↓
[2/6] S3 버킷 생성 (공유 버킷, 없으면 생성)
       ↓
[3/6] IAM 역할 생성
       • Knowledge Base / Agent / AgentCore Memory 역할
       • AgentCore Web Search Gateway 역할 및 Gateway 생성
       ↓
[4/6] OpenSearch Serverless 컬렉션 생성 (공유, 없으면 생성)
       ↓
[5/6] Bedrock Knowledge Base 생성 (공유, 없으면 생성)
       ↓
[6/6] CloudFront 배포 생성 (S3 오리진, 없으면 생성)
       ↓
application/config.json 업데이트 (sharing_url 포함)
```

---

## 배포 완료 후

```
================================================================
Infrastructure Deployment Completed Successfully!
================================================================
  S3 Bucket: storage-for-rag-project-{account_id}-us-west-2
  CloudFront Domain: https://xxxxxxxxx.cloudfront.net
  OpenSearch Endpoint: https://xxxxxxxx.us-west-2.aoss.amazonaws.com
  Knowledge Base ID: XXXXXXXXXX
  Knowledge Base Role: arn:aws:iam::...

Total deployment time: XX.XX minutes
Run locally: streamlit run application/app.py
================================================================
```

### `application/config.json`에 저장되는 주요 필드

| 필드 | 설명 |
|------|------|
| `knowledge_base_id` | Bedrock Knowledge Base ID |
| `knowledge_base_role` | KB IAM 역할 ARN |
| `collectionArn` | OpenSearch 컬렉션 ARN |
| `opensearch_url` | OpenSearch 엔드포인트 |
| `s3_bucket` / `s3_arn` | S3 버킷 이름 및 ARN |
| `sharing_url` | CloudFront URL |
| `agentcore_memory_role` | AgentCore Memory 역할 ARN |
| `agentcore_websearch_gateway_*` | Web Search Gateway 정보 |

### 주의사항
- `application/config.json` 파일이 자동으로 업데이트됩니다
- Gateway는 `us-east-1`에 생성되며, 애플리케이션 리전(`us-west-2`)과 다릅니다
- CloudFront 배포 완료까지 15~20분이 걸릴 수 있습니다
- 공유 리소스를 삭제하면 `agent-skills` 등 다른 프로젝트에도 영향을 줍니다

---

## 리소스 제거

프로젝트 전용 리소스만 제거하려면:

```bash
python uninstaller.py
```

공유 리소스(S3, CloudFront, OpenSearch, Knowledge Base)까지 삭제하려면 별도 플래그가 필요합니다:

```bash
python uninstaller.py \
  --delete-s3-bucket \
  --delete-cloudfront \
  --delete-opensearch \
  --delete-knowledge-base
```

자세한 내용은 `uninstaller.py`의 `--help`를 참조하세요.

---

## 에러 처리

| 상황 | 처리 방법 |
|------|----------|
| 리소스 이미 존재 | 기존 리소스 재사용 |
| OpenSearch 정책 이미 존재 | 기존 정책에 principal 추가 |
| CloudFront 비활성화 필요 | uninstaller에서 disable 후 삭제 |
| 타임아웃 | 재시도 로직 적용 (컬렉션, KB 활성화 대기) |

배포 실패 시에도 완료된 단계까지의 정보는 `application/config.json`에 부분 저장됩니다.
