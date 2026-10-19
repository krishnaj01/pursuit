from enum import StrEnum


class Stage(StrEnum):
    APPLIED = "applied"
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


class ReminderKind(StrEnum):
    STATUS_CHECK = "status_check"
    EVENT = "event"
