from enum import StrEnum


class Stage(StrEnum):
    APPLIED = "applied"
    AWAITING = "awaiting"  # waiting to hear back from the company
    OA_CLEARED = "oa_cleared"
    ASSIGNMENT = "assignment"
    HACKATHON = "hackathon"
    ROUND_1 = "round_1"
    ROUND_2 = "round_2"
    INTERVIEW = "interview"
    OFFER = "offer"
    REJECTED = "rejected"
    CUSTOM = "custom"


# Finished applications: no reminders, listed under "Closed", sorted last.
CLOSED_STAGES = frozenset({Stage.OFFER, Stage.REJECTED})

# Open stages without an event date, where the user is waiting on the company and
# follow-up reminders apply. Neither counts as a response from the company.
FOLLOW_UP_STAGES = frozenset({Stage.APPLIED, Stage.AWAITING})


class ReminderKind(StrEnum):
    STATUS_CHECK = "status_check"
    EVENT = "event"
