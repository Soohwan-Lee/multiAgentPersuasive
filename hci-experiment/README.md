# Multi-Agent Persuasive Experiment

A Next.js 14 (App Router, TypeScript) application for single-participant × multi-agent online experiments. Deployed on Vercel with Supabase for data storage and Prolific integration.

## 🚀 Key Features

- **Multi-Agent Orchestration**: 3 AI agents responding simultaneously
- **Pattern-Based Agent Placement**: Majority/Minority/MinorityDiffusion patterns
- **Session-Specific Framing**: Normative vs Informative persuasion framing
- **T0-T4 Response System**: Initial response + 4 chat cycles with slider responses
- **Idempotency Guarantee**: Duplicate request prevention and stable state management
- **Timeout & Fallback**: 12-second timeout with automatic fallback responses
- **Prolific Integration**: Complete Prolific workflow support
- **Real-time Progress Tracking**: Session-by-session progress and cycle management
- **Responsive UI**: Modern interface using Tailwind CSS

## 📋 Experiment Flow

1. **Entry** (`/entry`) - Capture Prolific parameters and assign patterns
2. **Introduction** (`/introduction`) - Experiment explanation
3. **Background Survey** (`/survey/background`) - Demographic information
4. **Test Session** (`/session/test`) - T0 + 4 cycles (practice)
5. **Main Session 1** (`/session/main1`) - T0 + 4 cycles (Normative)
6. **Main Session 2** (`/session/main2`) - T0 + 4 cycles (Informative)
7. **Post-Self Survey** (`/survey/post-self`) - Persuasion effectiveness measurement
8. **Post-Open Survey** (`/survey/post-open`) - Free response
9. **Finish** (`/finish`) - Prolific completion redirect

### Session Structure
- **T0**: Initial opinion (-50 ~ +50) and confidence (0 ~ 100) measurement
- **Cycles 1-4**: Message exchange → Agent responses → Response panel (sliders + RT)
- **Each cycle**: User message → Agent 1 → Agent 2 → Agent 3 → Response panel

## 🛠 Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase
- **Database**: PostgreSQL (Supabase)
- **AI**: OpenAI GPT-4
- **State Management**: React hooks
- **Validation**: Zod
- **UI Components**: ShadCN UI
- **Icons**: Lucide React

## 📦 Installation & Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create `.env.local` file with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key
LLM_MODEL=gpt-4o-mini

# Prolific Configuration
PROLIFIC_COMPLETION_CODE=your-prolific-completion-code

# Optional Agent System Prompts (if not set, default prompts will be used)
AGENT_SYSTEM_PROMPT_1=your_custom_agent1_prompt
AGENT_SYSTEM_PROMPT_2=your_custom_agent2_prompt
AGENT_SYSTEM_PROMPT_3=your_custom_agent3_prompt
```

### 3. Supabase Database Setup

1. Create a Supabase project
2. Run the SQL scripts in the SQL editor:
   - `migrations/001_create_tables.sql`
   - `migrations/002_update_schema.sql`

### 4. Development Server

```bash
npm run dev
```

## 🗄 Database Schema

### participants
- Basic participant information (Prolific ID, Study ID, Session ID)
- Experiment condition and completion time

### sessions
- Session progress (test, main1, main2)
- Current response index and cycle

### responses
- T0-T4 responses with opinion, confidence, and response time
- Each response: opinion (-50 to +50), confidence (0 to 100), RT_ms

### turns
- Chat cycle information (cycles 1-4)
- User messages and metadata

### messages
- All message records (user + 3 agents)
- Response time, token usage, fallback usage

### events
- Experiment progress event logging
- Survey responses and system events

## 🔧 Development Tools

### Seed Data Generation

```bash
npm run db:seed
```

Creates a dummy participant and provides a URL to advance to the test session.

### Migration Execution

```bash
npm run db:migrate
```

Creates the database schema.

## 🚀 Deployment (Vercel)

### 1. Create Vercel Project

```bash
vercel
```

### 2. Environment Variables

Set the following environment variables in Vercel dashboard:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `PROLIFIC_COMPLETION_CODE`

### 3. Build Settings

- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`

## 📊 Prolific Setup

### URL Parameters

The experiment URL should include these parameters:

```
https://your-app.vercel.app/entry?PROLIFIC_PID={{%PROLIFIC_PID%}}&STUDY_ID={{%STUDY_ID%}}&SESSION_ID={{%SESSION_ID%}}
```

### Completion Redirect

Upon experiment completion, participants are redirected to:

```
https://app.prolific.com/submissions/complete?cc={PROLIFIC_COMPLETION_CODE}
```

## 🔍 API Endpoints

### POST `/api/response`
Handle T0-T4 responses (opinion, confidence, RT_ms)

### POST `/api/cycle`
Process chat cycles and agent orchestration (cycles 1-4)

### GET `/api/state?participantId=...`
Get participant current state

### POST `/api/participants/upsert`
Create/update participants (pattern assignment included)

### POST `/api/prolific/commit`
Handle Prolific completion

## 🧪 Testing

### Unit Tests

```bash
npm test
```

### Integration Tests

```bash
npm run test:integration
```

## 📝 Development Guide

### Adding New Pages

1. Create new folder in `src/app/` directory
2. Create `page.tsx` file
3. Use `ProgressHeader` component to show progress

### Adding New API Endpoints

1. Create new folder in `src/app/api/` directory
2. Create `route.ts` file
3. Use Zod schema for input validation

### Adding Components

1. Create new component in `src/components/` directory
2. Define TypeScript types
3. Use ShadCN UI components

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 🎯 Experiment Design

### Pattern Assignment
- **Majority**: All agents take opposite stance to T0 across C1..C4
- **Minority**: A1/A2 match T0 stance; A3 opposite across C1..C4
- **MinorityDiffusion**: A1 flips before C3, A2 flips before C4
- Randomly assigned per participant and applied consistently across all sessions

### Session-Specific Framing
- **Test**: Practice session, simple logical arguments
- **Main1 (Normative)**: Focus on social norms, approval, reputation
- **Main2 (Informative)**: Focus on evidence, accuracy, uncertainty reduction

### Agent Configuration
- **Agent 1 (Red)**: Default minority agent in minority patterns
- **Agent 2 (Green)**: Majority agent in majority patterns
- **Agent 3 (Blue)**: Minority agent in minority patterns

### Response-Chat Cycle Flow
- **T0**: Initial opinion and confidence measurement
- **C1**: Chat between T0 and T1
- **T1**: Response after C1
- **C2**: Chat between T1 and T2
- **T2**: Response after C2
- **C3**: Chat between T2 and T3
- **T3**: Response after C3
- **C4**: Chat between T3 and T4
- **T4**: Final response

## 📄 License

MIT License

## 📞 Support

If you encounter issues or have questions, please create an issue.
