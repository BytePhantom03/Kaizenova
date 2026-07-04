# KAIZENOVA
## AI-Powered Adaptive Interview Preparation & Growth Platform
### Complete Production-Grade Execution Blueprint

> **Tagline:** *"Continuous Improvement Without Limits"*

---

# TABLE OF CONTENTS

1. [Product Understanding](#1-product-understanding)
2. [Functional Requirements](#2-functional-requirements)
3. [Non-Functional Requirements](#3-non-functional-requirements)
4. [Complete System Architecture](#4-complete-system-architecture)
5. [Database Architecture](#5-database-architecture)
6. [API Design](#6-api-design)
7. [AI Architecture](#7-ai-architecture)
8. [Free AI Stack Research](#8-free-ai-stack-research)
9. [Frontend Architecture](#9-frontend-architecture)
10. [Backend Architecture](#10-backend-architecture)
11. [UI/UX Design Blueprint](#11-uiux-design-blueprint)
12. [DevOps & Deployment](#12-devops--deployment)
13. [Security Architecture](#13-security-architecture)
14. [Analytics & Metrics](#14-analytics--metrics)
15. [Development Roadmap](#15-development-roadmap)
16. [Testing Strategy](#16-testing-strategy)
17. [Risk Analysis](#17-risk-analysis)
18. [Future Scaling Strategy](#18-future-scaling-strategy)
19. [Cost Optimization](#19-cost-optimization)
20. [Final Deliverables](#20-final-deliverables)

---

# 1. PRODUCT UNDERSTANDING

## 1.1 Core Objective

Kaizenova is an AI-powered interview preparation platform that dynamically adapts question difficulty in real time based on a candidate's answer quality, confidence, communication skills, and technical accuracy. It acts simultaneously as an AI interviewer, mentor, evaluator, and growth tracker.

## 1.2 Target Users

| Segment | Description |
|---|---|
| **Primary** | College students preparing for placements (CSE, IT, Data Science) |
| **Secondary** | Early-career professionals (0–3 years) seeking job switches |
| **Tertiary** | Coding bootcamp graduates targeting tech roles |
| **Aspirational** | Self-taught developers entering the job market |

## 1.3 Main Problem Being Solved

Current platforms suffer from:

- Static, non-adaptive question banks
- No real-time difficulty adjustment
- Zero confidence or communication evaluation
- No personalized improvement roadmaps
- No long-term growth tracking or streak systems
- Inability to identify root causes of weak performance
- No resume-aware or company-aware interview simulation

## 1.4 Product Vision

Kaizenova is not a mock interview tool. It is an **AI-powered Interview Growth Operating System** — a continuous feedback loop that measures, evaluates, adapts, and improves every dimension of interview readiness through personalized, data-driven coaching.

## 1.5 Competitive Advantage

| Feature | Kaizenova | Pramp | InterviewBit | LeetCode |
|---|---|---|---|---|
| Adaptive Difficulty | ✅ | ❌ | ❌ | ❌ |
| Real-Time Confidence Analysis | ✅ | ❌ | ❌ | ❌ |
| Communication Evaluation | ✅ | ❌ | ❌ | ❌ |
| Resume-Based Questions | ✅ | ❌ | ❌ | ❌ |
| Company-Specific Mode | ✅ | ❌ | ✅ | ❌ |
| Growth Streak Tracking | ✅ | ❌ | ❌ | ✅ |
| Personalized Roadmaps | ✅ | ❌ | ✅ | ❌ |
| Fully AI-Powered | ✅ | ❌ | ❌ | ❌ |

## 1.6 Unique Selling Proposition (USP)

> **"Kaizenova is the only interview platform that adapts to YOU in real time — measuring not just what you know, but how you say it, how confident you sound, and how consistently you practice."**

---

# 2. FUNCTIONAL REQUIREMENTS

---

## 2.1 Authentication Module

**Purpose:** Secure user identity management and session handling.

**Inputs:**
- Email, password (email/password auth)
- OAuth token (Google/GitHub OAuth)
- Refresh token (session renewal)

**Outputs:**
- JWT access token (15 min expiry)
- JWT refresh token (7 day expiry)
- User session object

**Business Logic:**
- bcrypt password hashing (cost factor 12)
- JWT issued on successful login
- Refresh token stored in HttpOnly cookie
- Google OAuth 2.0 flow with PKCE
- Account verification email on registration
- Password reset via time-limited token (15 min)

**Edge Cases:**
- Duplicate email registration → return conflict error
- Expired refresh token → force re-login
- Multiple simultaneous sessions → allow, track device
- Failed OAuth → fallback to email login prompt

**Success Criteria:**
- Login completes in < 500ms
- Tokens validated on every protected route
- Zero unauthorized access incidents

---

## 2.2 User Management Module

**Purpose:** User profile creation, updates, and settings management.

**Inputs:**
- Name, education, experience level
- Target role, target company
- Skills array, domains of interest
- Profile photo (optional)

**Outputs:**
- Complete user profile object
- Skill-domain mapping for question generation
- Profile completeness score (0–100%)

**Business Logic:**
- Profile setup wizard (multi-step form)
- Profile completeness gate (≥ 60% to start interview)
- Skills stored as many-to-many with domain taxonomy
- Experience level maps to initial difficulty (Beginner/Mid/Advanced)

**Edge Cases:**
- Incomplete profile → prevent interview start with prompt
- User changes target role → reset readiness baseline
- Duplicate skill entries → deduplicate silently

**Success Criteria:**
- Profile setup < 3 minutes
- 80% of users complete profile in first session

---

## 2.3 Interview Engine

**Purpose:** Orchestrate the full AI interview session lifecycle.

**Inputs:**
- Interview type (Technical/HR/Behavioral/Coding/Resume)
- Difficulty setting (Beginner/Intermediate/Advanced/Adaptive)
- Duration (15/30/45/60 minutes)
- User profile, domain, role

**Outputs:**
- Ordered question sequence
- Real-time evaluation per answer
- Session state (current difficulty, score history)
- Completion status and final report trigger

**Business Logic:**
- Session initialization: fetch user profile → select question strategy
- Round 1: Fixed "Tell me about yourself" (confidence baseline)
- Round 2+: Adaptive question selection based on running score
- Timer management: question countdown + session total countdown
- Session auto-save every 60 seconds (crash recovery)
- Graceful exit: partial session saved and resumable (if < 50% complete)

**Edge Cases:**
- User disconnects mid-session → save state, allow resume within 30 min
- All questions at a level exhausted → fallback to adjacent domain
- AI service timeout → queue answer, process async, notify user
- Zero-length answer → prompt user, do not penalize

**Success Criteria:**
- Session start to first question < 2 seconds
- 95% of sessions complete without crash
- Answer evaluation returned < 3 seconds

---

## 2.4 Adaptive Difficulty Engine

**Purpose:** Dynamically adjust question difficulty based on real-time performance.

**Inputs:**
- Running weighted score (Technical 40%, Communication 20%, Confidence 15%, Completeness 15%, Grammar 10%)
- Current difficulty level (1–4)
- Consecutive question performance history (last 3 answers)

**Outputs:**
- Next difficulty level decision (increase/maintain/decrease)
- Selected question from appropriate level

**Business Logic:**
- Score > 85 for 2 consecutive answers → increase difficulty
- Score 60–85 → maintain current difficulty
- Score < 60 for 2 consecutive answers → reduce difficulty
- Never reduce below Level 1, never increase above Level 4
- Difficulty changes logged to session state

**Edge Cases:**
- Oscillating scores → stabilize with rolling average (last 3)
- New domain entered → reset to Level 2 (not Level 1, not max)
- User skips question → treated as Score 50 (neutral, no penalty)

**Success Criteria:**
- Difficulty transition logic fires correctly 100% of the time
- No question repeated within same session

---

## 2.5 AI Evaluation System

**Purpose:** Score every candidate answer across five dimensions.

**Inputs:**
- Transcribed answer text
- Expected answer (from question bank)
- Domain context
- Audio waveform (for confidence)

**Outputs:**
- Dimension scores (0–100 each)
- Weighted composite score
- Identified correct, missing, and wrong concepts
- Actionable feedback string per dimension

**Business Logic:**
- Technical Accuracy: semantic similarity + concept extraction vs expected answer
- Communication: structure score (intro/body/conclusion detection), clarity
- Grammar: LanguageTool API error count → score
- Fluency: WPM analysis, pause detection, filler word count
- Confidence: Librosa audio features (pitch variance, speaking pace, silence ratio)

**Edge Cases:**
- Very short answer (< 20 words) → flag as incomplete, cap score at 40
- Answer in wrong language → detect, prompt re-answer
- AI evaluation service down → return cached similar question score + flag for review

**Success Criteria:**
- Evaluation matches expert human score within ±10 points (85% of cases)
- Evaluation latency < 3 seconds per answer

---

## 2.6 Speech Analysis System

**Purpose:** Extract spoken language metrics from user audio.

**Inputs:**
- Raw audio file/stream (WAV/WebM)
- Session context

**Outputs:**
- Transcribed text (Whisper)
- Words per minute (WPM)
- Pause count and average pause duration
- Filler word count and types
- Confidence score from voice features

**Business Logic:**
- Whisper Large V3 for transcription
- WPM = (word count / duration in seconds) × 60
- Pause Detection: silence > 0.5 seconds counted as pause
- Filler Words: regex + pattern match on transcript ("umm", "ahh", "like", "basically", "you know")
- Confidence: Librosa RMS energy + pitch stability → normalize 0–100

**Edge Cases:**
- Background noise → Whisper handles natively; add noise flag if SNR < threshold
- Non-English accent → Whisper multilingual model handles; flag for review
- Very quiet audio → detect, prompt user to re-record
- User types instead of speaks → accept text, skip voice analysis, note in report

**Success Criteria:**
- Transcription accuracy ≥ 90% WER on clear audio
- Speech analysis added < 1.5 seconds to evaluation latency

---

## 2.7 Analytics Dashboard

**Purpose:** Present comprehensive post-interview performance data.

**Inputs:**
- Completed interview session
- All answer scores and dimension breakdowns
- Difficulty journey log
- Historical sessions for trend comparison

**Outputs:**
- Overall interview score (0–100)
- Radar chart (6 dimensions)
- Difficulty journey visualization
- Topic-level performance breakdown
- Weak areas list
- Strong areas list
- Historical trend charts

**Business Logic:**
- Aggregate dimension scores → weighted composite
- Compare with user's personal historical average
- Compute percentile vs. all users (anonymized)
- Highlight topics with score delta > 20 points from average (outlier detection)

**Edge Cases:**
- First-ever interview → no historical data → show only current session
- All questions from same topic → topic analysis shows only that topic
- User deletes interview → recalculate all derived analytics

**Success Criteria:**
- Dashboard loads < 2 seconds
- All charts render correctly on mobile

---

## 2.8 Growth Tracking Module

**Purpose:** Track user improvement over time across all dimensions.

**Inputs:**
- All completed interview sessions (historical)
- Daily activity logs
- Readiness score calculations

**Outputs:**
- Week-over-week score trend
- Domain-level progress graph
- Readiness level progression (Beginner → Expert)
- Monthly consistency report

**Business Logic:**
- Readiness Score = Technical Knowledge (50%) + Communication (20%) + Confidence (15%) + Consistency (15%)
- Readiness recalculated after every completed interview
- Growth rate = (current_readiness − 30-day-ago_readiness) / 30

**Edge Cases:**
- No activity for 14+ days → readiness score decays by 2% per week (staleness penalty)
- Score regression → highlight on dashboard with supportive AI coach message

**Success Criteria:**
- Trend data available immediately after interview completion
- Readiness score reflects last 30 days weighted more than older data

---

## 2.9 Streak Tracking Module

**Purpose:** Gamify daily consistency to build habit formation.

**Inputs:**
- Daily activity events (interview, questions solved, revision, learning)
- User timezone

**Outputs:**
- Current streak count
- Longest streak count
- Monthly calendar heatmap (green = active, grey = missed)
- Yearly consistency view

**Business Logic:**
- A day counts as active if at least 1 qualifying activity completed
- Streak breaks at midnight user-local-timezone if no activity that day
- Streak freeze: user earns 1 freeze per 7-day streak (max 2 stored)
- Grace period: 30 minutes past midnight (for late-night users)

**Edge Cases:**
- User in different timezone → use profile-stored timezone
- Server downtime causes missed activity log → allow manual activity recovery with admin flag
- Multiple activities same day → count as single streak day

**Success Criteria:**
- Streak updates in real-time after activity completion
- Calendar renders correctly across all timezones

---

## 2.10 Recommendation Engine

**Purpose:** Generate personalized improvement plans after every interview.

**Inputs:**
- Weak areas identified (topics with score < 60)
- Root cause analysis from AI evaluation
- User's historical weak areas (recurring patterns)
- Domain taxonomy for resource mapping

**Outputs:**
- Top 3 weak areas with root cause explanations
- Action plan per weak area (specific tasks)
- Estimated score improvement per action
- Resource recommendations (topic-tagged)

**Business Logic:**
- Rank weak areas by: (gap from 60) × (frequency across sessions)
- Root cause detection: pattern match → "concept confusion" vs "knowledge gap" vs "communication breakdown"
- Action templates per root cause type
- Estimated improvement based on historical data of similar users

**Edge Cases:**
- All areas strong (score > 80) → generate "advance to next level" recommendation
- No historical data → use domain taxonomy defaults
- User ignores recommendations → escalate priority in next session

**Success Criteria:**
- Recommendations generated < 5 seconds after interview
- User-reported helpfulness rating ≥ 4/5

---

## 2.11 Resume-Based Interview Module

**Purpose:** Generate personalized questions from uploaded resume.

**Inputs:**
- PDF or DOCX resume file
- User's target role

**Outputs:**
- Extracted entities: Skills, Projects, Experience, Certifications
- Question set (10–20 questions) derived from resume content
- Interview session pre-loaded with personalized questions

**Business Logic:**
- PDF/DOCX parsing → text extraction
- LLM prompt: extract structured JSON of skills, projects, experience, certifications
- Question generation: "Tell me about [Project X]", "You listed [Skill Y], explain how you used it"
- Difficulty of questions tied to user experience level

**Edge Cases:**
- Empty or unreadable resume → prompt user to re-upload or enter manually
- Resume in non-English → detect language, process if supported
- Overly long resume → truncate to first 2000 tokens, process most relevant sections

**Success Criteria:**
- Resume parsing completes < 10 seconds
- Generated questions are contextually relevant 90% of the time

---

## 2.12 Coding Interview Module

**Purpose:** Evaluate coding ability alongside verbal reasoning.

**Inputs:**
- Selected problem (by domain, difficulty, company pattern)
- User's submitted code
- Selected programming language

**Outputs:**
- Execution result (pass/fail per test case)
- Time complexity analysis
- Space complexity analysis
- Code quality score
- Verbal explanation evaluation (optional)

**Business Logic:**
- Monaco editor for in-browser coding
- Code execution in sandboxed Docker container (per-run)
- Test case validation: expected vs actual output
- Complexity analysis via AST parsing + heuristics
- Code quality: PEP8 compliance (Python), ESLint (JS), or equivalent

**Edge Cases:**
- Infinite loop → timeout kill after 5 seconds
- Memory overflow → container memory cap (256MB)
- Syntax error → return parse error, allow edit and resubmit
- No test cases pass → partial credit for correct logic shown in code

**Success Criteria:**
- Code execution returns result < 5 seconds for standard problems
- Supports Python, JavaScript, Java, C++ at launch

---

## 2.13 Company-Specific Interview Module

**Purpose:** Simulate interview patterns and question styles of specific companies.

**Inputs:**
- Selected company (Google, Amazon, Microsoft, TCS, Infosys, etc.)
- Target role
- User profile

**Outputs:**
- Company-style question bank selection
- Interview pattern adapted to company culture
- Company-specific evaluation rubric

**Business Logic:**
- Company profiles stored with metadata: question style, focus areas, difficulty distribution
- Google: algorithms heavy, system design, behavioral (STAR format)
- Amazon: leadership principles, behavioral, coding
- TCS/Infosys: verbal reasoning, aptitude, basic technical
- Question selection weighted by company profile

**Edge Cases:**
- Requested company not in database → suggest closest match
- Company changes interview pattern → admin update via CMS

**Success Criteria:**
- Each company profile has minimum 50 tagged questions at launch
- User can complete a realistic 45-min company-mode interview

---

# 3. NON-FUNCTIONAL REQUIREMENTS

## 3.1 Performance Requirements

| Metric | Target |
|---|---|
| API Response Time (P95) | < 200ms (non-AI) |
| AI Evaluation Latency (P95) | < 3 seconds |
| Speech Transcription Latency | < 2 seconds per 30-second clip |
| Dashboard Load Time | < 2 seconds |
| Database Query Time (P99) | < 50ms |
| Code Execution Response | < 5 seconds |

## 3.2 Scalability Requirements

| Stage | Target Concurrent Users | Architecture Response |
|---|---|---|
| MVP | 100 | Single server, vertical scale |
| Growth | 1,000 | Horizontal scaling, load balancer |
| Scale | 10,000 | Microservices, auto-scaling |
| Enterprise | 100,000+ | Multi-region, CDN, distributed AI |

## 3.3 Security Requirements

- All data encrypted in transit (TLS 1.3)
- Passwords hashed with bcrypt (cost 12)
- JWT tokens with RS256 signing
- Rate limiting: 100 req/min per IP, 1000 req/min per authenticated user
- File upload scanning (magic bytes validation, size limit 10MB)
- SQL injection prevention via ORM parameterized queries only
- XSS prevention via CSP headers and output sanitization
- CSRF protection via SameSite cookies + CSRF tokens
- PII encrypted at rest (AES-256)

## 3.4 Reliability Requirements

- System uptime: ≥ 99.5% (MVP), ≥ 99.9% (production)
- AI service uptime: ≥ 99% (with fallback)
- Zero data loss on interview session crash (auto-save every 60s)
- Database: daily automated backups, 30-day retention

## 3.5 Availability Requirements

- Multi-zone deployment (production)
- Health checks every 30 seconds
- Auto-restart on service failure
- Database read replicas for analytics queries

## 3.6 Monitoring Requirements

- Real-time error tracking (Sentry)
- Application performance monitoring (Prometheus + Grafana)
- Uptime monitoring (UptimeRobot free tier)
- Alert thresholds: error rate > 1%, P95 latency > 500ms

## 3.7 Logging Requirements

- Structured JSON logging (all services)
- Log levels: DEBUG, INFO, WARNING, ERROR, CRITICAL
- Correlation ID on every request (trace across services)
- PII redacted from all logs
- Log retention: 30 days (production), 7 days (staging)

## 3.8 Data Retention Policies

| Data Type | Retention Period |
|---|---|
| User Account Data | Until account deletion + 30 days |
| Interview Sessions | 2 years |
| Audio Recordings | 24 hours post-processing |
| Logs | 30 days |
| Analytics Aggregates | Indefinite |
| Backups | 30 days rolling |

---

# 4. COMPLETE SYSTEM ARCHITECTURE

## 4.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│              Next.js (Vercel) + WebRTC Audio Capture            │
└─────────────────────────┬───────────────────────────────────────┘
                          │ HTTPS / WebSocket
┌─────────────────────────▼───────────────────────────────────────┐
│                      API GATEWAY                                │
│            Nginx Reverse Proxy + Rate Limiting                  │
└──────┬──────────┬──────────┬──────────┬──────────┬─────────────┘
       │          │          │          │          │
┌──────▼──┐ ┌────▼────┐ ┌───▼────┐ ┌───▼────┐ ┌──▼──────┐
│  Auth   │ │Interview│ │Question│ │Eval    │ │Analytics│
│ Service │ │ Service │ │Service │ │Service │ │Service  │
└──────┬──┘ └────┬────┘ └───┬────┘ └───┬────┘ └──┬──────┘
       │          │          │          │          │
┌──────▼──────────▼──────────▼──────────▼──────────▼──────────────┐
│                        AI SERVICE LAYER                          │
│   LLM Engine │ Whisper STT │ Librosa │ LanguageTool │ BGE Embed  │
└──────────────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│                      DATA LAYER                                  │
│   PostgreSQL │ Redis Cache │ ChromaDB │ Cloudinary Storage       │
└─────────────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│                   MONITORING LAYER                               │
│        Sentry │ Prometheus │ Grafana │ UptimeRobot               │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. User opens browser → Next.js loads from Vercel CDN
2. User authenticates → Auth Service issues JWT → stored in HttpOnly cookie
3. User starts interview → Interview Service initializes session → fetches questions from Question Service
4. User answers via microphone → WebRTC captures audio → uploaded to Evaluation Service
5. Evaluation Service → Whisper (transcription) → LLM (technical eval) → Librosa (confidence) → LanguageTool (grammar)
6. Scores returned → stored in PostgreSQL → Redis cache updated → WebSocket pushes real-time feedback to frontend
7. Session ends → Analytics Service aggregates → Recommendation Service generates plan → stored in DB
8. User views dashboard → Analytics Service queries DB (with Redis cache layer) → rendered in browser

---

## 4.2 Deep Architecture

### Interview Flow

```
User Initiates Interview
        │
        ▼
Interview Service
├── Fetch User Profile (PostgreSQL)
├── Load Domain Taxonomy
├── Initialize Session State (Redis)
├── Select Question Strategy
│       ├── Question Service: fetch Level 1 question
│       └── Store question ID in session
        │
        ▼
Question Delivered to Frontend
        │
        ▼
User Records Answer (WebRTC Audio)
        │
        ▼
Audio Chunked & Sent to Evaluation Service
        │
        ▼
Evaluation Service
├── Whisper STT → Transcript
├── LanguageTool → Grammar Score
├── LLM Engine → Technical + Communication Score
├── Librosa → Confidence Score
└── Aggregate → Weighted Composite Score
        │
        ▼
Adaptive Difficulty Engine
├── Read Session State (Redis)
├── Apply Scoring Rules
├── Determine Next Difficulty
└── Update Session State (Redis)
        │
        ▼
Question Service
└── Select Next Question at Determined Difficulty
        │
        ▼
Store Answer + Score (PostgreSQL)
        │
        ▼
WebSocket Push → Real-Time Score + Feedback to Frontend
        │
        ▼
[Loop Until Session Complete]
        │
        ▼
Session End → Generate Interview Report
```

### Evaluation Flow

```
Raw Audio
    │
    ▼
Whisper Large V3 (STT)
    │
    ▼
Transcript Text
    ├─────────────────────────────────────────────────────┐
    │                                                     │
    ▼                                                     ▼
LLM Engine (Qwen 3 via Ollama)                   LanguageTool API
├── Semantic Similarity vs Expected Answer        ├── Grammar Error Count
├── Concept Extraction                            ├── Sentence Quality
├── Completeness Score                            └── Grammar Score (0–100)
└── Technical Accuracy Score (0–100)
    │
    ▼
Audio Waveform (Parallel Processing)
    │
    ▼
Librosa Analysis
├── RMS Energy
├── Pitch Variance
├── Speaking Rate (WPM)
├── Pause Duration
└── Confidence Score (0–100)
    │
    ▼
Score Aggregation Service
├── Technical Accuracy × 0.40
├── Communication × 0.20
├── Confidence × 0.15
├── Completeness × 0.15
├── Grammar × 0.10
└── Composite Score (0–100)
    │
    ▼
Store in PostgreSQL (answer_scores table)
Store Summary in Redis (session cache)
Push via WebSocket to Frontend
```

### Analytics Flow

```
Interview Session Complete
        │
        ▼
Analytics Service
├── Fetch all answer_scores for session
├── Aggregate topic-level scores
├── Compute radar chart data (6 dimensions)
├── Build difficulty journey timeline
├── Compare vs user historical average
├── Compute readiness score
└── Identify weak / strong areas
        │
        ▼
Store in interview_reports (PostgreSQL)
Update user_progress (PostgreSQL)
Update readiness_scores (PostgreSQL)
Invalidate Redis cache for user dashboard
        │
        ▼
Recommendation Service
├── Rank weak areas
├── Match to improvement templates
├── Generate action plan
└── Store in recommendations (PostgreSQL)
```

### Recommendation Flow

```
Weak Areas Input (topics with score < 60)
        │
        ▼
Pattern Analysis
├── Recurring across sessions? (weight × 2)
├── Category: concept gap vs communication breakdown
└── Severity: distance from score 60
        │
        ▼
Action Template Matching
├── Concept Gap → Study Resource + Practice Questions
├── Communication → Structure Tips + Examples
└── Confidence → Speaking Exercises + Repetition Plan
        │
        ▼
Priority Ranking
├── Ranked by: severity × recurrence
└── Top 3 selected for action plan
        │
        ▼
Estimated Impact Calculation
├── Historical data: avg improvement from action type
└── Impact estimate per weak area
        │
        ▼
Store Recommendation (PostgreSQL)
Push to Frontend (Real-Time or Dashboard View)
```

### User Tracking Flow

```
User Activity Event
(Interview / Questions Solved / Revision / Learning)
        │
        ▼
Activity Logger Service
├── Log event to daily_activity table
├── Update streak (check if today already active)
│       ├── Already active → no change
│       └── New activity → increment streak counter
├── Check streak freeze usage
└── Update readiness_scores.consistency_component
        │
        ▼
Redis Cache Update (streak, calendar data)
WebSocket Push → Real-Time Streak Update to Frontend
Scheduled Job (Daily 00:01 UTC) → Check all users
├── No activity yesterday → break streak
│       └── Has freeze? → apply freeze, decrement
└── Had activity → maintain streak
```

---

# 5. DATABASE ARCHITECTURE

## 5.1 ER Diagram Description

```
users ─────────── profiles (1:1)
  │
  ├──────────────── user_skills (1:N)
  │                      │
  │                   skills (N:1)
  │
  ├──────────────── interviews (1:N)
  │                      │
  │               ├── questions (N:M via interview_questions)
  │               ├── answers (1:N)
  │               │       │
  │               │   answer_scores (1:1)
  │               └── interview_reports (1:1)
  │
  ├──────────────── daily_activity (1:N)
  ├──────────────── streaks (1:1)
  ├──────────────── user_progress (1:1)
  ├──────────────── recommendations (1:N)
  └──────────────── readiness_scores (1:N)
```

## 5.2 Complete Schema

---

### Table: `users`
**Purpose:** Core user identity and authentication.

```sql
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255),                    -- NULL for OAuth users
    oauth_provider  VARCHAR(50),                     -- 'google', 'github', NULL
    oauth_id        VARCHAR(255),                    -- OAuth subject claim
    email_verified  BOOLEAN DEFAULT FALSE,
    is_active       BOOLEAN DEFAULT TRUE,
    role            VARCHAR(20) DEFAULT 'user',      -- 'user', 'admin'
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    last_login_at   TIMESTAMPTZ,
    CONSTRAINT chk_auth_method CHECK (
        password_hash IS NOT NULL OR oauth_provider IS NOT NULL
    )
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_oauth ON users(oauth_provider, oauth_id);
```

---

### Table: `profiles`
**Purpose:** Extended user profile and preferences.

```sql
CREATE TABLE profiles (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    full_name           VARCHAR(255) NOT NULL,
    education           VARCHAR(255),
    experience_level    VARCHAR(20) CHECK (experience_level IN ('fresher','junior','mid','senior')),
    target_role         VARCHAR(255),
    target_company      VARCHAR(255),
    bio                 TEXT,
    avatar_url          VARCHAR(500),
    linkedin_url        VARCHAR(500),
    github_url          VARCHAR(500),
    timezone            VARCHAR(100) DEFAULT 'UTC',
    profile_complete    INTEGER DEFAULT 0,           -- 0–100 completeness score
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_user_id ON profiles(user_id);
```

---

### Table: `skills`
**Purpose:** Master skill/domain taxonomy.

```sql
CREATE TABLE skills (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL UNIQUE,
    category    VARCHAR(100),                        -- 'programming', 'database', 'cloud', etc.
    parent_id   UUID REFERENCES skills(id),          -- hierarchical taxonomy
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_skills_category ON skills(category);
CREATE INDEX idx_skills_parent ON skills(parent_id);
```

---

### Table: `user_skills`
**Purpose:** Many-to-many user ↔ skill relationship with proficiency.

```sql
CREATE TABLE user_skills (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill_id        UUID NOT NULL REFERENCES skills(id),
    proficiency     VARCHAR(20) CHECK (proficiency IN ('beginner','intermediate','advanced')),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, skill_id)
);

CREATE INDEX idx_user_skills_user ON user_skills(user_id);
```

---

### Table: `interviews`
**Purpose:** Master interview session record.

```sql
CREATE TABLE interviews (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    interview_type      VARCHAR(50) NOT NULL CHECK (interview_type IN ('technical','hr','behavioral','coding','resume')),
    difficulty_setting  VARCHAR(20) NOT NULL CHECK (difficulty_setting IN ('beginner','intermediate','advanced','adaptive')),
    target_role         VARCHAR(255),
    target_company      VARCHAR(255),
    domain              VARCHAR(100),
    duration_minutes    INTEGER NOT NULL CHECK (duration_minutes IN (15,30,45,60)),
    status              VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('in_progress','completed','abandoned','paused')),
    session_state       JSONB,                       -- Redis backup: current difficulty, question index
    started_at          TIMESTAMPTZ DEFAULT NOW(),
    completed_at        TIMESTAMPTZ,
    total_questions     INTEGER DEFAULT 0,
    questions_answered  INTEGER DEFAULT 0,
    overall_score       NUMERIC(5,2),               -- Final composite score
    resume_id           UUID,                        -- FK to resumes if resume-based
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_interviews_user ON interviews(user_id);
CREATE INDEX idx_interviews_status ON interviews(status);
CREATE INDEX idx_interviews_created ON interviews(created_at);
-- Partition by created_at (monthly) for scale
```

---

### Table: `questions`
**Purpose:** Master question bank.

```sql
CREATE TABLE questions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain          VARCHAR(100) NOT NULL,
    skill_id        UUID REFERENCES skills(id),
    difficulty      INTEGER NOT NULL CHECK (difficulty BETWEEN 1 AND 4),
    question_type   VARCHAR(50) CHECK (question_type IN ('technical','behavioral','coding','hr')),
    question_text   TEXT NOT NULL,
    expected_answer TEXT,
    key_concepts    JSONB,                           -- ["concept1", "concept2"]
    hints           JSONB,
    company_tags    JSONB,                           -- ["google", "amazon"]
    is_active       BOOLEAN DEFAULT TRUE,
    usage_count     INTEGER DEFAULT 0,
    avg_score       NUMERIC(5,2),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_questions_domain_difficulty ON questions(domain, difficulty);
CREATE INDEX idx_questions_skill ON questions(skill_id);
CREATE INDEX idx_questions_company ON questions USING GIN(company_tags);
```

---

### Table: `answers`
**Purpose:** Store every user answer per interview.

```sql
CREATE TABLE answers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_id    UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
    question_id     UUID NOT NULL REFERENCES questions(id),
    user_id         UUID NOT NULL REFERENCES users(id),
    sequence_order  INTEGER NOT NULL,               -- Answer order in session
    answer_text     TEXT,                            -- Transcribed text
    audio_url       VARCHAR(500),                    -- Temporary Cloudinary URL
    duration_secs   NUMERIC(6,2),                   -- How long user spoke
    was_skipped     BOOLEAN DEFAULT FALSE,
    difficulty_at_time INTEGER,                     -- Difficulty level when answered
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_answers_interview ON answers(interview_id);
CREATE INDEX idx_answers_user ON answers(user_id);
```

---

### Table: `answer_scores`
**Purpose:** Detailed scoring per answer across all dimensions.

```sql
CREATE TABLE answer_scores (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    answer_id               UUID NOT NULL UNIQUE REFERENCES answers(id) ON DELETE CASCADE,
    interview_id            UUID NOT NULL REFERENCES interviews(id),
    technical_accuracy      NUMERIC(5,2),            -- 0–100
    communication           NUMERIC(5,2),            -- 0–100
    confidence              NUMERIC(5,2),            -- 0–100
    completeness            NUMERIC(5,2),            -- 0–100
    grammar                 NUMERIC(5,2),            -- 0–100
    fluency                 NUMERIC(5,2),            -- 0–100
    composite_score         NUMERIC(5,2),            -- Weighted total
    correct_concepts        JSONB,
    missing_concepts        JSONB,
    wrong_concepts          JSONB,
    feedback_text           TEXT,                    -- AI-generated feedback string
    wpm                     NUMERIC(6,2),
    pause_count             INTEGER,
    filler_word_count       INTEGER,
    filler_words_detected   JSONB,
    created_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_answer_scores_interview ON answer_scores(interview_id);
```

---

### Table: `interview_reports`
**Purpose:** Aggregated final report per completed interview.

```sql
CREATE TABLE interview_reports (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_id            UUID NOT NULL UNIQUE REFERENCES interviews(id),
    user_id                 UUID NOT NULL REFERENCES users(id),
    overall_score           NUMERIC(5,2),
    technical_avg           NUMERIC(5,2),
    communication_avg       NUMERIC(5,2),
    confidence_avg          NUMERIC(5,2),
    completeness_avg        NUMERIC(5,2),
    grammar_avg             NUMERIC(5,2),
    topic_scores            JSONB,                   -- {"python": 85, "sql": 62}
    difficulty_journey      JSONB,                   -- [1,1,2,3,2,3,3,4]
    weak_areas              JSONB,                   -- ["generators", "async"]
    strong_areas            JSONB,                   -- ["OOP", "functions"]
    radar_chart_data        JSONB,
    readiness_delta         NUMERIC(5,2),            -- Change in readiness score
    percentile              NUMERIC(5,2),            -- vs all users
    created_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reports_user ON interview_reports(user_id);
CREATE INDEX idx_reports_created ON interview_reports(created_at);
```

---

### Table: `daily_activity`
**Purpose:** Log individual activity events per user per day.

```sql
CREATE TABLE daily_activity (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_date   DATE NOT NULL,
    activity_type   VARCHAR(50) CHECK (activity_type IN ('interview','questions_solved','revision','learning')),
    activity_count  INTEGER DEFAULT 1,
    metadata        JSONB,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, activity_date, activity_type)
);

CREATE INDEX idx_activity_user_date ON daily_activity(user_id, activity_date);
```

---

### Table: `streaks`
**Purpose:** Maintain streak data per user.

```sql
CREATE TABLE streaks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    current_streak  INTEGER DEFAULT 0,
    longest_streak  INTEGER DEFAULT 0,
    last_active_date DATE,
    freeze_count    INTEGER DEFAULT 0,              -- Max 2
    freeze_used_dates JSONB,                        -- Dates when freeze was used
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

---

### Table: `user_progress`
**Purpose:** Rolling progress metrics per user.

```sql
CREATE TABLE user_progress (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    total_interviews        INTEGER DEFAULT 0,
    total_questions         INTEGER DEFAULT 0,
    avg_overall_score       NUMERIC(5,2),
    avg_technical           NUMERIC(5,2),
    avg_communication       NUMERIC(5,2),
    avg_confidence          NUMERIC(5,2),
    best_score              NUMERIC(5,2),
    domain_scores           JSONB,                  -- Running averages per domain
    readiness_score         NUMERIC(5,2) DEFAULT 0,
    readiness_level         VARCHAR(30),            -- 'beginner','developing','job_ready','expert'
    interviews_this_week    INTEGER DEFAULT 0,
    interviews_this_month   INTEGER DEFAULT 0,
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);
```

---

### Table: `recommendations`
**Purpose:** Store AI-generated improvement plans.

```sql
CREATE TABLE recommendations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    interview_id        UUID REFERENCES interviews(id),
    weak_area           VARCHAR(255) NOT NULL,
    root_cause          TEXT,
    action_plan         JSONB,                      -- [{task, priority, estimated_hours}]
    estimated_improvement NUMERIC(5,2),             -- Expected score delta
    status              VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','dismissed')),
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    resolved_at         TIMESTAMPTZ
);

CREATE INDEX idx_recommendations_user ON recommendations(user_id, status);
```

---

### Table: `readiness_scores`
**Purpose:** Time-series readiness score history.

```sql
CREATE TABLE readiness_scores (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score                   NUMERIC(5,2) NOT NULL,
    technical_component     NUMERIC(5,2),
    communication_component NUMERIC(5,2),
    confidence_component    NUMERIC(5,2),
    consistency_component   NUMERIC(5,2),
    recorded_at             TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_readiness_user_time ON readiness_scores(user_id, recorded_at DESC);
```

---

### Table: `resumes`
**Purpose:** Store uploaded resume metadata and parsed content.

```sql
CREATE TABLE resumes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_url        VARCHAR(500) NOT NULL,
    file_name       VARCHAR(255),
    parsed_data     JSONB,                          -- {skills, projects, experience, certifications}
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_resumes_user ON resumes(user_id);
```

---

## 5.3 Indexing Strategy

- **Primary Keys:** UUID with gen_random_uuid() for distributed uniqueness
- **Foreign Keys:** Indexed on all FK columns
- **Query Patterns:** Composite indexes on (user_id, created_at) for time-series queries
- **Full-text Search:** GIN index on JSONB columns (company_tags, key_concepts)
- **Date Queries:** BRIN index on created_at for large tables (interviews, answers)

## 5.4 Partitioning Strategy

- `interviews` table: partition by RANGE on `created_at` (monthly partitions beyond 100k rows)
- `daily_activity` table: partition by RANGE on `activity_date` (monthly)
- `readiness_scores` table: partition by RANGE on `recorded_at` (monthly)

---

# 6. API DESIGN

## 6.1 Authentication APIs

### POST `/api/v1/auth/register`
```json
Request:
{
  "email": "user@example.com",
  "password": "SecureP@ss123",
  "full_name": "John Doe"
}

Response 201:
{
  "message": "Registration successful. Please verify your email.",
  "user_id": "uuid"
}

Errors:
409 - Email already registered
422 - Validation failed (password strength, email format)
```

### POST `/api/v1/auth/login`
```json
Request:
{
  "email": "user@example.com",
  "password": "SecureP@ss123"
}

Response 200:
{
  "access_token": "jwt_token",
  "token_type": "bearer",
  "expires_in": 900
}
// refresh_token set as HttpOnly cookie

Errors:
401 - Invalid credentials
403 - Email not verified
429 - Rate limited
```

### POST `/api/v1/auth/refresh`
```json
Request: (refresh_token from HttpOnly cookie)

Response 200:
{
  "access_token": "new_jwt_token",
  "expires_in": 900
}

Errors:
401 - Invalid/expired refresh token
```

### POST `/api/v1/auth/oauth/google`
```json
Request:
{ "code": "google_oauth_code", "redirect_uri": "..." }

Response 200:
{ "access_token": "...", "is_new_user": true }
```

### POST `/api/v1/auth/logout`
```json
Request: (JWT in header)
Response 200: { "message": "Logged out" }
// Clears HttpOnly cookie, blacklists token in Redis
```

---

## 6.2 Profile APIs

### GET `/api/v1/profile`
```
Auth: Required
Response 200: { user profile object }
```

### PUT `/api/v1/profile`
```json
Auth: Required
Request:
{
  "full_name": "John Doe",
  "education": "B.Tech CSE",
  "experience_level": "fresher",
  "target_role": "Data Engineer",
  "target_company": "Google",
  "timezone": "Asia/Kolkata"
}
Response 200: { updated profile }
```

### POST `/api/v1/profile/skills`
```json
Auth: Required
Request:
{ "skills": [{"skill_id": "uuid", "proficiency": "intermediate"}] }
Response 200: { "skills": [...] }
```

---

## 6.3 Interview APIs

### POST `/api/v1/interviews/start`
```json
Auth: Required
Request:
{
  "interview_type": "technical",
  "difficulty_setting": "adaptive",
  "duration_minutes": 30,
  "domain": "python",
  "target_role": "Backend Developer"
}
Response 201:
{
  "interview_id": "uuid",
  "session_token": "...",
  "first_question": {
    "id": "uuid",
    "question_text": "Tell me about yourself.",
    "question_type": "behavioral",
    "difficulty": 1,
    "time_limit_secs": 120
  }
}
```

### POST `/api/v1/interviews/{interview_id}/answer`
```json
Auth: Required
Request (multipart/form-data):
{
  "question_id": "uuid",
  "audio_file": <binary>,    // OR
  "answer_text": "My answer..."  // text fallback
}
Response 200:
{
  "answer_id": "uuid",
  "scores": {
    "technical_accuracy": 82,
    "communication": 75,
    "confidence": 70,
    "completeness": 80,
    "grammar": 90,
    "composite": 79.65
  },
  "feedback": "Good answer. Missing: generators memory efficiency.",
  "next_question": { question object } | null
}
```

### POST `/api/v1/interviews/{interview_id}/complete`
```json
Auth: Required
Response 200:
{
  "interview_id": "uuid",
  "report_id": "uuid",
  "overall_score": 82.5,
  "message": "Interview completed. Report generating..."
}
```

### GET `/api/v1/interviews/{interview_id}/report`
```json
Auth: Required
Response 200:
{
  "report": { complete interview_report object }
}
```

### GET `/api/v1/interviews`
```json
Auth: Required
Query: ?page=1&limit=10&status=completed
Response 200:
{
  "interviews": [...],
  "total": 50,
  "page": 1,
  "pages": 5
}
```

---

## 6.4 Analytics APIs

### GET `/api/v1/analytics/dashboard`
```json
Auth: Required
Response 200:
{
  "readiness_score": 72.5,
  "readiness_level": "job_ready",
  "total_interviews": 15,
  "avg_score": 74.2,
  "current_streak": 7,
  "domain_scores": {"python": 85, "sql": 62},
  "recent_interviews": [...]
}
```

### GET `/api/v1/analytics/growth`
```json
Auth: Required
Query: ?period=30d
Response 200:
{
  "readiness_history": [{"date": "...", "score": 65}, ...],
  "domain_trends": {...},
  "score_trend": [...]
}
```

### GET `/api/v1/analytics/weak-areas`
```json
Auth: Required
Response 200:
{
  "weak_areas": [
    {"topic": "generators", "score": 35, "occurrences": 3},
    {"topic": "async_programming", "score": 42, "occurrences": 2}
  ]
}
```

---

## 6.5 Streak & Activity APIs

### GET `/api/v1/streaks`
```json
Auth: Required
Response 200:
{
  "current_streak": 7,
  "longest_streak": 21,
  "last_active": "2024-01-15",
  "freeze_count": 1
}
```

### GET `/api/v1/activity/calendar`
```json
Auth: Required
Query: ?year=2024&month=1
Response 200:
{
  "calendar": {
    "2024-01-01": {"active": true, "count": 2},
    "2024-01-02": {"active": false}
  }
}
```

---

## 6.6 Resume APIs

### POST `/api/v1/resumes/upload`
```
Auth: Required
Request (multipart/form-data): { "file": <PDF/DOCX> }
Response 202:
{
  "resume_id": "uuid",
  "status": "processing",
  "message": "Resume uploaded. Parsing in progress."
}
```

### GET `/api/v1/resumes/{resume_id}`
```json
Auth: Required
Response 200:
{
  "resume_id": "uuid",
  "parsed_data": {
    "skills": ["Python", "SQL"],
    "projects": [{"name": "...", "description": "..."}],
    "experience": [...],
    "certifications": [...]
  }
}
```

---

## 6.7 Recommendation APIs

### GET `/api/v1/recommendations`
```json
Auth: Required
Query: ?status=pending
Response 200:
{
  "recommendations": [
    {
      "weak_area": "SQL Joins",
      "root_cause": "Conceptual gap in JOIN types",
      "action_plan": [
        {"task": "Practice 10 JOIN problems", "priority": 1}
      ],
      "estimated_improvement": 8.5
    }
  ]
}
```

### PATCH `/api/v1/recommendations/{id}/status`
```json
Auth: Required
Request: { "status": "completed" }
Response 200: { updated recommendation }
```

---

# 7. AI ARCHITECTURE

## 7.1 Adaptive Difficulty Engine

### Inputs
- `current_score`: Weighted composite score of last answer (0–100)
- `current_difficulty`: Integer 1–4
- `score_history`: List of last 3 composite scores
- `domain`: Current question domain

### Scoring Formula
```
composite_score = (
    technical_accuracy × 0.40 +
    communication × 0.20 +
    confidence × 0.15 +
    completeness × 0.15 +
    grammar × 0.10
)
```

### State Management
- Session state stored in Redis with TTL = session_duration + 10 minutes
- Keys: `session:{interview_id}:difficulty`, `session:{interview_id}:score_history`
- Atomic updates using Redis transactions (MULTI/EXEC)

### Difficulty Transition Logic (Pseudocode)
```python
def determine_next_difficulty(score_history, current_difficulty):
    # Use rolling average of last 3 scores for stability
    if len(score_history) >= 2:
        avg = sum(score_history[-3:]) / len(score_history[-3:])
    else:
        avg = score_history[-1] if score_history else 50

    # Apply transition rules
    if avg > 85 and current_difficulty < 4:
        next_difficulty = current_difficulty + 1
        reason = "Performance excellent: increasing difficulty"

    elif 60 <= avg <= 85:
        next_difficulty = current_difficulty
        reason = "Performance stable: maintaining difficulty"

    elif avg < 60 and current_difficulty > 1:
        next_difficulty = current_difficulty - 1
        reason = "Performance below threshold: reducing difficulty"

    else:
        next_difficulty = current_difficulty
        reason = "Boundary reached: maintaining current level"

    return next_difficulty, reason


def select_next_question(domain, difficulty, answered_question_ids):
    # Fetch questions at determined difficulty, exclude already answered
    candidates = QuestionDB.query(
        domain=domain,
        difficulty=difficulty,
        exclude_ids=answered_question_ids,
        limit=5
    )

    if not candidates:
        # Fallback: adjacent difficulty
        candidates = QuestionDB.query(
            domain=domain,
            difficulty=max(1, difficulty - 1),
            exclude_ids=answered_question_ids,
            limit=5
        )

    # Select by least-recently-used (minimize repetition across users)
    return min(candidates, key=lambda q: q.usage_count)
```

---

## 7.2 Answer Evaluation Engine

### Technical Evaluation

```python
def evaluate_technical_accuracy(answer_text, expected_answer, key_concepts, domain):
    # Step 1: Semantic Similarity via Embeddings
    answer_embedding = BGEModel.encode(answer_text)
    expected_embedding = BGEModel.encode(expected_answer)
    semantic_similarity = cosine_similarity(answer_embedding, expected_embedding)
    # Returns 0.0–1.0

    # Step 2: Concept Extraction via LLM
    prompt = f"""
    Domain: {domain}
    Question Expected Answer: {expected_answer}
    Key Concepts Required: {key_concepts}
    User Answer: {answer_text}

    Extract and classify concepts:
    - correct_concepts: present and accurate
    - missing_concepts: required but absent
    - wrong_concepts: mentioned but incorrect

    Respond in JSON only.
    """
    concept_analysis = LLM.complete(prompt)

    # Step 3: Completeness Ratio
    total_concepts = len(key_concepts)
    correct_count = len(concept_analysis["correct_concepts"])
    completeness_ratio = correct_count / total_concepts if total_concepts > 0 else 1.0

    # Step 4: Technical Score Composition
    technical_score = (
        semantic_similarity × 0.50 +
        completeness_ratio × 0.30 +
        (1 - len(concept_analysis["wrong_concepts"]) / max(total_concepts, 1)) × 0.20
    ) × 100

    return min(100, max(0, technical_score)), concept_analysis
```

### Communication Evaluation

```python
def evaluate_communication(answer_text):
    # Structure Detection: intro + body + conclusion
    sentences = split_sentences(answer_text)
    has_intro = classify_sentence(sentences[0], "introduction") if sentences else False
    has_conclusion = classify_sentence(sentences[-1], "conclusion") if len(sentences) > 1 else False

    structure_score = (
        (33 if has_intro else 0) +
        (34 if len(sentences) > 2 else 0) +    # Has body content
        (33 if has_conclusion else 0)
    )

    # Clarity: sentence length variance (0 = all same = poor; moderate variance = good)
    lengths = [len(s.split()) for s in sentences]
    clarity_score = min(100, 60 + (statistics.stdev(lengths) if len(lengths) > 1 else 0) × 2)

    # LLM Communication Assessment
    prompt = f"""
    Rate the communication quality of this interview answer (0-100):
    Answer: {answer_text}
    
    Score on: clarity, structure, explanation quality.
    Respond: {{"score": X, "feedback": "..."}}
    """
    llm_comm = LLM.complete(prompt)

    communication_score = (structure_score × 0.30 + clarity_score × 0.20 + llm_comm["score"] × 0.50)
    return min(100, max(0, communication_score))
```

---

## 7.3 Confidence Analysis Engine

### Voice Analysis Pipeline

```python
def analyze_confidence(audio_path):
    # Load audio
    y, sr = librosa.load(audio_path, sr=16000)

    # 1. Speaking Rate (WPM)
    duration_secs = librosa.get_duration(y=y, sr=sr)
    # WPM calculated from transcript word count
    # wpm = (word_count / duration_secs) × 60
    # Optimal range: 120–160 WPM → 100 score
    # < 80 or > 200 → penalty

    # 2. RMS Energy (Volume Stability)
    rms = librosa.feature.rms(y=y)[0]
    rms_std = numpy.std(rms)
    energy_stability_score = max(0, 100 - rms_std × 500)

    # 3. Pitch Variance (Nervousness Indicator)
    pitches, magnitudes = librosa.piptrack(y=y, sr=sr)
    pitch_values = pitches[magnitudes > numpy.median(magnitudes)]
    pitch_std = numpy.std(pitch_values) if len(pitch_values) > 0 else 0
    pitch_stability_score = max(0, 100 - pitch_std × 0.5)

    # 4. Silence/Pause Ratio
    silence_threshold = 0.01
    silent_frames = numpy.sum(rms < silence_threshold)
    total_frames = len(rms)
    silence_ratio = silent_frames / total_frames
    pause_score = max(0, 100 - silence_ratio × 150)

    # 5. Confidence Score Composition
    confidence_score = (
        energy_stability_score × 0.30 +
        pitch_stability_score × 0.25 +
        pause_score × 0.25 +
        wpm_score × 0.20
    )

    return {
        "confidence_score": min(100, max(0, confidence_score)),
        "wpm": wpm,
        "pause_count": count_pauses(rms, silence_threshold),
        "rms_stability": energy_stability_score,
        "pitch_stability": pitch_stability_score
    }
```

### Confidence Score Formula
```
confidence = (energy_stability × 0.30) + (pitch_stability × 0.25) + (pause_score × 0.25) + (wpm_score × 0.20)

wpm_score:
    80–120 WPM  → 70 points
    120–160 WPM → 100 points (optimal)
    160–200 WPM → 80 points
    < 80 or > 200 → 50 points
```

---

## 7.4 Recommendation Engine

### Weakness Detection Algorithm

```python
def detect_weak_areas(user_id, lookback_sessions=5):
    recent_answers = AnswerScoreDB.query(user_id, limit=lookback_sessions)

    # Group scores by topic/domain
    topic_scores = defaultdict(list)
    for answer in recent_answers:
        topic = answer.question.domain + ":" + answer.question.subdomain
        topic_scores[topic].append(answer.composite_score)

    # Compute average per topic
    topic_averages = {
        topic: sum(scores) / len(scores)
        for topic, scores in topic_scores.items()
    }

    # Identify weak areas: score < 60
    weak_areas = [
        {
            "topic": topic,
            "avg_score": avg,
            "gap": 60 - avg,
            "occurrences": len(topic_scores[topic]),
            "severity": (60 - avg) × len(topic_scores[topic])  # Combined severity
        }
        for topic, avg in topic_averages.items()
        if avg < 60
    ]

    # Sort by severity (highest first)
    return sorted(weak_areas, key=lambda x: x["severity"], reverse=True)


def generate_improvement_plan(weak_area):
    # Classify root cause
    avg_score = weak_area["avg_score"]

    if avg_score < 30:
        root_cause = "fundamental_knowledge_gap"
        action_template = TEMPLATES["study_fundamentals"]
    elif 30 <= avg_score < 50:
        root_cause = "concept_confusion"
        action_template = TEMPLATES["concept_clarification"]
    else:
        root_cause = "application_gap"
        action_template = TEMPLATES["practice_problems"]

    # Build action plan
    action_plan = action_template.format(topic=weak_area["topic"])

    # Estimate improvement (based on historical data)
    # Average improvement seen in similar users after completing action plan
    estimated_improvement = calculate_historical_improvement(
        topic=weak_area["topic"],
        root_cause=root_cause
    )

    return {
        "weak_area": weak_area["topic"],
        "root_cause": root_cause,
        "action_plan": action_plan,
        "estimated_improvement": estimated_improvement
    }
```

---

# 8. FREE AI STACK RESEARCH

## 8.1 LLM Comparison

| Model | Accuracy | VRAM Required | Pros | Cons | Selection |
|---|---|---|---|---|---|
| **Qwen 3 8B** | Very High | 8GB | Best reasoning, multilingual, efficient | Newer, less community support | ✅ **PRIMARY** |
| Llama 3.1 8B | High | 8GB | Very popular, great ecosystem | Slightly lower reasoning than Qwen3 | ✅ BACKUP |
| Mistral 7B | High | 6GB | Fast, low resource | Lower accuracy on complex tech | Tertiary fallback |
| Phi-3 Mini | Medium | 4GB | Ultra-lightweight | Struggles on complex reasoning | CPU-only fallback |

**Selected: Qwen 3 8B via Ollama** — Best accuracy-to-resource ratio, excellent technical reasoning, multilingual.

---

## 8.2 Speech-to-Text Comparison

| Model | WER | Hardware | Pros | Cons | Selection |
|---|---|---|---|---|---|
| **Whisper Large V3** | 2.7% | 4GB VRAM | Best accuracy, multilingual | Slow on CPU | ✅ **PRIMARY** |
| Whisper Medium | 4.2% | 2GB VRAM | Good balance | Lower accuracy | Fallback |
| Vosk | 8–12% | CPU only | Offline, fast | Low accuracy | No |
| wav2vec 2.0 | 5.1% | 2GB VRAM | Decent | Complex setup | No |

**Selected: Whisper Large V3** — Industry-leading accuracy for interview audio.

---

## 8.3 Embedding Models Comparison

| Model | Accuracy (MTEB) | Dimension | Pros | Cons | Selection |
|---|---|---|---|---|---|
| **BAAI/bge-large-en-v1.5** | 64.6 | 1024 | Top performer, free | Larger size | ✅ **PRIMARY** |
| all-MiniLM-L6-v2 | 56.3 | 384 | Very fast, lightweight | Lower accuracy | Fallback |
| E5-large | 62.3 | 1024 | Strong performance | Slower | Tertiary |

**Selected: BAAI/bge-large-en-v1.5** — Best semantic similarity accuracy for answer evaluation.

---

## 8.4 Vector Database Comparison

| Database | Performance | Persistence | Pros | Cons | Selection |
|---|---|---|---|---|---|
| **ChromaDB** | Good | ✅ Yes | Simple, Python-native, embeds | Single-node | ✅ **PRIMARY** |
| FAISS | Excellent | ❌ Manual | Ultra-fast | No persistence | Fallback |
| Weaviate | Excellent | ✅ Yes | Feature-rich | Heavy, complex | Scale option |
| Qdrant | Excellent | ✅ Yes | Modern, fast | Newer ecosystem | Scale option |

**Selected: ChromaDB** — Zero-config, Python-native, perfect for MVP scale.

---

## 8.5 Grammar Analysis

| Tool | Accuracy | Speed | Pros | Cons | Selection |
|---|---|---|---|---|---|
| **LanguageTool** | Very High | Fast | Free self-hosted, 40+ languages | Server setup | ✅ **PRIMARY** |
| Grammarly API | Very High | Fast | Best accuracy | Paid | No |
| TextBlob | Medium | Very Fast | No setup | Low accuracy | No |

**Selected: LanguageTool (self-hosted)** — Free, accurate, handles technical vocabulary.

---

## 8.6 Voice/Confidence Analysis

| Tool | Features | Pros | Cons | Selection |
|---|---|---|---|---|
| **Librosa** | Full audio analysis | Comprehensive, free, Python | CPU-intensive | ✅ **PRIMARY** |
| pyAudioAnalysis | Good | Research-grade | Less maintained | Fallback |
| OpenSMILE | Professional | Research-grade | Complex | No |

**Selected: Librosa** — Industry-standard audio analysis, complete feature set.

---

## 8.7 Recommended Final Stack

```
LLM:           Qwen 3 8B via Ollama
STT:           Whisper Large V3
Embeddings:    BAAI/bge-large-en-v1.5 via sentence-transformers
Vector DB:     ChromaDB
Grammar:       LanguageTool (self-hosted Docker)
Confidence:    Librosa + NumPy
```

---

# 9. FRONTEND ARCHITECTURE

## 9.1 Folder Structure

```
kaizenova-frontend/
├── app/                           # Next.js App Router
│   ├── (auth)/                    # Auth group (no navbar)
│   │   ├── login/
│   │   ├── register/
│   │   └── forgot-password/
│   ├── (dashboard)/               # Protected group (with navbar)
│   │   ├── dashboard/
│   │   ├── interviews/
│   │   │   ├── [id]/
│   │   │   │   ├── page.tsx       # Interview session
│   │   │   │   └── report/
│   │   │   └── start/
│   │   ├── analytics/
│   │   ├── growth/
│   │   ├── recommendations/
│   │   └── profile/
│   ├── api/                       # Next.js API routes (auth proxies)
│   ├── layout.tsx
│   ├── page.tsx                   # Landing page
│   └── globals.css
│
├── components/
│   ├── ui/                        # ShadCN base components
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   └── OAuthButtons.tsx
│   ├── interview/
│   │   ├── InterviewRoom.tsx
│   │   ├── QuestionCard.tsx
│   │   ├── AudioRecorder.tsx
│   │   ├── TimerBar.tsx
│   │   ├── ScoreCard.tsx
│   │   ├── FeedbackPanel.tsx
│   │   └── DifficultyIndicator.tsx
│   ├── analytics/
│   │   ├── RadarChart.tsx
│   │   ├── DifficultyJourney.tsx
│   │   ├── TopicBreakdown.tsx
│   │   └── ScoreTrend.tsx
│   ├── dashboard/
│   │   ├── ReadinessCard.tsx
│   │   ├── RecentInterviews.tsx
│   │   ├── StreakWidget.tsx
│   │   └── WeakAreasCard.tsx
│   ├── growth/
│   │   ├── CalendarHeatmap.tsx
│   │   ├── StreakDisplay.tsx
│   │   └── GrowthChart.tsx
│   └── shared/
│       ├── Navbar.tsx
│       ├── Sidebar.tsx
│       ├── LoadingSpinner.tsx
│       ├── ErrorBoundary.tsx
│       └── ConfirmDialog.tsx
│
├── lib/
│   ├── api/
│   │   ├── client.ts              # Axios instance with interceptors
│   │   ├── auth.ts
│   │   ├── interviews.ts
│   │   ├── analytics.ts
│   │   └── profile.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useInterview.ts
│   │   ├── useAudioRecorder.ts
│   │   └── useWebSocket.ts
│   ├── stores/                    # Zustand stores
│   │   ├── authStore.ts
│   │   ├── interviewStore.ts
│   │   └── uiStore.ts
│   ├── utils/
│   │   ├── formatScore.ts
│   │   ├── dateUtils.ts
│   │   └── validation.ts
│   └── constants/
│       ├── routes.ts
│       └── config.ts
│
├── types/
│   ├── user.types.ts
│   ├── interview.types.ts
│   └── analytics.types.ts
│
├── public/
├── next.config.js
├── tailwind.config.js
└── tsconfig.json
```

## 9.2 State Management (Zustand)

```typescript
// authStore.ts
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

// interviewStore.ts
interface InterviewState {
  sessionId: string | null;
  currentQuestion: Question | null;
  currentScore: ScoreCard | null;
  sessionState: SessionState;
  difficulty: number;
  isRecording: boolean;
  timeRemaining: number;
  setCurrentQuestion: (q: Question) => void;
  submitAnswer: (audio: Blob | string) => Promise<void>;
  completeSession: () => Promise<void>;
}
```

## 9.3 API Layer

```typescript
// lib/api/client.ts
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 30000,
});

// Request interceptor: attach JWT
apiClient.interceptors.request.use((config) => {
  const token = authStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor: auto-refresh on 401
apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      await authStore.getState().refreshToken();
      return apiClient.request(error.config);
    }
    return Promise.reject(error);
  }
);
```

## 9.4 Pages Description

### Landing Page (`/`)
- Hero section with animated tagline
- Feature highlights (adaptive difficulty, confidence analysis, streaks)
- Social proof / metrics
- CTA: "Start Preparing Free"

### Dashboard (`/dashboard`)
- **Components:** ReadinessCard, StreakWidget, RecentInterviews, WeakAreasCard, AI Coach message
- **User Flow:** View readiness score → check streak → see recent performance → start new interview

### Interview Setup (`/interviews/start`)
- **Components:** InterviewTypeSelector, DifficultySelector, DurationSelector, DomainSelector
- **User Flow:** Choose type → choose difficulty → choose duration → click "Start Interview"

### Interview Room (`/interviews/[id]`)
- **Components:** QuestionCard, AudioRecorder, TimerBar, DifficultyIndicator, FeedbackPanel
- **User Flow:** Read question → record answer → view real-time score → see next question

### Interview Report (`/interviews/[id]/report`)
- **Components:** OverallScore, RadarChart, DifficultyJourney, TopicBreakdown, WeakAreas, Recommendations
- **User Flow:** See overall score → explore radar → check difficulty journey → read recommendations

### Analytics (`/analytics`)
- **Components:** ScoreTrend, DomainComparison, ReadinessHistory, PerformanceHeatmap

### Growth Tracker (`/growth`)
- **Components:** CalendarHeatmap, StreakDisplay, ConsistencyChart, YearlyView

### Profile (`/profile`)
- **Components:** ProfileForm, SkillsManager, TargetSettings, AvatarUpload

## 9.5 Protected Routes

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token');
  const isProtectedPath = PROTECTED_PATHS.some(p => request.nextUrl.pathname.startsWith(p));

  if (isProtectedPath && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  if (token && AUTH_ONLY_PATHS.includes(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
}
```

---

# 10. BACKEND ARCHITECTURE

## 10.1 Folder Structure

```
kaizenova-backend/
├── app/
│   ├── main.py                    # FastAPI app entry
│   ├── config.py                  # Settings (pydantic-settings)
│   ├── dependencies.py            # Shared dependencies (DB, auth)
│   │
│   ├── api/
│   │   ├── v1/
│   │   │   ├── router.py          # Main v1 router
│   │   │   ├── auth.py
│   │   │   ├── profile.py
│   │   │   ├── interviews.py
│   │   │   ├── analytics.py
│   │   │   ├── streaks.py
│   │   │   ├── recommendations.py
│   │   │   └── resumes.py
│   │   └── websocket/
│   │       └── interview_ws.py    # WebSocket handler
│   │
│   ├── services/
│   │   ├── auth_service.py
│   │   ├── interview_service.py
│   │   ├── evaluation_service.py
│   │   ├── analytics_service.py
│   │   ├── recommendation_service.py
│   │   ├── streak_service.py
│   │   └── resume_service.py
│   │
│   ├── ai/
│   │   ├── llm_engine.py          # Qwen3/Ollama interface
│   │   ├── stt_engine.py          # Whisper interface
│   │   ├── embedding_engine.py    # BGE embeddings
│   │   ├── confidence_engine.py   # Librosa analysis
│   │   ├── grammar_engine.py      # LanguageTool interface
│   │   ├── adaptive_engine.py     # Difficulty engine
│   │   ├── evaluation_engine.py   # Answer evaluation orchestrator
│   │   └── recommendation_engine.py
│   │
│   ├── repositories/
│   │   ├── base_repository.py
│   │   ├── user_repository.py
│   │   ├── interview_repository.py
│   │   ├── question_repository.py
│   │   ├── answer_repository.py
│   │   └── analytics_repository.py
│   │
│   ├── models/
│   │   ├── database/              # SQLAlchemy ORM models
│   │   │   ├── user.py
│   │   │   ├── interview.py
│   │   │   ├── question.py
│   │   │   └── analytics.py
│   │   └── schemas/               # Pydantic schemas
│   │       ├── auth_schema.py
│   │       ├── interview_schema.py
│   │       └── analytics_schema.py
│   │
│   ├── core/
│   │   ├── security.py            # JWT, password hashing
│   │   ├── exceptions.py          # Custom exceptions
│   │   ├── middleware.py          # Rate limiting, logging, CORS
│   │   └── events.py              # Startup/shutdown events
│   │
│   ├── db/
│   │   ├── session.py             # Database session factory
│   │   ├── redis.py               # Redis client
│   │   └── migrations/            # Alembic migrations
│   │
│   ├── tasks/
│   │   ├── celery_app.py          # Celery configuration
│   │   ├── evaluation_tasks.py    # Async AI evaluation
│   │   └── analytics_tasks.py     # Report generation
│   │
│   └── utils/
│       ├── file_handler.py
│       ├── email_sender.py
│       └── logger.py
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── conftest.py
│
├── alembic/
├── docker/
├── requirements.txt
├── Dockerfile
└── docker-compose.yml
```

## 10.2 Layered Architecture

```
┌──────────────────────────────────────────────────┐
│              API Layer (FastAPI Routers)           │
│   Input validation • Authentication • Response    │
└─────────────────────┬────────────────────────────┘
                      │ calls
┌─────────────────────▼────────────────────────────┐
│              Service Layer                        │
│   Business logic • Orchestration • Rules          │
└─────────────────────┬────────────────────────────┘
                      │ calls
┌─────────────────────▼────────────────────────────┐
│              Repository Layer                     │
│   Database queries • ORM • Caching               │
└─────────────────────┬────────────────────────────┘
                      │ queries
┌─────────────────────▼────────────────────────────┐
│              Database Layer                       │
│   PostgreSQL • Redis • ChromaDB                  │
└──────────────────────────────────────────────────┘
```

## 10.3 Key Middleware Stack

```python
# main.py
app = FastAPI(title="Kaizenova API", version="1.0.0")

# CORS
app.add_middleware(CORSMiddleware, allow_origins=[...], allow_credentials=True)

# Rate Limiting (slowapi)
app.state.limiter = Limiter(key_func=get_remote_address)

# Request Logging (structured JSON)
app.add_middleware(RequestLoggingMiddleware)

# Correlation ID
app.add_middleware(CorrelationIdMiddleware)

# Security Headers
app.add_middleware(SecurityHeadersMiddleware)
```

## 10.4 Repository Pattern

```python
# repositories/base_repository.py
class BaseRepository(Generic[T]):
    def __init__(self, db: AsyncSession, model: Type[T]):
        self.db = db
        self.model = model

    async def get_by_id(self, id: UUID) -> T | None: ...
    async def create(self, data: dict) -> T: ...
    async def update(self, id: UUID, data: dict) -> T | None: ...
    async def delete(self, id: UUID) -> bool: ...
    async def list(self, filters: dict, limit: int, offset: int) -> list[T]: ...
```

---

# 11. UI/UX DESIGN BLUEPRINT

## 11.1 Complete User Journey

```
DISCOVERY
    │
    ▼
Landing Page (unauthenticated)
└── CTA: "Start Free" → Register
    │
    ▼
ONBOARDING (3 steps)
    Step 1: Account Creation (email/OAuth)
    Step 2: Profile Setup (name, education, experience)
    Step 3: Target Setup (role, company, domains)
    │
    ▼
DASHBOARD (Home)
└── Readiness Score Card
└── Streak Widget
└── Recent Interviews
└── AI Coach Message (personalized)
└── CTA: "Start New Interview"
    │
    ▼
INTERVIEW SETUP
└── Type Selection (Technical/HR/Behavioral/Coding/Resume)
└── Domain Selection (Python/SQL/etc.)
└── Difficulty (Auto/Beginner/Mid/Advanced)
└── Duration (15/30/45/60 min)
└── CTA: "Start Interview"
    │
    ▼
INTERVIEW ROOM (Core Experience)
└── Question displayed
└── Audio recorder (waveform visualizer)
└── Timer (session + per-question)
└── Difficulty indicator
└── Submit → Real-time feedback card
└── Next question appears
└── Repeat until session ends
    │
    ▼
INTERVIEW REPORT
└── Celebration animation
└── Overall score (large, animated)
└── Radar chart (6 dimensions)
└── Difficulty journey line
└── Topic breakdown
└── Weak + Strong areas
└── AI Recommendations
└── CTA: "View Growth" or "Start Another"
    │
    ▼
GROWTH TRACKER
└── Calendar heatmap (GitHub style)
└── Streak display
└── Consistency chart
└── Monthly summary
    │
    ▼
ANALYTICS
└── Score trends over time
└── Domain performance comparison
└── Readiness level progression
└── Percentile ranking
```

## 11.2 Dashboard Wireframe

```
┌─────────────────────────────────────────────────────────────┐
│  🌟 KAIZENOVA          [Dashboard] [Interviews] [Growth]    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Good morning, John! 👋                                     │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ READINESS    │  │ STREAK 🔥    │  │ THIS WEEK    │     │
│  │    72/100    │  │   7 Days     │  │  3 sessions  │     │
│  │  Job Ready   │  │  Longest: 21 │  │  Avg: 74.2  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ AI COACH                                               │ │
│  │ "You struggle with SQL Joins. Practice these 5        │ │
│  │  problems today. You've improved 12% this month! 🎉"  │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  [▶ START NEW INTERVIEW]                                    │
│                                                             │
│  RECENT INTERVIEWS                                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Python Technical  |  82/100  |  Jan 15  |  [View]   │   │
│  │ SQL Interview     |  68/100  |  Jan 14  |  [View]   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 11.3 Interview Room Wireframe

```
┌─────────────────────────────────────────────────────────────┐
│  KAIZENOVA INTERVIEW  │ Python Technical │ ⏱ 28:42 left     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Difficulty: ████░░  MEDIUM                                 │
│  Question 3 of ~12                                          │
│                                                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                                                        │ │
│  │  Explain the difference between a Python Generator    │ │
│  │  and a regular function. Why would you use one?       │ │
│  │                                                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  ⏱ 01:45 remaining for this question                       │
│  ████████████████████░░░░░░░                               │
│                                                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  🎙 RECORDING                                          │ │
│  │  ▂▃▅▇▆▄▃▅▇▆▃▂▁▂▃▅▆▇▅▄▃▂                             │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  [⏸ PAUSE]  [⏹ STOP & SUBMIT]  [⏭ SKIP]                  │
│                                                             │
│  ── LAST ANSWER FEEDBACK ──────────────────────────────── │
│  Score: 82/100  ✅ Good understanding of OOP              │
│  Missing: memory efficiency of generators                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 11.4 Analytics Page Wireframe

```
┌─────────────────────────────────────────────────────────────┐
│  ANALYTICS                                    [30d ▼]       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────┐  ┌──────────────────────────────┐ │
│  │   SKILL RADAR        │  │    SCORE TREND               │ │
│  │                      │  │  90 ┤    ╭─╮                 │ │
│  │     Technical        │  │  80 ┤  ╭─╯ ╰─╮              │ │
│  │    ╱────────╲        │  │  70 ┤──╯     ╰─              │ │
│  │  Comm     Confidence │  │  60 ┤                        │ │
│  │    ╲────────╱        │  │     └──────────────────      │ │
│  │   Grammar Fluency    │  │      Jan 1        Jan 30     │ │
│  └──────────────────────┘  └──────────────────────────────┘ │
│                                                             │
│  TOPIC BREAKDOWN                                            │
│  Python OOP        ████████████████████░░  90%            │
│  SQL Basic         █████████████░░░░░░░░░  62%            │
│  SQL Joins         ████████░░░░░░░░░░░░░░  38%  ⚠ Weak   │
│  Data Structures   ██████████████████░░░░  85%            │
│                                                             │
│  DIFFICULTY JOURNEY                                         │
│  Easy ──●──●──●──●──●── Medium ──●──●──●──●── Hard ──●    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 11.5 Growth Tracker Wireframe

```
┌─────────────────────────────────────────────────────────────┐
│  GROWTH TRACKER                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🔥 Current Streak: 7 days   │  Best: 21 days              │
│                                                             │
│  JANUARY 2024                                               │
│  Mo Tu We Th Fr Sa Su                                       │
│        ▣  ▣  ▣  ▣  ▣                                      │
│  ▣  ▣  ▣  ▣  ▣  ▣  ▣                                      │
│  ▣  ▣  ▣  ▣  ▣  □  □                                      │
│  ▣  ▣  ▣  ▣  ▣                                             │
│                                                             │
│  ▣ = Active  □ = Missed                                     │
│                                                             │
│  READINESS JOURNEY                                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Expert  ─────────────────────────────── 81+        │   │
│  │  Job Ready ─── ──────────── ●            61–80      │   │
│  │  Developing ──●             ↑            41–60      │   │
│  │  Beginner  ●   You          Now          0–40       │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

# 12. DEVOPS & DEPLOYMENT

## 12.1 Development Environment

```yaml
# docker-compose.dev.yml
version: '3.9'
services:
  frontend:
    build: ./frontend
    ports: ["3000:3000"]
    volumes: ["./frontend:/app"]
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000

  backend:
    build: ./backend
    ports: ["8000:8000"]
    volumes: ["./backend:/app"]
    depends_on: [postgres, redis]
    environment:
      - DATABASE_URL=postgresql+asyncpg://...
      - REDIS_URL=redis://redis:6379

  postgres:
    image: postgres:16-alpine
    ports: ["5432:5432"]
    environment:
      POSTGRES_DB: kaizenova_dev
      POSTGRES_USER: kaizenova
      POSTGRES_PASSWORD: devpass

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  ollama:
    image: ollama/ollama:latest
    ports: ["11434:11434"]
    volumes: ["ollama_models:/root/.ollama"]

  languagetool:
    image: silviof/docker-languagetool:latest
    ports: ["8010:8010"]

  chromadb:
    image: chromadb/chroma:latest
    ports: ["8001:8000"]

volumes:
  postgres_data:
  ollama_models:
  chroma_data:
```

## 12.2 CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: Kaizenova CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v4
        with: {python-version: '3.11'}
      - run: pip install -r requirements.txt
      - run: pytest tests/ --cov=app --cov-report=xml
      - uses: codecov/codecov-action@v3

  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: {node-version: '20'}
      - run: npm ci
      - run: npm run type-check
      - run: npm run lint
      - run: npm test

  deploy-staging:
    needs: [test-backend, test-frontend]
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy Backend to Render (Staging)
        run: curl -X POST ${{ secrets.RENDER_DEPLOY_HOOK_STAGING }}
      - name: Deploy Frontend to Vercel (Preview)
        run: npx vercel --token ${{ secrets.VERCEL_TOKEN }}

  deploy-production:
    needs: [test-backend, test-frontend]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy Backend to Railway (Production)
        run: railway up --service backend
      - name: Deploy Frontend to Vercel (Production)
        run: npx vercel --prod --token ${{ secrets.VERCEL_TOKEN }}
```

## 12.3 Production Environment

```
Frontend:       Vercel (Global CDN, automatic HTTPS)
Backend:        Railway (auto-scaling, Docker)
Database:       Supabase PostgreSQL (free tier → Pro)
Cache:          Redis Cloud (free 30MB → paid)
AI Services:    Separate Railway service (GPU optional)
Storage:        Cloudinary (free 25GB)
Monitoring:     Sentry (free tier) + Grafana Cloud (free)
Uptime:         UptimeRobot (free)
Email:          Resend (free 3000/month)
```

## 12.4 Monitoring Setup

```yaml
# Prometheus scrape config
scrape_configs:
  - job_name: 'kaizenova-backend'
    static_configs:
      - targets: ['backend:8000']
    metrics_path: '/metrics'

# Grafana Dashboards:
# 1. API Performance (P50, P95, P99 latency)
# 2. AI Service Latency (evaluation, STT, LLM)
# 3. User Metrics (DAU, MAU, interview completions)
# 4. Error Rates by endpoint
# 5. Database query performance
```

## 12.5 Backup Strategy

```bash
# Automated daily PostgreSQL backup
#!/bin/bash
DATE=$(date +%Y%m%d)
pg_dump $DATABASE_URL | gzip > "backup_$DATE.sql.gz"
# Upload to Cloudinary or S3-compatible storage
# Retain last 30 days
# Weekly full backup retained for 90 days
```

## 12.6 Rollback Strategy

```bash
# Instant rollback via Vercel (frontend)
vercel rollback [deployment-url]

# Railway rollback (backend)
railway rollback --service backend --deployment [id]

# Database rollback
# Alembic downgrade: alembic downgrade -1
# Restore from backup if schema breaking
```

---

# 13. SECURITY ARCHITECTURE

## 13.1 JWT Security

```python
# core/security.py
ALGORITHM = "RS256"                     # Asymmetric signing
ACCESS_TOKEN_EXPIRE = 900               # 15 minutes
REFRESH_TOKEN_EXPIRE = 604800           # 7 days

def create_access_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(seconds=ACCESS_TOKEN_EXPIRE),
        "jti": str(uuid4()),            # Unique token ID for revocation
        "type": "access"
    }
    return jwt.encode(payload, PRIVATE_KEY, algorithm=ALGORITHM)

# Token blacklist in Redis (for logout)
async def blacklist_token(jti: str, exp: int):
    ttl = exp - int(datetime.utcnow().timestamp())
    await redis.setex(f"blacklist:{jti}", ttl, "1")
```

## 13.2 Rate Limiting

```python
# Per endpoint limits
@router.post("/auth/login")
@limiter.limit("5/minute")             # Login: 5/min per IP

@router.post("/interviews/start")
@limiter.limit("10/hour")              # Interview start: 10/hour per user

@router.post("/interviews/{id}/answer")
@limiter.limit("60/minute")            # Answers: 60/min per user (1/sec)
```

## 13.3 File Upload Security

```python
ALLOWED_AUDIO_TYPES = {"audio/webm", "audio/wav", "audio/ogg"}
ALLOWED_RESUME_TYPES = {"application/pdf", "application/vnd.openxmlformats..."}
MAX_AUDIO_SIZE = 50 * 1024 * 1024       # 50MB
MAX_RESUME_SIZE = 10 * 1024 * 1024      # 10MB

async def validate_upload(file: UploadFile):
    # 1. Check file size
    content = await file.read(MAX_SIZE + 1)
    if len(content) > MAX_SIZE:
        raise FileTooLargeError()

    # 2. Validate magic bytes (not just extension)
    mime = magic.from_buffer(content[:2048], mime=True)
    if mime not in ALLOWED_TYPES:
        raise InvalidFileTypeError()

    # 3. Re-encode audio (strip metadata, prevent polyglot files)
    return content
```

## 13.4 Input Validation & SQL Injection Prevention

```python
# All DB queries via SQLAlchemy ORM (parameterized by default)
# Never use string formatting for queries

# Pydantic validation on all inputs
class AnswerTextRequest(BaseModel):
    answer_text: str = Field(max_length=5000, min_length=0)
    question_id: UUID

    @validator('answer_text')
    def sanitize_text(cls, v):
        # Strip HTML tags
        return bleach.clean(v, tags=[], strip=True)
```

## 13.5 Security Headers

```python
# middleware/security_headers.py
SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "Content-Security-Policy": "default-src 'self'; ...",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "microphone=(self)"  # Allow mic for interview
}
```

## 13.6 Encryption Strategy

```
Data at Rest:
  - PostgreSQL: AES-256 (Supabase handles)
  - PII fields: application-level encryption (cryptography library)
  - Passwords: bcrypt (cost=12)
  - Audio files: Cloudinary encrypted storage

Data in Transit:
  - TLS 1.3 enforced (HSTS)
  - Internal services: mTLS (production)

Secrets Management:
  - Environment variables (Railway/Vercel secrets)
  - Never committed to git (.env.example only)
  - Rotate keys quarterly
```

---

# 14. ANALYTICS & METRICS

## 14.1 Product Metrics (North Star)

| Metric | Definition | Target |
|---|---|---|
| **Weekly Active Users (WAU)** | Users completing ≥ 1 interview/week | 60% of registered users |
| **Interview Completion Rate** | Completed sessions / Started sessions | ≥ 85% |
| **Average Score Improvement** | Score delta between first and 5th interview | ≥ +10 points |
| **Day-7 Retention** | Users returning within 7 days of registration | ≥ 40% |

## 14.2 User Metrics

| Metric | Definition |
|---|---|
| Total Registered Users | Cumulative unique accounts |
| Daily Active Users (DAU) | Users with ≥ 1 activity per day |
| Monthly Active Users (MAU) | Users with ≥ 1 activity per month |
| DAU/MAU Ratio | Stickiness indicator (target: ≥ 20%) |
| User Activation Rate | Users completing profile setup |
| Churn Rate | Users inactive for 30+ days |

## 14.3 Interview Metrics

| Metric | Definition |
|---|---|
| Interviews Per User Per Week | Activity intensity |
| Average Interview Duration | Session engagement |
| Average Questions Per Session | Depth of engagement |
| Score Distribution | Platform calibration |
| Most Common Weak Areas | Content prioritization |
| Difficulty Distribution | Engine calibration |

## 14.4 Growth Metrics

| Metric | Definition |
|---|---|
| Readiness Score Growth Rate | Average delta per 30 days |
| Streak Continuation Rate | % users maintaining ≥ 3-day streak |
| Recommendation Follow-Through | % users completing suggested tasks |
| Domain Coverage | Avg domains practiced per user |

## 14.5 KPI Definitions

```
Interview Readiness Score (IRS):
    IRS = (Technical × 0.50) + (Communication × 0.20) + (Confidence × 0.15) + (Consistency × 0.15)

    Readiness Levels:
    0–40:   Beginner      → "Keep Practicing"
    41–60:  Developing    → "On the Right Track"
    61–80:  Job Ready     → "Ready for Interviews"
    81–100: Expert        → "Interview Champion"

Consistency Score (used in IRS):
    Consistency = (active_days_last_30 / 30) × 100
    Weighted more for recent 14 days vs older 16 days

Score Improvement Velocity:
    SIV = (current_avg_score − 30_day_ago_avg_score) / 30
    Positive SIV → growing
    Negative SIV → declining → trigger AI Coach alert
```

---

# 15. DEVELOPMENT ROADMAP

## Phase 1: MVP (Weeks 1–8)

### Week 1: Project Setup & Infrastructure
- **Deliverables:**
  - Next.js project with TypeScript, Tailwind, ShadCN
  - FastAPI project with folder structure
  - Docker Compose (dev environment)
  - PostgreSQL schema (users, profiles, interviews, questions, answers)
  - Alembic migrations setup
  - GitHub repo + CI/CD skeleton
  - `.env` structure and config system

### Week 2: Authentication System
- **Deliverables:**
  - User registration + email verification
  - Login with JWT (access + refresh)
  - Google OAuth integration
  - Password reset flow
  - Auth middleware (FastAPI dependency)
  - Frontend: Login, Register, Forgot Password pages

### Week 3: User Profile & Onboarding
- **Deliverables:**
  - Profile setup wizard (3 steps)
  - Skills and domain selection
  - Profile completeness score
  - Frontend: Onboarding flow, Profile page
  - API: Profile CRUD endpoints

### Week 4: Question Bank & Interview Setup
- **Deliverables:**
  - Question bank schema populated (Python, SQL, Data Engineering — 50 questions each, 4 levels)
  - Interview setup page (type, difficulty, duration, domain)
  - Interview Service: session initialization
  - Session state management (Redis)

### Week 5: Core Interview Engine
- **Deliverables:**
  - Fixed round 1: "Tell me about yourself"
  - Question delivery flow
  - Timer management (per-question + session)
  - Text answer submission (audio in Phase 3)
  - Basic LLM evaluation (technical only) via Ollama
  - Interview Room UI (question display, text input, timer)
  - WebSocket for real-time feedback

### Week 6: Basic Evaluation & Scoring
- **Deliverables:**
  - Technical accuracy scoring (LLM + embeddings)
  - Composite score calculation (weighted)
  - Answer stored with scores
  - Basic feedback text generated
  - Score card displayed after each answer

### Week 7: Adaptive Difficulty Engine
- **Deliverables:**
  - Difficulty transition logic implemented
  - Session state tracks score history
  - Question selection by difficulty level
  - Difficulty indicator in UI
  - End-to-end adaptive interview flow working

### Week 8: Interview Report & Dashboard (MVP)
- **Deliverables:**
  - Interview completion flow
  - Report generation (overall score, topic breakdown)
  - Basic dashboard (score cards, recent interviews)
  - MVP deployed to Vercel + Railway + Supabase
  - Internal testing session

---

## Phase 2: Advanced Features (Weeks 9–16)

### Week 9: Full Analytics Dashboard
- **Deliverables:**
  - Radar chart (6 dimensions)
  - Difficulty journey visualization
  - Topic-level performance breakdown
  - Weak and strong area detection
  - Historical score trend chart

### Week 10: Recommendation Engine
- **Deliverables:**
  - Weakness detection algorithm
  - Root cause classification
  - Action plan generation via LLM
  - Estimated improvement score
  - Recommendations page

### Week 11: Streak & Daily Activity System
- **Deliverables:**
  - Streak tracking logic
  - Streak freeze system
  - Daily activity logging
  - Calendar heatmap component
  - Real-time streak updates (WebSocket)

### Week 12: Growth Tracker
- **Deliverables:**
  - Readiness score calculation
  - Readiness level progression
  - Growth trend charts
  - Monthly consistency report
  - Yearly calendar view

### Week 13: AI Coach
- **Deliverables:**
  - Personalized coach messages (LLM-generated)
  - Context-aware suggestions
  - Progress celebration triggers
  - Dashboard coach card

### Week 14: Grammar & Communication Evaluation
- **Deliverables:**
  - LanguageTool integration (self-hosted)
  - Grammar score calculation
  - Communication structure scoring
  - Updated composite scoring with grammar

### Week 15: Company-Specific Mode
- **Deliverables:**
  - Company profiles (Google, Amazon, Microsoft, TCS, Infosys)
  - Company-tagged questions (50 per company)
  - Company-specific evaluation rubric
  - Company selection UI

### Week 16: Beta Testing & Bug Fixes
- **Deliverables:**
  - Closed beta (50 users)
  - Bug tracking and resolution
  - Performance profiling
  - UX improvements from feedback

---

## Phase 3: Production Ready (Weeks 17–24)

### Week 17: Speech-to-Text Integration
- **Deliverables:**
  - WebRTC audio capture in browser
  - Audio upload to backend
  - Whisper Large V3 integration
  - Transcript storage and display

### Week 18: Confidence & Voice Analysis
- **Deliverables:**
  - Librosa integration
  - WPM calculation
  - Pause detection
  - Filler word detection
  - Confidence score in evaluation

### Week 19: Resume-Based Interview
- **Deliverables:**
  - PDF/DOCX upload
  - Resume parsing (LLM extraction)
  - Personalized question generation
  - Resume interview session flow

### Week 20: Coding Interview Module
- **Deliverables:**
  - Monaco editor integration
  - Code submission endpoint
  - Sandboxed execution (Docker)
  - Test case validation
  - Complexity analysis

### Week 21: Security Hardening
- **Deliverables:**
  - Complete security audit
  - Penetration testing
  - Rate limiting on all endpoints
  - OWASP Top 10 review
  - Security headers

### Week 22: Performance Optimization
- **Deliverables:**
  - Database query optimization
  - Redis caching strategy implemented
  - API response time profiling
  - Frontend bundle optimization
  - CDN configuration

### Week 23: Monitoring & Observability
- **Deliverables:**
  - Sentry error tracking (all services)
  - Prometheus + Grafana dashboards
  - Structured logging (all services)
  - Alerting rules configured
  - Runbook documentation

### Week 24: Public Launch
- **Deliverables:**
  - Production environment fully configured
  - Load testing completed
  - Backup and recovery tested
  - User onboarding polished
  - Marketing site live
  - Public launch

---

## Phase 4: Scale & Optimization (Weeks 25–32)

### Week 25–26: User Feedback Integration
- Feature requests prioritization
- UX improvements based on analytics
- A/B testing framework setup

### Week 27–28: Microservices Migration (if needed at scale)
- Extract AI Service as independent microservice
- Extract Analytics Service
- API Gateway (Kong/Traefik)

### Week 29–30: Advanced AI Features
- Fine-tuned evaluation model (domain-specific)
- Personalized question generation (LLM)
- Predictive performance modeling
- Interview readiness prediction

### Week 31–32: Enterprise Features
- Team accounts (companies buying for employees)
- Admin dashboard
- Bulk user management
- Custom company interview banks
- White-label option

---

# 16. TESTING STRATEGY

## 16.1 Unit Testing

```
Tool: pytest (backend), Jest + React Testing Library (frontend)

Backend Unit Tests:
├── test_adaptive_engine.py          → Difficulty transitions
├── test_evaluation_engine.py        → Score calculations
├── test_streak_service.py           → Streak logic, freezes
├── test_recommendation_engine.py    → Weakness detection
├── test_auth_service.py             → JWT, password hashing
└── test_readiness_calculator.py     → Readiness formula

Frontend Unit Tests:
├── AudioRecorder.test.tsx
├── ScoreCard.test.tsx
├── RadarChart.test.tsx
└── StreakWidget.test.tsx

Coverage Target: ≥ 80% line coverage
```

## 16.2 Integration Testing

```
Tool: pytest with TestClient (FastAPI)

Tests:
├── test_interview_flow.py           → Full interview: start → answer → complete
├── test_auth_flow.py                → Register → verify → login → refresh
├── test_evaluation_pipeline.py      → Audio → STT → LLM → Score
├── test_analytics_aggregation.py    → Complete session → dashboard data
└── test_streak_activity.py          → Activity → streak update

Database: Test PostgreSQL instance (Docker)
Cache: Test Redis (fakeredis or Docker)
AI Services: Mocked with pytest fixtures
```

## 16.3 API Testing

```
Tool: Pytest + httpx (async) + Postman collections

Test Scenarios:
├── Happy path for all endpoints
├── Authentication failures (401, 403)
├── Validation errors (422)
├── Rate limiting (429)
├── Large payload handling
└── Concurrent request handling

Load Testing: Locust
├── 100 concurrent users (MVP target)
├── Simulate full interview session
└── Target: P95 < 500ms for non-AI endpoints
```

## 16.4 AI Evaluation Testing

```
Test Dataset: 200 manually scored answer pairs (ground truth)

Metrics:
├── Mean Absolute Error (MAE) vs human scores: target < 10 points
├── Pearson correlation with human scores: target > 0.85
├── Concept extraction F1-score: target > 0.80
└── Confidence score correlation with perceived confidence: target > 0.70

Tools: Custom evaluation harness + pandas for analysis
```

## 16.5 Security Testing

```
Tools: OWASP ZAP (DAST), Bandit (Python static analysis), npm audit

Tests:
├── SQL injection on all inputs
├── XSS in feedback text rendering
├── JWT token manipulation
├── Rate limiting bypass attempts
├── File upload bypasses (malicious files)
└── Authentication bypass attempts

Schedule: Run security scan on every PR (GitHub Actions)
```

---

# 17. RISK ANALYSIS

## 17.1 Technical Risks

| Risk | Impact | Probability | Mitigation |
|---|---|---|---|
| AI evaluation inconsistency | High | Medium | Ground truth test set + human validation loop |
| Ollama/LLM service latency | High | Medium | Async evaluation, WebSocket progress, caching similar answers |
| Whisper transcription accuracy (accents) | Medium | High | Language detection, fallback to text input |
| Database performance at scale | High | Low | Indexing, read replicas, partitioning from day one |
| WebRTC audio capture failure | Medium | Medium | Fallback text input always available |

## 17.2 AI Risks

| Risk | Impact | Probability | Mitigation |
|---|---|---|---|
| LLM hallucination in feedback | High | Medium | Prompt engineering, expected answer anchoring |
| Biased evaluation (non-native English) | High | Medium | Multi-language testing, accent calibration |
| Model drift over time | Medium | Low | Periodic re-evaluation against ground truth |
| Prompt injection in answers | Medium | Low | Input sanitization before LLM prompts |

## 17.3 Performance Risks

| Risk | Impact | Probability | Mitigation |
|---|---|---|---|
| Spike traffic (viral moment) | High | Low | Auto-scaling, CDN, async queuing |
| AI service queue backup | High | Medium | Celery task queue, worker scaling |
| Cold start latency (Railway/Render) | Medium | High | Keep-alive pings, pre-warming |

## 17.4 Security Risks

| Risk | Impact | Probability | Mitigation |
|---|---|---|---|
| JWT token theft | Critical | Low | Short expiry, HttpOnly cookies, rotation |
| Data breach (PII) | Critical | Very Low | Encryption at rest + transit, minimal PII |
| DDoS attack | High | Low | Rate limiting, Cloudflare free tier |
| Malicious file upload | High | Low | Magic bytes validation, sandboxed processing |

## 17.5 Product Risks

| Risk | Impact | Probability | Mitigation |
|---|---|---|---|
| Low user retention | High | Medium | Streak gamification, AI coach engagement |
| Question bank exhaustion | Medium | Medium | Community submissions, LLM generation |
| Free tier cost overrun | Medium | Medium | Usage alerts, feature gating |
| Competitor copying features | Low | High | Speed of execution, community building |

---

# 18. FUTURE SCALING STRATEGY

## 18.1 100 Users (MVP)

```
Infrastructure:
├── Frontend: Vercel free tier
├── Backend: Single Railway instance (512MB RAM)
├── Database: Supabase free tier (500MB)
├── Cache: Redis Cloud free (30MB)
└── AI: Ollama on Railway (shared CPU)

Bottlenecks: None expected
Cost: ~$0/month (all free tiers)
```

## 18.2 1,000 Users

```
Infrastructure Changes:
├── Backend: Railway Pro ($20/month, more RAM)
├── Database: Supabase Pro ($25/month, 8GB)
├── Redis: Redis Cloud Essentials ($10/month)
├── AI: Dedicated Railway service for Ollama
└── Add: Celery workers for async AI tasks

Key Changes:
├── Celery task queue for AI evaluation
├── Redis caching for question bank
├── Database connection pooling (pgBouncer)
└── CDN for static assets (Vercel handles)

Cost: ~$60-80/month
```

## 18.3 10,000 Users

```
Infrastructure Changes:
├── Backend: 3× Railway instances + load balancer
├── Database: PostgreSQL read replica (analytics queries)
├── AI: Separate GPU-enabled server (RunPod.io ~$0.3/hr)
├── Queue: Celery + Redis with auto-scaling workers
├── Storage: Cloudinary Pro or AWS S3
└── CDN: Cloudflare Pro

Key Changes:
├── Database partitioning (monthly)
├── ChromaDB cluster for embeddings
├── Horizontal scaling of evaluation workers
├── Monitoring: Grafana Cloud Pro
└── Rate limiting per user + IP

Cost: ~$200-400/month
```

## 18.4 100,000 Users

```
Infrastructure Changes:
├── Kubernetes cluster (GKE or DigitalOcean)
├── Multi-region deployment (India + US)
├── PostgreSQL: AWS Aurora (managed, auto-scaling)
├── Redis: AWS ElastiCache cluster
├── AI: Multi-GPU cluster (A10G) or SageMaker endpoints
├── CDN: CloudFront or Fastly
└── Microservices: AI, Interview, Analytics as independent services

Key Changes:
├── Event-driven architecture (Kafka)
├── CQRS pattern for reads vs writes
├── Separate analytics database (TimescaleDB)
├── A/B testing infrastructure
├── Feature flags (self-hosted Flagsmith)
└── Full observability stack

Cost: ~$2,000-5,000/month
```

## 18.5 1 Million Users

```
Infrastructure:
├── Multi-region Kubernetes (3+ regions)
├── Global PostgreSQL (AWS Aurora Global)
├── Edge AI inference (CloudFront + Lambda)
├── Dedicated ML platform (SageMaker / Vertex AI)
├── Data Lake (S3 + Athena) for analytics
└── Real-time streaming (Kafka + Flink)

Organizational Changes:
├── Dedicated DevOps/SRE team
├── ML Engineering team
├── Data Engineering team
└── Platform Engineering team

Cost: ~$20,000-50,000/month
```

---

# 19. COST OPTIMIZATION

## 19.1 Free-Tier Architecture (Month 1–3)

| Service | Free Tier | Limit |
|---|---|---|
| Vercel | Unlimited deploys | 100GB bandwidth |
| Railway | $5 credit/month | ~500 hrs compute |
| Supabase | PostgreSQL free | 500MB, 50K rows |
| Redis Cloud | 30MB cache | 30MB |
| Cloudinary | Media hosting | 25GB storage |
| Sentry | Error tracking | 5K errors/month |
| GitHub Actions | CI/CD | 2000 min/month |
| UptimeRobot | Monitoring | 50 monitors |

**Estimated Month 1–3 Cost: $0–$15/month**

## 19.2 Growth Phase Cost (Month 4–12)

| Service | Paid Plan | Cost/Month |
|---|---|---|
| Railway Pro | 3 services | $40 |
| Supabase Pro | 8GB DB | $25 |
| Redis Cloud | Essentials | $10 |
| Cloudinary Plus | 100GB | $0 (free covers) |
| Sentry Team | 10K events | $0 (free covers) |
| Resend | Email | $0 (free 3K/month) |

**Estimated Month 4–12 Cost: ~$75/month**

## 19.3 Resource Optimization Strategy

```
1. AI Response Caching:
   - Cache LLM responses for identical question+answer pairs
   - Redis TTL: 7 days
   - Expected cache hit rate: ~30% (saves 30% LLM compute)

2. Lazy Audio Processing:
   - Process audio asynchronously (Celery)
   - User sees initial text-based score immediately
   - Voice confidence score appears 2-3 seconds later

3. Database Query Optimization:
   - Indexed all foreign keys and common filter columns
   - Read replicas for analytics (read-heavy)
   - Materialized views for dashboard aggregates

4. Question Bank Caching:
   - Full question bank cached in Redis
   - Refreshed every 24 hours
   - Eliminates ~80% of question-related DB queries

5. Static Asset Optimization:
   - Next.js Image optimization (automatic)
   - Tailwind CSS PurgeCSS (build-time)
   - Bundle splitting and lazy loading
```

---

# 20. FINAL DELIVERABLES

## 20.1 Complete Execution Roadmap

```
MONTH 1: Foundation
  Week 1–2: Infrastructure + Authentication
  Week 3–4: Profile + Question Bank

MONTH 2: Core Product
  Week 5–6: Interview Engine + Basic Evaluation
  Week 7–8: Adaptive Difficulty + MVP Dashboard

MONTH 3: Advanced Features
  Week 9–10: Analytics + Recommendations
  Week 11–12: Streaks + Growth Tracker

MONTH 4: Intelligence Layer
  Week 13–14: AI Coach + Grammar Evaluation
  Week 15–16: Company Mode + Beta Testing

MONTH 5–6: Full Feature Set
  Week 17–18: Speech Analysis + Confidence Engine
  Week 19–20: Resume + Coding Module
  Week 21–22: Security Hardening + Performance
  Week 23–24: Monitoring + Public Launch

MONTH 7–8: Scale & Growth
  Week 25–28: User Feedback + Microservices Prep
  Week 29–32: Advanced AI + Enterprise Features
```

## 20.2 Development Backlog (Priority Order)

### EPIC 1: Authentication & Onboarding
```
AUTH-001  User registration (email/password)
AUTH-002  Email verification flow
AUTH-003  JWT access + refresh token system
AUTH-004  Google OAuth integration
AUTH-005  Password reset flow
PROF-001  Profile setup wizard (3 steps)
PROF-002  Skill and domain selection
PROF-003  Profile completeness scoring
```

### EPIC 2: Interview Engine
```
INT-001   Interview setup (type, difficulty, duration, domain)
INT-002   Session initialization (Redis state)
INT-003   Question delivery and display
INT-004   Timer management (per-question + session)
INT-005   Text answer submission
INT-006   Audio answer submission (Phase 3)
INT-007   Session auto-save (crash recovery)
INT-008   Session pause and resume
```

### EPIC 3: AI Evaluation
```
EVAL-001  Whisper STT integration
EVAL-002  LLM technical accuracy scoring
EVAL-003  BGE embedding semantic similarity
EVAL-004  Concept extraction and classification
EVAL-005  LanguageTool grammar scoring
EVAL-006  Librosa confidence scoring
EVAL-007  Weighted composite score calculation
EVAL-008  Feedback text generation
```

### EPIC 4: Adaptive Engine
```
ADAP-001  Difficulty transition logic
ADAP-002  Score history tracking (Redis)
ADAP-003  Question selection by difficulty
ADAP-004  Difficulty indicator UI
ADAP-005  Domain fallback logic
```

### EPIC 5: Analytics & Reports
```
ANAL-001  Interview report generation
ANAL-002  Radar chart (6 dimensions)
ANAL-003  Difficulty journey visualization
ANAL-004  Topic-level performance breakdown
ANAL-005  Weak and strong area detection
ANAL-006  Historical score trend
ANAL-007  Percentile ranking
ANAL-008  Readiness score calculation
```

### EPIC 6: Gamification
```
GAME-001  Streak tracking logic
GAME-002  Streak freeze system (earn + apply)
GAME-003  Daily activity logging
GAME-004  Calendar heatmap (GitHub-style)
GAME-005  Yearly consistency view
GAME-006  Streak WebSocket real-time updates
```

### EPIC 7: Recommendation Engine
```
REC-001   Weakness detection algorithm
REC-002   Root cause classification
REC-003   Action plan generation (LLM)
REC-004   Estimated improvement calculation
REC-005   Recommendation status tracking
REC-006   AI Coach message generation
```

### EPIC 8: Advanced Modules
```
ADV-001   Resume upload and parsing
ADV-002   Resume-based question generation
ADV-003   Company-specific mode (5 companies)
ADV-004   Company question bank tagging
ADV-005   Coding interview (Monaco editor)
ADV-006   Code execution sandbox
ADV-007   Test case validation
```

## 20.3 Milestone Plan

| Milestone | Target Date | Success Criteria |
|---|---|---|
| M1: Infrastructure Ready | Week 2 | Dev environment running, DB schema migrated |
| M2: Auth Complete | Week 3 | User can register, login, set profile |
| M3: MVP Interview | Week 8 | User can complete adaptive interview, see report |
| M4: Analytics Live | Week 10 | Full dashboard with radar, trends, recommendations |
| M5: Gamification | Week 12 | Streaks, calendar, growth tracker live |
| M6: Beta Launch | Week 16 | 50 beta users, feedback collected |
| M7: Speech Layer | Week 18 | Voice evaluation working end-to-end |
| M8: Full Modules | Week 20 | Resume + Coding interview modules live |
| M9: Production Ready | Week 24 | Security audit passed, monitoring live |
| M10: Public Launch | Week 24 | Platform open to public, 100 sign-ups Day 1 |

---

## 20.4 Tech Stack Summary

```
Frontend:     Next.js 14, TypeScript, Tailwind CSS, ShadCN UI, Framer Motion
State:        Zustand, React Query (TanStack Query)
Backend:      FastAPI (Python 3.11), SQLAlchemy, Alembic, Celery
Database:     PostgreSQL 16, Redis 7
AI/ML:        Qwen 3 8B (Ollama), Whisper Large V3, BAAI/bge-large-en-v1.5
              ChromaDB, LanguageTool, Librosa
Auth:         JWT (RS256), bcrypt, Google OAuth 2.0
Testing:      pytest, Jest, React Testing Library, Locust
DevOps:       GitHub Actions, Docker, Docker Compose
Monitoring:   Sentry, Prometheus, Grafana
Deployment:   Vercel (frontend), Railway (backend), Supabase (DB)
Storage:      Cloudinary (media)
Comms:        WebSocket (FastAPI), Resend (email)
```

---

*This document represents a complete production-grade execution blueprint for Kaizenova. A team of 2–4 developers can begin immediate implementation following the Phase 1 roadmap. All architectural decisions are optimized for the free/open-source stack while maintaining production-grade quality.*

---

**Document Version:** 1.0
**Last Updated:** June 2024
**Status:** Ready for Implementation
