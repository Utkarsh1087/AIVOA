# AIVOA — AI-Powered Pharmaceutical Quality Assurance (QMS) Copilot

> **An intelligent Quality Management System that automatically extracts, validates, risk-scores, and generates CAPA plans for pharmaceutical product complaints.**

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React_18-61DAFB.svg?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org)
[![Redux Toolkit](https://img.shields.io/badge/State-Redux_Toolkit-764ABC.svg?style=for-the-badge&logo=redux&logoColor=white)](https://redux-toolkit.js.org)
[![LangGraph](https://img.shields.io/badge/AI_Engine-LangGraph_DAG-FF6F00.svg?style=for-the-badge)](https://github.com/langchain-ai/langgraph)
[![Groq](https://img.shields.io/badge/LLM-Groq_Gemma2_9b-F05032.svg?style=for-the-badge)](https://groq.com)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com)
[![Supabase](https://img.shields.io/badge/Database-PostgreSQL_%2F_SQLite-3ECF8E.svg?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)

---

## 📌 What is AIVOA? (In Simple Words)

When pharmaceutical companies receive customer complaints (e.g., broken tablet blister packs, contaminated vials, or leaking bottles), QA teams have to read unstructured emails/PDFs and manually enter them into complex QMS forms.

**AIVOA solves this:**
1. **Drop any file or text** (Email, PDF report, or message) into the AI Copilot.
2. **AI automatically parses the details** (Customer, Product, Batch #, Dates, NPM material, and Defect summary) and fills out the official QMS Form.
3. **AI calculates ICH Q9 Risk & CAPA** (Evaluates Severity, Risk Level, Root Causes, and Immediate Containment Actions).
4. **Human in the Loop**: The QA specialist can review, edit any field in real time, and save directly to the database.
5. **Relevance Protection**: Irrelevant documents (e.g. resumes, software manuals) are automatically rejected to prevent hallucinations.

---

## ⚡ How to Run the Project (Choose Any Option)

### 🥇 Option 1: The Easiest Way (One-Click Script)

#### On Windows:
Double-click `run-dev.bat` or run in terminal:
```cmd
run-dev.bat
```

#### On Mac / Linux:
```bash
chmod +x run-dev.sh
./run-dev.sh
```
> *This automatically starts both the FastAPI backend and the React frontend in parallel!*

---

### 🐳 Option 2: Run with Docker Compose (Zero Setup)

If you have [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed:

```bash
docker compose up --build
```
- **Frontend App**: [http://localhost:3000](http://localhost:3000)
- **Backend API & Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

### 🛠️ Option 3: Manual Step-by-Step Setup

#### Step 1: Start the Backend (Python FastAPI)
```bash
# 1. Navigate to backend
cd backend

# 2. Create and activate a virtual environment
python -m venv venv

# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Create your .env file
cp .env.example .env

# 5. Start backend server
python main.py
```
> Backend runs at: **`http://localhost:8000`**  
> Interactive API Documentation: **`http://localhost:8000/docs`**

#### Step 2: Start the Frontend (React + Vite)
Open a new terminal window:
```bash
# 1. Navigate to frontend
cd frontend

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```
> Frontend runs at: **`http://localhost:5173`**

---

## 💾 Database Options (Zero Configuration)

AIVOA has a **smart dual-database system**:

| Mode | Configuration | Description |
| :--- | :--- | :--- |
| **Local SQLite (Default)** | **Zero setup required** | Creates `aivoa_qms.db` automatically with Write-Ahead Logging (WAL). |
| **Cloud PostgreSQL** | Set `DATABASE_URL` in `.env` | Connects directly to **Supabase**, **Neon.tech**, or any PostgreSQL host. |
| **Automatic Fallback** | Built-in safety | If remote database credentials are not present, the app seamlessly defaults to local SQLite without crashing. |

---

## 🧠 How the AI Engine Works (LangGraph Workflow)

The backend uses a stateful **LangGraph Directed Acyclic Graph (DAG)** pipeline:

```
[Start Input: Text / PDF / Email]
               ↓
    1. Input Processing Node
       (Cleans metadata & raw text)
               ↓
    2. Relevance Gating & Extraction Node
       (Groq Gemma2-9b-it parses fields; rejects non-pharma docs)
               ↓
    3. Completeness Validation Node
       (Calculates QA confidence score & flags missing data)
               ↓
    4. Duplicate Check Node
       (Scans database history for matching batch numbers)
               ↓
    5. ICH Q9 Risk Assessment Node
       (Scores Severity: Critical/Major/Minor & Risk: High/Med/Low)
               ↓
    6. CAPA & Root Cause Node
       (Suggests 5-Why root causes & preventive actions)
               ↓
    7. Final Structured Output Node
               ↓
[Auto-populates QMS Form & Updates UI]
```

---

## 🎯 Sample Test Cases to Try in the UI

You can click the **"✨ Sample Cases"** button inside the AIVOA Copilot in the app, or copy-paste these test scenarios:

### Test Case 1: High Risk — Contaminated Sterile Vial
```text
Customer: Apollo Specialty Hospital
Product: Meropenem for Injection 1g
Batch: MRP202609A
MFG Date: 2026-06-01 | EXP Date: 2028-05-31
Affected Quantity: 15 vials
Description: Dark particulate matter observed floating inside intact sterile vial upon reconstitution.
```
> **Expected AI Result:** High Risk / Critical Severity. Immediate batch quarantine, retention sample inspection, and line filter audit recommended.

---

### Test Case 2: Major Risk — Broken Seals & Discoloration
```text
Customer: Max Healthcare Pharmacy
Product: Amoxicillin Capsules 500mg
Batch: AMX240602
Affected Quantity: 12 bottles
Description: Tamper-evident seals broken on outer bottles with yellowish discoloration of powder.
```
> **Expected AI Result:** Medium/High Risk. Container closure integrity review and packaging torque verification recommended.

---

### Test Case 3: Negative Test — Irrelevant Document Rejection
```text
John Doe - Full Stack Developer Resume
Experience: 3 years building web applications with React and Python.
Skills: TypeScript, Docker, PostgreSQL, REST APIs.
```
> **Expected AI Result:** AI safely detects that the document is not a pharmaceutical complaint, leaves the form blank, and alerts the user without generating fake data.

---

## 📁 Project Structure

```text
AIVOA/
├── backend/
│   ├── app/
│   │   ├── ai/                # LangGraph workflow, nodes, prompts & Groq client
│   │   ├── routes/            # FastAPI REST endpoints (/api/complaints)
│   │   ├── utils/             # Multi-modal parsers (PDF, EML, Image OCR)
│   │   ├── config.py          # Environment settings
│   │   ├── database.py        # SQLAlchemy multi-DB connection with SQLite fallback
│   │   ├── models.py          # Database schema (Complaints, CAPA, Risk)
│   │   └── schemas.py         # Pydantic validation schemas
│   ├── Dockerfile             # Backend Docker container definition
│   ├── requirements.txt       # Python dependencies
│   └── main.py                # Application entrypoint
│
├── frontend/
│   ├── src/
│   │   ├── components/        # React UI Components (ComplaintForm, Copilot, Dashboard, List)
│   │   ├── store/             # Redux Toolkit store and async thunks
│   │   ├── services/          # API Axios/Fetch client
│   │   ├── App.jsx            # Main app shell & fixed layout
│   │   └── index.css          # Modern QMS glassmorphic design system
│   ├── Dockerfile             # Frontend multi-stage Docker build
│   ├── nginx.conf             # Production Nginx reverse proxy
│   └── package.json           # Node.js dependencies
│
├── docker-compose.yml         # Full-stack container orchestration
├── run-dev.bat                # Windows 1-click startup
├── run-dev.sh                 # Mac/Linux 1-click startup
├── .env.example               # Environment variables template
├── .gitignore                 # Protected secrets & build artifacts
└── README.md                  # Project documentation
```

---

## ⚙️ Environment Variables Reference

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `GROQ_API_KEY` | *(Get free at console.groq.com)* | Groq Cloud API key for ultra-fast LLM inference. |
| `PRIMARY_LLM` | `gemma2-9b-it` | Primary LLM model for extraction and reasoning. |
| `SECONDARY_LLM` | `llama-3.3-70b-versatile` | Secondary fallback model. |
| `DATABASE_URL` | `sqlite:///./aivoa_qms.db` | Database connection string (SQLite, PostgreSQL, or MySQL). |
| `PORT` | `8000` | Backend API server port. |
| `ALLOWED_ORIGINS`| `http://localhost:5173,http://localhost:3000` | CORS permitted origins. |

## ✍️ A Personal Note from the Developer

Thank you for taking the time to review **AIVOA**! 

This project was built with a strong focus on real-world engineering challenges in pharmaceutical manufacturing—bridging unstructured customer feedback with strict regulatory Quality Management Systems (QMS) and ICH Q9 risk standards.

**Key Design & Engineering Principles behind this build:**
- **Zero-Friction Reliability**: Designed with automatic fallbacks so that any reviewer or team member can clone and run the application immediately without database configuration headaches.
- **Robust AI Guardrails**: Implemented relevance gating and multi-step state management with **LangGraph** to ensure AI stays accurate, reproducible, and free from hallucinations.
- **Human-in-the-Loop Workflow**: Empowering QA specialists by automating data intake while preserving full manual control and real-time form editing.

If you have any feedback, questions, or would like to discuss the technical architecture, feel free to reach out. I hope you enjoy exploring the project! 🚀
