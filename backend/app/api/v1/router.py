from fastapi import APIRouter

from app.api.v1 import applications, auth, logos, notifications, stats

api_router = APIRouter()
for module in (auth, applications, notifications, stats, logos):
    api_router.include_router(module.router)
