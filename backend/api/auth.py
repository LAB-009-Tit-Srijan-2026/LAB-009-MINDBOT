import uuid
import random
import datetime
import logging
import jwt
import bcrypt
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr
from email.message import EmailMessage
import aiosmtplib

from core.database import get_db
from core.config import get_settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


# ── Schemas ──
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str

class VerifyRequest(BaseModel):
    email: EmailStr
    otp: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

# ── Helpers ──
def get_password_hash(password: str) -> str:
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(pwd_bytes, salt)
    return hashed_password.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    password_byte_enc = plain_password.encode('utf-8')
    hashed_password_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password_byte_enc, hashed_password_bytes)

def create_access_token(data: dict, expires_delta: datetime.timedelta = datetime.timedelta(hours=24)):
    to_encode = data.copy()
    expire = datetime.datetime.now(datetime.timezone.utc) + expires_delta
    to_encode.update({"exp": expire})
    settings = get_settings()
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm="HS256")
    return encoded_jwt

async def send_otp_email(email: str, otp: str):
    settings = get_settings()
    
    msg = EmailMessage()
    msg.set_content(f"Your verification code is: {otp}\nThis code expires in 10 minutes.")
    msg["Subject"] = "Axion Verification Code"
    msg["From"] = settings.SMTP_USERNAME
    msg["To"] = email

    logger.info(f"Generated OTP for {email}: {otp}")

    # Fallback to just logging if dummy credentials are provided
    if settings.SMTP_USERNAME == "your_email@gmail.com":
        logger.warning(f"SMTP not configured. Skipping actual email send. OTP is {otp}")
        return

    try:
        await aiosmtplib.send(
            msg,
            hostname=settings.SMTP_SERVER,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USERNAME,
            password=settings.SMTP_PASSWORD,
            use_tls=True if settings.SMTP_PORT == 465 else False,
            start_tls=True if settings.SMTP_PORT == 587 else False,
        )
        logger.info(f"OTP email sent to {email}")
    except Exception as e:
        logger.error(f"Failed to send email to {email}: {e}")
        raise HTTPException(status_code=500, detail="Failed to send verification email.")

# ── Routes ──
@router.post("/register")
async def register_user(request: RegisterRequest, db=Depends(get_db)):
    try:
        # Check if user exists
        async with db.execute("SELECT id, is_verified FROM users WHERE email = ?", (request.email,)) as cursor:
            user = await cursor.fetchone()
            if user:
                if user[1]:
                    raise HTTPException(status_code=400, detail="User already exists and is verified.")
                # If exists but not verified, we'll just overwrite their OTP below.
            else:
                # Create new user
                user_id = str(uuid.uuid4())
                hashed_pw = get_password_hash(request.password)
                await db.execute(
                    "INSERT INTO users (id, email, hashed_password) VALUES (?, ?, ?)",
                    (user_id, request.email, hashed_pw)
                )

        # Generate OTP
        otp_code = str(random.randint(100000, 999999))
        expires_at = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=10)
        
        # Store OTP
        await db.execute(
            "INSERT INTO otps (email, otp_code, expires_at) VALUES (?, ?, ?) "
            "ON CONFLICT(email) DO UPDATE SET otp_code=excluded.otp_code, expires_at=excluded.expires_at",
            (request.email, otp_code, expires_at)
        )
        await db.commit()

        # Send Email
        await send_otp_email(request.email, otp_code)

        return {"message": "Verification code sent to email."}
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Registration error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/verify")
async def verify_otp(request: VerifyRequest, db=Depends(get_db)):
    try:
        async with db.execute("SELECT otp_code, expires_at FROM otps WHERE email = ?", (request.email,)) as cursor:
            row = await cursor.fetchone()
            if not row:
                raise HTTPException(status_code=400, detail="No OTP requested for this email.")
            
            stored_otp, expires_at = row
            # Convert string to datetime
            expires_at_dt = datetime.datetime.fromisoformat(expires_at)
            
            if datetime.datetime.now(datetime.timezone.utc) > expires_at_dt:
                raise HTTPException(status_code=400, detail="OTP has expired.")
            
            if request.otp != stored_otp:
                raise HTTPException(status_code=400, detail="Invalid OTP.")

        # Update user
        await db.execute("UPDATE users SET is_verified = TRUE WHERE email = ?", (request.email,))
        await db.execute("DELETE FROM otps WHERE email = ?", (request.email,))
        await db.commit()

        return {"message": "Account verified successfully. You can now log in."}
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/login")
async def login(request: LoginRequest, db=Depends(get_db)):
    async with db.execute("SELECT id, hashed_password, is_verified FROM users WHERE email = ?", (request.email,)) as cursor:
        user = await cursor.fetchone()
        
        if not user:
            raise HTTPException(status_code=401, detail="Invalid email or password.")
        
        user_id, hashed_password, is_verified = user
        
        if not is_verified:
            raise HTTPException(status_code=403, detail="Account not verified. Please verify your email first.")
            
        if not verify_password(request.password, hashed_password):
            raise HTTPException(status_code=401, detail="Invalid email or password.")
            
        # Create token
        access_token = create_access_token(data={"sub": user_id, "email": request.email})
        return {"access_token": access_token, "token_type": "bearer", "user": {"id": user_id, "email": request.email}}
