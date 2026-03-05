from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import close_mongo_connection, connect_to_mongo
from routers.summary_router import router as summary_router


@asynccontextmanager
async def lifespan(_: FastAPI):
    await connect_to_mongo()
    yield
    await close_mongo_connection()


app = FastAPI(
    title="SmartSummarizer AI API",
    description="Upload documents, extract text, and create structured summaries with Groq.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(summary_router)


@app.get("/", tags=["health"])
async def root() -> dict[str, str]:
    return {"message": "SmartSummarizer AI backend is running."}


@app.get("/health", tags=["health"])
async def health_check() -> dict[str, str]:
    return {"status": "ok"}
