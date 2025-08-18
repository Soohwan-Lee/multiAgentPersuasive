# 다중 에이전트 설득 실험 (Multi-Agent Persuasive Experiment)

Next.js 14 (App Router, TypeScript)를 사용한 단일 참가자 × 다중 에이전트 온라인 실험 웹 애플리케이션입니다. Vercel에 배포되며, Supabase를 데이터 저장소로 사용합니다.

## 🚀 주요 기능

- **다중 에이전트 오케스트레이션**: 3개의 AI 에이전트가 동시에 응답
- **패턴 기반 에이전트 배치**: Majority/Minority 패턴에 따른 에이전트 스탠스 결정
- **세션별 프레이밍**: Normative vs Informative 설득 프레이밍
- **t0 초기 응답**: 각 세션 시작 시 참가자의 초기 의견 및 확신도 측정
- **멱등성 보장**: 중복 요청 방지 및 안정적인 상태 관리
- **타임아웃 및 폴백**: 12초 타임아웃 시 자동 폴백 응답
- **Prolific 통합**: 완전한 Prolific 워크플로우 지원
- **실시간 진행 추적**: 세션별 진행 상황 및 턴 관리
- **반응형 UI**: Tailwind CSS를 사용한 모던한 인터페이스

## 📋 실험 플로우

1. **입장** (`/entry`) - Prolific 파라미터 캡처 및 패턴 할당
2. **소개** (`/introduction`) - 실험 설명
3. **배경 설문** (`/survey/background`) - 인구통계학적 정보
4. **테스트 세션** (`/session/test`) - t0 + 4턴 실험 (연습)
5. **메인 세션 1** (`/session/main1`) - t0 + 4턴 실험 (Normative)
6. **메인 세션 2** (`/session/main2`) - t0 + 4턴 실험 (Informative)
7. **자기보고 설문** (`/survey/post-self`) - 설득 효과 측정
8. **개방형 설문** (`/survey/post-open`) - 자유 응답
9. **완료** (`/finish`) - Prolific 완료 리다이렉트

### 세션별 구조
- **t0**: 초기 의견 (-50 ~ +50) 및 확신도 (0 ~ 100) 측정
- **턴 1-4**: 메시지 교환 → 에이전트 응답 → 공개 응답 (턴 4에서는 개인 신념도 추가)

## 🛠 기술 스택

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase
- **Database**: PostgreSQL (Supabase)
- **AI**: OpenAI GPT-4
- **State Management**: Zustand
- **Validation**: Zod
- **UI Components**: ShadCN UI
- **Icons**: Lucide React

## 📦 설치 및 설정

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 변수들을 설정하세요:

```env
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# OpenAI API 설정
OPENAI_API_KEY=your-openai-api-key
LLM_MODEL=gpt-4o-mini

# Prolific 설정
PROLIFIC_COMPLETION_CODE=your-prolific-completion-code

# 선택적 에이전트 프롬프트 (설정하지 않으면 기본값 사용)
AGENT_SYSTEM_PROMPT_1=your_custom_agent1_prompt
AGENT_SYSTEM_PROMPT_2=your_custom_agent2_prompt
AGENT_SYSTEM_PROMPT_3=your_custom_agent3_prompt
```

### 3. Supabase 데이터베이스 설정

1. Supabase 프로젝트 생성
2. SQL 편집기에서 `migrations/001_create_tables.sql` 실행
3. 또는 마이그레이션 스크립트 실행:

```bash
npm run db:migrate
```

### 4. 개발 서버 실행

```bash
npm run dev
```

## 🗄 데이터베이스 스키마

### participants
- 참가자 기본 정보 (Prolific ID, Study ID, Session ID)
- 실험 조건 및 완료 시간

### sessions
- 세션별 진행 상황 (test, main1, main2)
- 현재 턴 및 완료 상태

