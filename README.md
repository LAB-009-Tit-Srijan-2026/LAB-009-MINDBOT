<div align="center">

<img src="app/public/logo.png" alt="Athex Logo" width="80" />

# Athex — AI-Powered Study Companion

**Transform any video lecture or audio recording into an interactive study workspace.**  
Transcribe → Chunk → Embed → Retrieve → Learn.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![Gemini](https://img.shields.io/badge/Gemini-Flash-4285F4?logo=google)](https://ai.google.dev)
[![Pinecone](https://img.shields.io/badge/Pinecone-Vector_DB-00BFA6)](https://pinecone.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

---

## What is Athex?

Athex is a full-stack AI study assistant that turns raw video and audio content into an intelligent, interactive learning experience. Upload a lecture file or paste a YouTube URL — Athex transcribes it, builds a semantic knowledge base, and gives you a complete study workspace with:

- 💬 **AI Chat Tutor** — RAG-powered Q&A with timestamp citations
- 📝 **Auto-Generated Notes** — Structured Markdown, downloadable as a styled PDF
- 🃏 **Flashcard Deck** — Spaced-repetition style front/back cards
- 🧠 **Quiz Engine** — Multi-choice questions with AI explanations
- 📋 **Mock Test** — Full timed exam simulation
- 📊 **Topic Summary** — Instant 5-bullet overview of any lecture section

---

## Tech Stack

### Frontend
| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| Styling | Vanilla CSS — glassmorphic "Aurora" design system |
| Animation | Framer Motion |
| PDF Export | jsPDF (client-side, zero-backend) |
| Markdown | react-markdown |
| Icons | lucide-react |

### Backend
| Layer | Technology |
|---|---|
| Framework | FastAPI + Uvicorn |
| Transcription | Deepgram SDK (Nova-2 model) |
| Embeddings | VoyageAI (`voyage-3-lite`) |
| Vector Store | Pinecone (semantic search) |
| LLM | Google Gemini Flash |
| Auth | JWT + bcrypt + Google OAuth 2.0 |
| Database | SQLite (via aiosqlite) |
| PDF | fpdf2 (backend export fallback) |

---

## Architecture

```
┌─────────────────────────────────────────────┐
│                   FRONTEND                  │
│  Next.js 16 (App Router)   · Port 3000      │
│                                             │
│  /            — Main Dashboard              │
│  /login       — Authentication              │
│  /signup      — Registration + OTP verify   │
│  /settings    — Control Center              │
│  /forgot-password — Reset flow              │
└────────────────┬────────────────────────────┘
                 │  REST + SSE
┌────────────────▼────────────────────────────┐
│                   BACKEND                   │
│  FastAPI + Uvicorn           · Port 8000    │
│                                             │
│  Ingestion Pipeline:                        │
│    File/YT → Deepgram → Chunks → VoyageAI  │
│            → Pinecone Upsert               │
│                                             │
│  RAG Pipeline:                              │
│    Query → VoyageAI embed → Pinecone search │
│          → Gemini Flash → SSE stream        │
│                                             │
│  Storage:                                   │
│    SQLite  — users, sessions, chat history  │
│    Pinecone — vector embeddings             │
└─────────────────────────────────────────────┘
```

---

## Features

### 🎓 Study Workspace
- **YouTube & File Ingest** — Paste any YouTube URL or upload MP3/MP4/WAV
- **Real-time Pipeline Status** — Live progress bar: Transcribing → Embedding → Ready
- **AI Chat Tutor** — Ask anything about the lecture; answers include `[TIMESTAMP:Xs]` citations
- **Session Persistence** — URL-based sessions (`/?session=<id>`); refresh without losing context
- **Session History** — All past sessions listed in a sidebar, instantly reloadable

### 📚 Study Tools Panel
| Tool | Description |
|---|---|
| **Notes** | AI-structured Markdown notes with H1/H2/H3 hierarchy, downloadable as a styled PDF |
| **Flashcards** | Front/Back flip cards generated from key concepts |
| **Quiz** | Multi-choice questions with A/B/C/D cards, progress bar, live accuracy tracking, and "Expert Explanation" on submit |
| **Mock Test** | Timed exam with multiple-choice and short-answer sections |

### 🔐 Authentication
- Email/Password registration with **OTP email verification**
- **Google OAuth 2.0** single-sign-on
- JWT-based session management
- Forgot/Reset password flow

### ⚙️ Settings Control Center
A full-page settings dashboard at `/settings` with:
- **Account** — Profile info, email, subscription plan
- **Security** — MFA toggle, active sessions, account deletion
- **Study Preferences** — AI depth (Concise / Balanced / In-depth), note format, auto-generate toggles
- **Integrations** — Notion, Obsidian, Discord webhook support

### 📄 PDF Export
Fully client-side PDF generation (via jsPDF) with:
- Dark branded header with accent bar
- Automatic heading hierarchy (H1 → H2 → H3)
- Proper bullet points and numbered lists
- Per-page footer with Athex branding and page count
- No backend round-trip — instant download

---

## Project Structure

```
axion/
├── app/                        # Next.js frontend
│   ├── app/
│   │   ├── page.tsx            # Main dashboard (sessions, chat, tools)
│   │   ├── login/page.tsx      # Login page
│   │   ├── signup/page.tsx     # Signup + OTP verification
│   │   ├── settings/page.tsx   # Settings Control Center
│   │   ├── forgot-password/    # Password reset flow
│   │   ├── globals.css         # Aurora design system (CSS variables, glassmorphic)
│   │   ├── lib/
│   │   │   └── api.ts          # ✅ Centralized API config (single source of truth)
│   │   └── components/
│   │       └── StudyTools/
│   │           ├── NotesViewer.tsx     # Notes + PDF export
│   │           ├── QuizEngine.tsx      # Interactive quiz
│   │           ├── FlashcardDeck.tsx   # Flip cards
│   │           └── MockTest.tsx        # Mock exam
│   ├── .env.local              # NEXT_PUBLIC_API_URL config
│   └── tsconfig.json           # @/ path alias → ./app/*
│
└── backend/                    # FastAPI backend
    ├── main.py                 # App entry point, CORS, lifespan
    ├── api/
    │   ├── routes.py           # All /api/v1/* endpoints
    │   ├── auth.py             # Auth routes (/api/v1/auth/*)
    │   └── dependencies.py     # get_current_user JWT dependency
    ├── services/
    │   ├── transcription.py    # Deepgram transcription + chunking
    │   ├── vector_store.py     # Pinecone embed/upsert/search
    │   ├── llm_stream.py       # Gemini streaming chat + summary
    │   ├── llm_structured.py   # Gemini structured content (notes/quiz/cards)
    │   ├── youtube.py          # YouTube transcript extraction
    │   └── yt_dlp_service.py   # yt-dlp audio download
    ├── core/
    │   ├── config.py           # Pydantic settings
    │   └── database.py         # SQLite + Pinecone init
    ├── models/schemas.py       # Pydantic request/response models
    └── requirements.txt
```

---

## API Reference

### Authentication — `/api/v1/auth/`

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/register` | Register with email + password |
| `POST` | `/auth/verify` | Verify OTP from email |
| `POST` | `/auth/login` | Login, returns JWT |
| `POST` | `/auth/forgot-password` | Request reset OTP |
| `POST` | `/auth/reset-password` | Reset with OTP |
| `GET` | `/auth/google/login` | Initiate Google OAuth |
| `GET` | `/auth/google/callback` | OAuth callback, returns JWT |

### Core — `/api/v1/`

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/ingest` | Upload audio/video file for RAG ingestion |
| `POST` | `/ingest/youtube` | Ingest from YouTube URL |
| `GET` | `/status/{video_id}` | Poll pipeline progress |
| `GET` | `/projects` | List user's sessions |
| `GET` | `/summary` | Generate topic/5-min summary |
| `POST` | `/chat/stream` | SSE streaming AI chat |
| `GET` | `/chat/history` | Fetch message history |
| `POST` | `/chat/message` | Save a message |
| `GET` | `/study-material` | Generate notes / quiz / flashcards / mock test |
| `GET` | `/export/pdf` | Backend PDF export (fallback) |
| `GET` | `/health` | Liveness probe |

---

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.12+
- API keys for: Deepgram, VoyageAI, Pinecone, Google Gemini, Google OAuth

---

### 1. Clone the Repository

```bash
git clone https://github.com/LAB-009-Tit-Srijan-2026/LAB-009-MINDBOT.git
cd LAB-009-MINDBOT
```

---

### 2. Backend Setup

```bash
cd backend
```

**Install dependencies:**
```bash
pip install -r requirements.txt
```

**Configure environment:**
```bash
cp .env.example .env
```

Edit `.env` with your keys:
```env
DEEPGRAM_API_KEY=your_deepgram_key
VOYAGE_API_KEY=your_voyage_key
PINECONE_API_KEY=your_pinecone_key
PINECONE_INDEX_NAME=axion
GEMINI_API_KEY=your_gemini_key
JWT_SECRET=your_long_random_secret
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
```

**Start the server:**
```bash
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The backend API will be live at `http://localhost:8000`.  
Swagger docs available at `http://localhost:8000/docs`.

---

### 3. Frontend Setup

```bash
cd ../app
npm install
```

**Configure environment:**
```bash
# .env.local is already pre-configured for local dev
# To point to a different backend, edit:
echo "NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1" > .env.local
```

**Start the dev server:**
```bash
npm run dev
```

The app will be live at `http://localhost:3000`.

---

### 4. Pinecone Index Setup

Create a Pinecone index with:
- **Dimensions:** `512` (for VoyageAI `voyage-3-lite`)
- **Metric:** `cosine`
- **Index Name:** matches `PINECONE_INDEX_NAME` in your `.env`

---

## Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `DEEPGRAM_API_KEY` | ✅ | Audio transcription |
| `VOYAGE_API_KEY` | ✅ | Text embedding |
| `PINECONE_API_KEY` | ✅ | Vector database |
| `PINECONE_INDEX_NAME` | ✅ | Name of your Pinecone index |
| `GEMINI_API_KEY` | ✅ | LLM for chat + content generation |
| `JWT_SECRET` | ✅ | Secret for signing JWT tokens |
| `GOOGLE_CLIENT_ID` | ⚠️ | Required for Google OAuth |
| `GOOGLE_CLIENT_SECRET` | ⚠️ | Required for Google OAuth |

### Frontend (`app/.env.local`)

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000/api/v1` | Backend API base URL |

> **💡 Tip:** To deploy to production, change only `NEXT_PUBLIC_API_URL` and add your domain to `ALLOWED_ORIGINS` in `backend/main.py`.

---

## Deployment

### Frontend → Vercel
```bash
cd app
vercel deploy
```
Set `NEXT_PUBLIC_API_URL` to your production backend URL in the Vercel dashboard.

### Backend → Railway / Render / DigitalOcean
```bash
# Start command:
uvicorn main:app --host 0.0.0.0 --port $PORT
```
Add your production frontend URL to `ALLOWED_ORIGINS` in `backend/main.py`:
```python
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "https://your-app.vercel.app",  # ← add this
]
```

---

## Contributing

1. Fork the repo
2. Create your branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## License

MIT © 2026 Athex Team — LAB-009-Tit-Srijan

---

<div align="center">
  <sub>Built with ❤️ for the LAB-009 Hackathon 2026</sub>
</div>
