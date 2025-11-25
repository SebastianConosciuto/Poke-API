from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth
app = FastAPI(title="Pokemon Trainer API", version="1.0.0")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)

@app.get("/")
def root():
    return {
        "message": "Pokemon Trainer API",
        "version": "1.0.0",
        "endpoints": {
            "auth": "/auth",
            "docs": "/docs"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