### turns
- 턴별 사용자 메시지 및 선택
- 공개/개인 신념 및 확신도

### messages
- 모든 메시지 기록 (사용자 + 3개 에이전트)
- 응답 시간, 토큰 사용량, 폴백 사용 여부

### events
- 실험 진행 중 이벤트 로깅
- 설문 응답 및 시스템 이벤트

## 🔧 개발 도구

### 시드 데이터 생성

```bash
npm run db:seed
```

더미 참가자를 생성하고 테스트 세션으로 진행할 수 있는 URL을 제공합니다.

### 마이그레이션 실행

```bash
npm run db:migrate
```

데이터베이스 스키마를 생성합니다.

## 🚀 배포 (Vercel)

### 1. Vercel 프로젝트 생성

```bash
vercel
```

### 2. 환경 변수 설정

Vercel 대시보드에서 다음 환경 변수들을 설정하세요:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `PROLIFIC_COMPLETION_CODE`

### 3. 빌드 설정

- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`

## 📊 Prolific 설정

### URL 파라미터

실험 URL에 다음 파라미터들이 포함되어야 합니다:

```
https://your-app.vercel.app/entry?PROLIFIC_PID={{%PROLIFIC_PID%}}&STUDY_ID={{%STUDY_ID%}}&SESSION_ID={{%SESSION_ID%}}
```

### 완료 리다이렉트

실험 완료 시 다음 URL로 리다이렉트됩니다:

```
https://app.prolific.com/submissions/complete?cc={PROLIFIC_COMPLETION_CODE}
```

## 🔍 API 엔드포인트

### POST `/api/t0`
t0 초기 응답 처리 (의견 및 확신도)

### POST `/api/turn`
턴 처리 및 에이전트 오케스트레이션 (턴 1-4)

### POST `/api/response`
턴별 응답 제출 (공개/개인 의견 및 확신도)

### GET `/api/state?participantId=...`
참가자 현재 상태 조회

### POST `/api/participants/upsert`
참가자 생성/업데이트 (패턴 할당 포함)

### POST `/api/prolific/commit`
Prolific 완료 처리

## 🧪 테스트

### 단위 테스트

```bash
npm test
```

### 통합 테스트

```bash
npm run test:integration
```

## 📝 개발 가이드

### 새로운 페이지 추가

1. `src/app/` 디렉토리에 새 폴더 생성
2. `page.tsx` 파일 생성
3. `ProgressHeader` 컴포넌트 사용하여 진행 상황 표시

### 새로운 API 엔드포인트 추가

1. `src/app/api/` 디렉토리에 새 폴더 생성
2. `route.ts` 파일 생성
3. Zod 스키마로 입력 검증

### 컴포넌트 추가

1. `src/components/` 디렉토리에 새 컴포넌트 생성
2. TypeScript 타입 정의
3. ShadCN UI 컴포넌트 활용

## 🤝 기여하기

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 🎯 실험 설계

### 패턴 할당
- **Majority**: 모든 에이전트가 참가자의 초기 의견과 반대 입장
- **Minority**: 2개 에이전트는 참가자와 같은 입장, 1개 에이전트는 반대 입장
- 참가자별로 랜덤 할당되며 모든 세션에 동일하게 적용

### 세션별 프레이밍
- **Test**: 연습 세션, 단순한 논리적 논증
- **Main1 (Normative)**: 사회적 규범, 승인, 평판에 초점
- **Main2 (Informative)**: 증거, 정확성, 불확실성 감소에 초점

### 에이전트 구성
- **Agent 1 (Red)**: 기본적으로 Minority 패턴에서 소수 의견 담당
- **Agent 2 (Green)**: Majority 패턴에서 다수 의견 담당
- **Agent 3 (Blue)**: Majority 패턴에서 다수 의견 담당

## 📄 라이선스

MIT License

## 📞 지원

문제가 발생하거나 질문이 있으시면 이슈를 생성해주세요.
