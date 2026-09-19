from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import audit
from ..database import get_db
from ..models import User
from ..schemas import LoginIn, PasswordIn, ProfileIn, RegisterIn
from ..security import create_token, get_current_user, hash_password, verify_password
from ..serializers import user_out

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", status_code=201)
def register(body: RegisterIn, db: Session = Depends(get_db)):
    email = body.email.lower()
    if db.scalar(select(User).where(User.email == email)):
        raise HTTPException(status.HTTP_409_CONFLICT, "An account with this email already exists")
    # Public registration always creates citizens; officer/admin roles are granted by an administrator.
    user = User(name=body.name.strip(), email=email, phone=body.phone, password_hash=hash_password(body.password), role="citizen")
    db.add(user)
    db.flush()
    audit.log(db, user, "user.register", "user", str(user.id))
    db.commit()
    return {"token": create_token(user), "user": user_out(user)}


@router.post("/login")
def login(body: LoginIn, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == body.email.lower()))
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password")
    if not user.is_active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "This account has been disabled")
    audit.log(db, user, "user.login", "user", str(user.id))
    db.commit()
    return {"token": create_token(user), "user": user_out(user)}


@router.get("/me")
def me(user: User = Depends(get_current_user)):
    return user_out(user)


@router.patch("/me")
def update_me(body: ProfileIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.merge(user)
    user.name, user.phone = body.name.strip(), body.phone
    audit.log(db, user, "user.profile_update", "user", str(user.id))
    db.commit()
    return user_out(user)


@router.post("/change-password")
def change_password(body: PasswordIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.merge(user)
    if not verify_password(body.current_password, user.password_hash):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Current password is incorrect")
    user.password_hash = hash_password(body.new_password)
    audit.log(db, user, "user.password_change", "user", str(user.id))
    db.commit()
    return {"ok": True}
