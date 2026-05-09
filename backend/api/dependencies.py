import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import logging
from core.config import get_settings

logger = logging.getLogger(__name__)
security = HTTPBearer()

class MockUser:
    def __init__(self, user_id: str, email: str):
        self.id = user_id
        self.email = email

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    FastAPI dependency to verify a custom JWT token.
    Returns a user object containing the id and email.
    """
    token = credentials.credentials
    settings = get_settings()
    
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
        user_id: str = payload.get("sub")
        email: str = payload.get("email")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials"
            )
        return MockUser(user_id=user_id, email=email)
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
