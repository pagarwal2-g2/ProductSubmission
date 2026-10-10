import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from database import engine, Base
from dotenv import load_dotenv

load_dotenv()

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Product Submission Workflow API", version="1.0.0")

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Ensure unhandled 500s still carry CORS headers (Starlette strips them otherwise)."""
    origin = request.headers.get("origin", "")
    headers = {}
    if origin == FRONTEND_URL:
        headers["Access-Control-Allow-Origin"] = FRONTEND_URL
        headers["Access-Control-Allow-Credentials"] = "true"
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
        headers=headers,
    )

from routers import auth, products, vendors  # noqa: E402 – must be after app init

app.include_router(auth.router, tags=["auth"])
app.include_router(products.router, tags=["products"])
app.include_router(vendors.router, tags=["vendors"])


@app.get("/")
def root():
    return {"status": "ok", "message": "Product Submission Workflow API"}
