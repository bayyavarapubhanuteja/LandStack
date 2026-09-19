from sqlalchemy.orm import Session

from .models import AuditLog, User


def log(db: Session, actor: User | None, action: str, entity_type: str, entity_id: str, details: str = "") -> None:
    db.add(AuditLog(
        actor_id=actor.id if actor else None,
        actor_email=actor.email if actor else None,
        action=action, entity_type=entity_type, entity_id=str(entity_id), details=details,
    ))
