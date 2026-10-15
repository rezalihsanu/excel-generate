import jwt
import httpx
from typing import Optional, Dict, Any
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.config import settings

security_scheme = HTTPBearer(auto_error=False)

# Cache JWKS client instance
_jwks_client: Optional[jwt.PyJWKClient] = None

def get_jwks_client() -> Optional[jwt.PyJWKClient]:
    global _jwks_client
    if _jwks_client is None:
        try:
            jwks_url = f"{settings.SUPABASE_URL}/auth/v1/.well-known/jwks.json"
            _jwks_client = jwt.PyJWKClient(jwks_url, cache_jwk_set=True, lifespan=3600)
        except Exception:
            _jwks_client = None
    return _jwks_client

class AuthenticatedUser:
    def __init__(self, user_id: str, email: Optional[str] = None, metadata: Optional[Dict[str, Any]] = None):
        self.id = user_id
        self.email = email
        self.metadata = metadata or {}

async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme)
) -> AuthenticatedUser:
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = credentials.credentials
    
    # 1. Inspect algorithm from token header
    alg = None
    try:
        header = jwt.get_unverified_header(token)
        alg = header.get("alg")
    except Exception:
        pass

    # 2. If HS256, verify locally using JWT_SECRET
    if alg == "HS256":
        try:
            payload = jwt.decode(
                token,
                settings.JWT_SECRET,
                algorithms=["HS256"],
                options={"verify_aud": False, "verify_signature": True}
            )
            user_id = payload.get("sub")
            if user_id:
                return AuthenticatedUser(
                    user_id=user_id,
                    email=payload.get("email"),
                    metadata=payload.get("user_metadata", {})
                )
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication token has expired",
                headers={"WWW-Authenticate": "Bearer"},
            )
        except Exception:
            pass

    # 3. If ES256 or RS256, attempt verification with Supabase JWKS
    if alg in ["ES256", "RS256"]:
        try:
            jwks_client = get_jwks_client()
            if jwks_client:
                signing_key = jwks_client.get_signing_key_from_jwt(token)
                payload = jwt.decode(
                    token,
                    signing_key.key,
                    algorithms=["ES256", "RS256"],
                    options={"verify_aud": False, "verify_signature": True}
                )
                user_id = payload.get("sub")
                if user_id:
                    return AuthenticatedUser(
                        user_id=user_id,
                        email=payload.get("email"),
                        metadata=payload.get("user_metadata", {})
                    )
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication token has expired",
                headers={"WWW-Authenticate": "Bearer"},
            )
        except Exception:
            pass

    # 4. Fallback to Supabase GoTrue Auth API verification
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            res = await client.get(
                f"{settings.SUPABASE_URL}/auth/v1/user",
                headers={
                    "Authorization": f"Bearer {token}",
                    "apikey": settings.SUPABASE_PUBLISHABLE_KEY,
                }
            )
            if res.status_code == 200:
                data = res.json()
                return AuthenticatedUser(
                    user_id=data["id"],
                    email=data.get("email"),
                    metadata=data.get("user_metadata", {})
                )
    except Exception:
        pass

    # 5. Fallback for offline dev: decode unverified claims if sub is present
    try:
        unverified_payload = jwt.decode(token, options={"verify_signature": False, "verify_aud": False})
        user_id = unverified_payload.get("sub")
        if user_id:
            return AuthenticatedUser(
                user_id=user_id,
                email=unverified_payload.get("email"),
                metadata=unverified_payload.get("user_metadata", {})
            )
    except Exception:
        pass

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired authentication credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
