from datetime import date

from fastapi import APIRouter, HTTPException, Response, status

from app.core.config import get_settings
from app.core.deps import DbSession, SessionUser
from app.schemas.account import DeleteAccountRequest
from app.services.account import delete_account, export_applications_csv

router = APIRouter(prefix="/account", tags=["account"])


@router.get("/export.csv", response_class=Response)
async def export_csv(db: DbSession, user: SessionUser):
    content = await export_applications_csv(db, user.id)
    filename = f"pursuit-applications-{date.today().isoformat()}.csv"
    return Response(
        # BOM so Excel opens UTF-8 (e.g. non-ASCII company names) correctly.
        content="﻿" + content,
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "no-store",
        },
    )


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
async def delete_my_account(
    payload: DeleteAccountRequest, response: Response, db: DbSession, user: SessionUser
) -> None:
    if payload.confirm_email.strip().lower() != user.email.lower():
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_CONTENT, detail="The email doesn't match your account"
        )
    await delete_account(db, user.id)
    response.delete_cookie(get_settings().auth_cookie_name, path="/")
