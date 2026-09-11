import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import Base, engine
from app.routes.complaints import router as complaints_router

# Initialize Database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AIVOA - AI-Powered Customer Complaint Management System",
    description="Pharmaceutical QMS AI Copilot powered by LangGraph, Groq Gemma2-9b-it & FastAPI",
    version="1.0.0"
)

# Configure CORS
origins = [origin.strip() for origin in settings.ALLOWED_ORIGINS.split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(complaints_router)

@app.get("/", tags=["Healthcheck"])
def root_healthcheck():
    return {
        "status": "online",
        "system": "AIVOA Pharmaceutical QMS AI Engine",
        "primary_llm": settings.PRIMARY_LLM,
        "database": settings.DATABASE_URL.split(":")[0],
        "groq_configured": bool(settings.GROQ_API_KEY and not settings.GROQ_API_KEY.startswith("gsk_your"))
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=settings.PORT, reload=True)
