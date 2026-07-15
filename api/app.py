from fastapi import FastAPI
from auth import router as auth_router


def create_app() -> FastAPI:
    app = FastAPI(title="Leadwa API")

    # Health check
    @app.get("/healthz")
    def healthz():
        return {"ok": True}

    # Auth endpoints
    app.include_router(auth_router)

    return app
