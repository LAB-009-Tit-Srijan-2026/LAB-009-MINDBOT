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
import httpx
from fastapi.responses import RedirectResponse

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

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str
    new_password: str

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

async def send_otp_email(email: str, otp: str, is_reset=False):
    settings = get_settings()
    
    msg = EmailMessage()
    subject = "Athex Password Reset Code" if is_reset else "Athex Verification Code"
    msg.set_content(f"Your {'reset' if is_reset else 'verification'} code is: {otp}\nThis code expires in 10 minutes.")
    msg["Subject"] = subject
    msg["From"] = settings.SMTP_USERNAME
    msg["To"] = email

    logger.info(f"Generated OTP for {email}: {otp}")

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
        async with db.execute("SELECT id, is_verified FROM users WHERE email = ?", (request.email,)) as cursor:
            user = await cursor.fetchone()
            if user:
                if user[1]:
                    raise HTTPException(status_code=400, detail="User already exists and is verified.")
            else:
                user_id = str(uuid.uuid4())
                hashed_pw = get_password_hash(request.password)
                await db.execute(
                    "INSERT INTO users (id, email, hashed_password) VALUES (?, ?, ?)",
                    (user_id, request.email, hashed_pw)
                )

        otp_code = str(random.randint(100000, 999999))
        expires_at = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=10)
        
        await db.execute(
            "INSERT INTO otps (email, otp_code, expires_at) VALUES (?, ?, ?) "
            "ON CONFLICT(email) DO UPDATE SET otp_code=excluded.otp_code, expires_at=excluded.expires_at",
            (request.email, otp_code, expires_at)
        )
        await db.commit()

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
            expires_at_dt = datetime.datetime.fromisoformat(expires_at)
            
            if datetime.datetime.now(datetime.timezone.utc) > expires_at_dt:
                raise HTTPException(status_code=400, detail="OTP has expired.")
            
            if request.otp != stored_otp:
                raise HTTPException(status_code=400, detail="Invalid OTP.")

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
            
        access_token = create_access_token(data={"sub": user_id, "email": request.email})
        return {"access_token": access_token, "token_type": "bearer", "user": {"id": user_id, "email": request.email}}

@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest, db=Depends(get_db)):
    try:
        async with db.execute("SELECT id, is_verified FROM users WHERE email = ?", (request.email,)) as cursor:
            user = await cursor.fetchone()
            if not user or not user[1]:
                # We return a success message anyway for security reasons (avoiding user enumeration)
                # But we only actually send an email if the user exists and is verified.
                return {"message": "If that email is registered, a password reset code has been sent."}
        
        otp_code = str(random.randint(100000, 999999))
        expires_at = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=10)
        
        await db.execute(
            "INSERT INTO otps (email, otp_code, expires_at) VALUES (?, ?, ?) "
            "ON CONFLICT(email) DO UPDATE SET otp_code=excluded.otp_code, expires_at=excluded.expires_at",
            (request.email, otp_code, expires_at)
        )
        await db.commit()

        await send_otp_email(request.email, otp_code, is_reset=True)
        return {"message": "If that email is registered, a password reset code has been sent."}
    except Exception as e:
        logger.error(f"Forgot password error: {e}")
        return {"message": "If that email is registered, a password reset code has been sent."}

@router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest, db=Depends(get_db)):
    try:
        async with db.execute("SELECT otp_code, expires_at FROM otps WHERE email = ?", (request.email,)) as cursor:
            row = await cursor.fetchone()
            if not row:
                raise HTTPException(status_code=400, detail="No reset requested for this email.")
            
            stored_otp, expires_at = row
            expires_at_dt = datetime.datetime.fromisoformat(expires_at)
            
            if datetime.datetime.now(datetime.timezone.utc) > expires_at_dt:
                raise HTTPException(status_code=400, detail="Reset code has expired.")
            
            if request.otp != stored_otp:
                raise HTTPException(status_code=400, detail="Invalid reset code.")

        hashed_pw = get_password_hash(request.new_password)
        await db.execute("UPDATE users SET hashed_password = ? WHERE email = ?", (hashed_pw, request.email))
        await db.execute("DELETE FROM otps WHERE email = ?", (request.email,))
        await db.commit()

        return {"message": "Password reset successfully. You can now log in."}
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Reset password error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/google/login")
async def google_login():
    settings = get_settings()
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=500, detail="Google OAuth not configured on server.")
    
    url = (
        "https://accounts.google.com/o/oauth2/v2/auth"
        f"?client_id={settings.GOOGLE_CLIENT_ID}"
        f"&redirect_uri={settings.GOOGLE_REDIRECT_URI}"
        "&response_type=code"
        "&scope=openid%20email%20profile"
        "&access_type=offline"
        "&prompt=consent"
    )
    return RedirectResponse(url)

@router.get("/google/callback")
async def google_callback(code: str, db=Depends(get_db)):
    settings = get_settings()
    
    # 1. Exchange code for tokens
    async with httpx.AsyncClient() as client:
        token_res = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            },
        )
        token_data = token_res.json()
        if "error" in token_data:
            logger.error(f"Google token error: {token_data}")
            return RedirectResponse("http://localhost:3000/login?error=google_auth_failed")

        # 2. Get user info
        user_info_res = await client.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {token_data['access_token']}"},
        )
        user_info = user_info_res.json()
        email = user_info.get("email")
        if not email:
            return RedirectResponse("http://localhost:3000/login?error=email_not_provided")

    # 3. Check/Create user
    async with db.execute("SELECT id FROM users WHERE email = ?", (email,)) as cursor:
        user = await cursor.fetchone()
        if not user:
            user_id = str(uuid.uuid4())
            # Google users are auto-verified
            await db.execute(
                "INSERT INTO users (id, email, is_verified) VALUES (?, ?, ?)",
                (user_id, email, True)
            )
            await db.commit()
        else:
            user_id = user[0]
            # Ensure is_verified is True for Google users
            await db.execute("UPDATE users SET is_verified = TRUE WHERE email = ?", (email,))
            await db.commit()

    # 4. Issue JWT and redirect to frontend with token and email
    access_token = create_access_token(data={"sub": user_id, "email": email})
    return RedirectResponse(f"http://localhost:3000/login?token={access_token}&email={email}")
