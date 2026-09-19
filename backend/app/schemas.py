import re
from typing import Literal

from pydantic import BaseModel, EmailStr, Field, field_validator

SERVICE_TYPES = Literal[
    "ownership_verification", "land_record_request", "encumbrance_certificate",
    "land_use_information", "building_permission_status",
]
REQUEST_STATUSES = Literal["submitted", "under_review", "department_verification", "completed", "rejected"]


class RegisterIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    phone: str | None = Field(default=None, max_length=15)
    password: str = Field(min_length=8, max_length=72)

    @field_validator("password")
    @classmethod
    def strong(cls, v: str) -> str:
        if not (re.search(r"[A-Za-z]", v) and re.search(r"\d", v)):
            raise ValueError("Password must contain letters and numbers")
        return v

    @field_validator("phone")
    @classmethod
    def phone_digits(cls, v: str | None) -> str | None:
        if v and not re.fullmatch(r"[0-9+\- ]{7,15}", v):
            raise ValueError("Invalid phone number")
        return v or None


class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=72)


class ProfileIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    phone: str | None = Field(default=None, max_length=15)


class PasswordIn(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=72)


class ServiceRequestIn(BaseModel):
    parcel_id: str = Field(pattern=r"^P-\d{3,6}$")
    service_type: SERVICE_TYPES
    purpose: str = Field(min_length=5, max_length=500)


class StatusUpdateIn(BaseModel):
    status: REQUEST_STATUSES
    remarks: str | None = Field(default=None, max_length=500)


class VerifyParcelIn(BaseModel):
    status: Literal["verified", "pending", "flagged"]
    remarks: str | None = Field(default=None, max_length=500)


class UserUpdateIn(BaseModel):
    role: Literal["citizen", "officer", "admin"] | None = None
    is_active: bool | None = None


class QueryIn(BaseModel):
    question: str = Field(min_length=2, max_length=300)
