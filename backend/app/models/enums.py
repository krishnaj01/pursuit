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


class ReminderKind(StrEnum):
    STATUS_CHECK = "status_check"
    EVENT = "event"
