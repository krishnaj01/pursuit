from fastapi import APIRouter

from app.api.v1 import account, applications, auth, extension, logos, notifications, stats

api_router = APIRouter()
for module in (auth, account, extension, applications, notifications, stats, logos):
    api_router.include_router(module.router)
