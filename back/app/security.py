from datetime import UTC, datetime, timedelta
import base64
import json
import hashlib
import hmac
import secrets

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.models import Usuario

settings = get_settings()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

PBKDF2_ALGORITHM = "sha256"
PBKDF2_ITERATIONS = 390000
PBKDF2_SALT_BYTES = 16


def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("ascii").rstrip("=")


def _b64url_decode(data: str) -> bytes:
    padded = data + "=" * ((4 - len(data) % 4) % 4)
    return base64.urlsafe_b64decode(padded.encode("ascii"))


def _pbkdf2_hash(password: str, salt: bytes) -> bytes:
    return hashlib.pbkdf2_hmac(
        PBKDF2_ALGORITHM,
        password.encode("utf-8"),
        salt,
        PBKDF2_ITERATIONS,
    )


def verify_password(plain_password: str, hashed_password: str) -> bool:
    if hashed_password.startswith("pbkdf2_sha256$"):
        try:
            _, iterations, salt_b64, digest_b64 = hashed_password.split("$", 3)
            salt = base64.urlsafe_b64decode(salt_b64.encode("ascii"))
            expected_digest = base64.urlsafe_b64decode(digest_b64.encode("ascii"))
            computed_digest = hashlib.pbkdf2_hmac(
                PBKDF2_ALGORITHM,
                plain_password.encode("utf-8"),
                salt,
                int(iterations),
            )
            return hmac.compare_digest(computed_digest, expected_digest)
        except (ValueError, TypeError):
            return False

    return secrets.compare_digest(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    salt = secrets.token_bytes(PBKDF2_SALT_BYTES)
    digest = _pbkdf2_hash(password, salt)
    salt_b64 = base64.urlsafe_b64encode(salt).decode("ascii")
    digest_b64 = base64.urlsafe_b64encode(digest).decode("ascii")
    return f"pbkdf2_sha256${PBKDF2_ITERATIONS}${salt_b64}${digest_b64}"


def create_access_token(subject: str, expires_minutes: int | None = None) -> str:
    expire_delta = timedelta(minutes=expires_minutes or settings.access_token_expire_minutes)
    expire = datetime.now(UTC) + expire_delta

    if settings.jwt_algorithm != "HS256":
        raise ValueError("Solo se soporta HS256")

    header = {"alg": "HS256", "typ": "JWT"}
    payload = {"sub": subject, "exp": int(expire.timestamp())}

    header_b64 = _b64url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    payload_b64 = _b64url_encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    signing_input = f"{header_b64}.{payload_b64}".encode("ascii")
    signature = hmac.new(settings.jwt_secret_key.encode("utf-8"), signing_input, hashlib.sha256).digest()
    signature_b64 = _b64url_encode(signature)

    return f"{header_b64}.{payload_b64}.{signature_b64}"


def _decode_access_token(token: str) -> dict:
    if settings.jwt_algorithm != "HS256":
        raise ValueError("Solo se soporta HS256")

    parts = token.split(".")
    if len(parts) != 3:
        raise ValueError("Token invalido")

    header_b64, payload_b64, signature_b64 = parts
    signing_input = f"{header_b64}.{payload_b64}".encode("ascii")
    expected_signature = hmac.new(settings.jwt_secret_key.encode("utf-8"), signing_input, hashlib.sha256).digest()

    provided_signature = _b64url_decode(signature_b64)
    if not hmac.compare_digest(provided_signature, expected_signature):
        raise ValueError("Firma JWT invalida")

    payload = json.loads(_b64url_decode(payload_b64).decode("utf-8"))
    exp = payload.get("exp")
    if not isinstance(exp, int):
        raise ValueError("Token sin expiracion")

    now_ts = int(datetime.now(UTC).timestamp())
    if now_ts >= exp:
        raise ValueError("Token expirado")

    return payload


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> Usuario:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No autenticado",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = _decode_access_token(token)
        email = payload.get("sub")
        if not isinstance(email, str):
            raise credentials_exception
    except (ValueError, json.JSONDecodeError):
        raise credentials_exception

    stmt = select(Usuario).where(Usuario.email == email)
    user = db.scalars(stmt).first()
    if user is None or not user.activo:
        raise credentials_exception

    return user
