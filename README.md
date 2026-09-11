# AIVOA - Pharmaceutical QMS AI Copilot & Complaint Management System

> **Enterprise-grade Quality Management System (QMS) powered by LangGraph, Groq Gemma2-9b-it, FastAPI, React 18, and Redux Toolkit.**

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?style=flat&logo=FastAPI&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.x-61DAFB.svg?style=flat&logo=react&logoColor=black)](https://reactjs.org)
[![Redux Toolkit](https://img.shields.io/badge/Redux_Toolkit-2.x-764ABC.svg?style=flat&logo=redux&logoColor=white)](https://redux-toolkit.js.org)
[![LangGraph](https://img.shields.io/badge/LangGraph-StateGraph_DAG-FF6F00.svg?style=flat)](https://github.com/langchain-ai/langgraph)
[![Groq](https://img.shields.io/badge/Groq_API-Gemma2_9b_it-F05032.svg?style=flat)](https://groq.com)
[![Docker](https://img.shields.io/badge/Docker_Ready-Compose-2496ED.svg?style=flat&logo=docker&logoColor=white)](https://docker.com)
[![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.0+-D71F00.svg?style=flat&logo=sqlalchemy&logoColor=white)](https://www.sqlalchemy.org)

---

## 🌟 Executive Overview

**AIVOA** is an enterprise Pharmaceutical Quality Assurance (QA) and Quality Management System (QMS) platform designed to automate the intake, structuring, validation, risk scoring, and CAPA planning of pharmaceutical product complaints across API & FDF (Finished Dosage Form) manufacturing sites.

### Key Capabilities
- **Multi-Modal Document Intake**: Accepts raw text prompts, PDF attachments, EML email files, and image OCR input.
- **LangGraph Multi-Step DAG Workflow**: Statefully orchestrates extraction, relevance gating, completeness validation, duplicate detection, ICH Q9 risk assessment, and CAPA recommendations.
- **Groq LLM Acceleration**: Powered by Groq `gemma2-9b-it` (with `llama-3.3-70b-versatile` fallback) for ultra-fast structured JSON responses.
- **Strict Relevance Gating**: Automatically rejects non-pharmaceutical documents (e.g. resumes, IT manuals) with clear feedback, preventing hallucinations.
- **Auto-Populated & Editable Form**: Extracted complaint data automatically populates the QMS "Log Customer Complaint" form, while remaining 100% editable by QA specialists.
- **AI Copilot Risk Assessment**: Evaluates risk level (`High`, `Medium`, `Low`), severity (`Critical`, `Major`, `Minor`), rationale, potential batch impact, root causes (5-Why/Ishikawa), and CAPA plans.
- **Duplicate Complaint Detection**: Automatically queries database history to flag duplicate complaints matching identical batch numbers or products.
- **Executive QMS Dashboard**: Visualizes risk distribution, active investigation lifecycles, and quality metrics.

---

## 🚀 Quick Start (Under 2 Minutes)

You can run the entire system using **Docker Compose** or directly via **Standard Local Scripts**.

### Method 1: Docker Compose (Recommended)

Requires only [Docker Desktop](https://www.docker.com/products/docker-desktop/):

```bash
# 1. Clone repository
git clone https://github.com/your-username/aivoa.git
cd aivoa

# 2. Start all services (Backend + Frontend)
docker compose up --build
```
- **Web App**: [http://localhost:3000](http://localhost:3000)
- **FastAPI Interactive Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

### Method 2: One-Click Local Run

#### On Windows:
```cmd
# Double click or run:
run-dev.bat
```

#### On Mac / Linux:
```bash
chmod +x run-dev.sh
./run-dev.sh
```

---

### Method 3: Manual Step-by-Step Setup

#### 1. Backend Setup
```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# Mac / Linux
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env

# Start Backend
python main.py
```
> Backend runs at `http://localhost:8000`

#### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
> Frontend runs at `http://localhost:5173`

---

## 💾 Database Configuration

The application features a **smart zero-configuration database architecture**:
- **Default (Zero Setup Needed)**: Runs out-of-the-box on an optimized local **SQLite** database (`aivoa_qms.db`) with Write-Ahead Logging (WAL).
- **Cloud / Production (PostgreSQL / MySQL)**: Connect any cloud PostgreSQL (e.g., Supabase, Neon.tech, AWS RDS) by setting `DATABASE_URL` in `backend/.env`:
  ```env
  DATABASE_URL=postgresql://user:password@host:5432/dbname
  ```
- **Automatic Fallback**: If remote database credentials are not present, the backend seamlessly defaults to local SQLite without crashing, ensuring an effortless evaluation experience for reviewers.

---

## 🔄 LangGraph AI Workflow Architecture

The backend AI engine uses **LangGraph** to execute a stateful, multi-step Directed Acyclic Graph (DAG):

```
[START]
   ↓
1. Input Processing Node (Cleans text & metadata)
   ↓
2. Relevance Gating & Extraction Node (Groq gemma2-9b-it parses pharma fields)
   ↓
3. Completeness Validation Node (Calculates confidence & missing fields)
   ↓
4. Duplicate Complaint Detection Node (Scans DB history for batch/product matches)
   ↓
5. Risk & Severity Assessment Node (ICH Q9 QRM Risk Scoring)
   ↓
6. Root Cause & CAPA Recommendation Node (Generates QMS containment & preventive actions)
   ↓
7. Structured Final Output Node
   ↓
[END]
```

---

## 🧪 Sample Cases to Test in UI

Use the **"✨ Sample Cases"** button in the AIVOA Copilot or test these prompts:

### Case 1: High Risk Sterile Vial Contamination
```text
Customer: Apollo Specialty Hospital
Product: Meropenem for Injection 1g
Batch: MRP202609A
MFG: 2026-06-01 | EXP: 2028-05-31
Qty: 15 vials
Description: Dark particulate matter observed floating inside intact sterile vial upon reconstitution.
```

### Case 2: Broken Tamper Seal & Discoloration
```text
Customer: Max Healthcare Pharmacy
Product: Amoxicillin Capsules 500mg
Batch: AMX240602
Qty: 12 bottles
Description: Tamper-evident seals broken on outer bottles with yellowish discoloration of powder.
```

### Case 3: Irrelevant Document Rejection Test
```text
John Doe - Full Stack Developer Resume
Skills: React, Node.js, Python, Docker
Experience: 3 years building web applications
```
> *Result: AI correctly flags document as non-complaint, preserves empty form, and provides clear user notification.*

---

## 🛠️ Technology Stack Breakdown

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 18, Vite | High performance single-page application |
| **State Management** | Redux Toolkit | Centralized state, thunks, and persistent store |
| **Icons & Design** | Lucide React, Glassmorphism CSS | Clean, enterprise pharma QMS aesthetic |
| **Backend** | Python 3.11+, FastAPI | High concurrency REST API with async endpoints |
| **AI Orchestration** | LangGraph | Stateful Directed Acyclic Graph (DAG) pipeline |
| **LLM Engine** | Groq API (Gemma2-9b-it) | Sub-second structured JSON inference |
| **Database** | SQLAlchemy 2.0 | Multi-database ORM (PostgreSQL, MySQL, SQLite) |
| **Containerization** | Docker & Docker Compose | Multi-container reproducible production deployment |

---

## 📜 API Documentation

Interactive OpenAPI / Swagger documentation is available out of the box at:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc UI**: `http://localhost:8000/redoc`

---

## 📄 License
This project is open-source under the MIT License.
