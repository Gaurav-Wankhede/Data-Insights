from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import data_router, analysis_router
from .utils.file_handlers import start_cleanup_task
import asyncio

app = FastAPI(
    title="Data Analysis API",
    description="API for data analysis and cleaning operations",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(data_router.router, prefix="/api/v1/data", tags=["data"])
app.include_router(analysis_router.router, prefix="/api/v1/analysis", tags=["analysis"])

@app.on_event("startup")
async def startup_event():
    # Start the cleanup task
    asyncio.create_task(start_cleanup_task())

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
