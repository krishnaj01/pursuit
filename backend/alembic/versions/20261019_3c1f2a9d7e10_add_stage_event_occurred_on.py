"""add occurred_on to stage events

Revision ID: 3c1f2a9d7e10
Revises: fadd16f0dd4e
Create Date: 2026-10-19 16:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "3c1f2a9d7e10"
down_revision: str | Sequence[str] | None = "fadd16f0dd4e"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("stage_events", sa.Column("occurred_on", sa.Date(), nullable=True))

    # Backfill: the initial "applied" entry happened on the application date,
    # later entries on the day they were logged.
    as_date = "date(created_at)" if op.get_bind().dialect.name == "sqlite" else "created_at::date"
    op.execute(f"UPDATE stage_events SET occurred_on = {as_date}")
    op.execute(
        """
        UPDATE stage_events SET occurred_on = (
            SELECT applications.applied_on FROM applications
            WHERE applications.id = stage_events.application_id
        )
        WHERE from_stage IS NULL
        """
    )

    with op.batch_alter_table("stage_events") as batch_op:
        batch_op.alter_column("occurred_on", existing_type=sa.Date(), nullable=False)


def downgrade() -> None:
    with op.batch_alter_table("stage_events") as batch_op:
        batch_op.drop_column("occurred_on")
