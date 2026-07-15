from fastapi import FastAPI
from auth import router as auth_router
from links import router as links_router


def create_app() -> FastAPI:
    app = FastAPI(title="Leadwa API")

    # Health check
    @app.get("/healthz")
    def healthz():
        return {"ok": True}

    # Routers
    app.include_router(auth_router)
    app.include_router(links_router)

    return app
