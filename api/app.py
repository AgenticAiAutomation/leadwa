from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from auth import router as auth_router
from links import router as links_router
from events import router as events_router
from stats import router as stats_router


def create_app() -> FastAPI:
    app = FastAPI(title="Leadwa API")

    # CORS for local development
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Health check
    @app.get("/healthz")
    def healthz():
        return {"ok": True}

    # Routers
    app.include_router(auth_router)
    app.include_router(links_router)
    app.include_router(events_router)
    app.include_router(stats_router)

    return app
