"""treat offers as closed: clear their reminders

Revision ID: 7b2e4d1c9a03
Revises: 3c1f2a9d7e10
Create Date: 2026-10-19 18:00:00.000000

"""

from collections.abc import Sequence

from alembic import op

revision: str = "7b2e4d1c9a03"
down_revision: str | Sequence[str] | None = "3c1f2a9d7e10"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Offers are now closed like rejections: no reminders and no current event date.
    # The offer's date stays recorded on its timeline entry.
    op.execute(
        """
        UPDATE applications
        SET next_reminder_on = NULL, reminder_kind = 'status_check', event_date = NULL
        WHERE stage = 'offer'
        """
    )


def downgrade() -> None:
    # Restore the reminder on the offer's recorded date where one exists.
    op.execute(
        """
        UPDATE applications SET
            event_date = (
                SELECT e.event_date FROM stage_events e
                WHERE e.application_id = applications.id AND e.to_stage = 'offer'
                ORDER BY e.created_at DESC LIMIT 1
            )
        WHERE stage = 'offer'
        """
    )
    op.execute(
        """
        UPDATE applications SET next_reminder_on = event_date, reminder_kind = 'event'
        WHERE stage = 'offer' AND event_date IS NOT NULL
        """
    )
