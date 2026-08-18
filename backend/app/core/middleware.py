import time
from datetime import datetime, timezone
from fastapi import Request, Response, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.models.audit import AuditLog
from jose import jwt, JWTError

# In-memory sliding-window request records for rate limiting
# { ip_address: [timestamp1, timestamp2, ...] }
rate_limit_records = {}

class SecurityMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        client_ip = request.client.host if request.client else "127.0.0.1"
        path = request.url.path
        method = request.method

        # 1. Enforce HTTPS in production
        if settings.APP_ENV == "production" and request.url.scheme == "http":
            secure_url = str(request.url).replace("http://", "https://", 1)
            return Response(
                status_code=status.HTTP_301_MOVED_PERMANENTLY,
                headers={"Location": secure_url}
            )

        # 2. Rate Limiting on Login & OTP send endpoints (Limit to 5 requests per minute)
        if path in ("/api/v1/auth/login", "/api/v1/auth/send-otp"):
            now = time.time()
            if client_ip not in rate_limit_records:
                rate_limit_records[client_ip] = []
            
            # Filter history records within the last 60 seconds
            history = [t for t in rate_limit_records[client_ip] if now - t < 60]
            rate_limit_records[client_ip] = history

            if len(history) >= 5:
                return JSONResponse(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    content={"detail": "Too many requests. Please try again in a minute."}
                )
            
            rate_limit_records[client_ip].append(now)

        # Try resolving user ID from JWT token for auditing
        user_id = None
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            try:
                payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
                user_id = payload.get("sub")
            except JWTError:
                pass

        # 3. Process Request
        response = await call_next(request)

        # 4. Audit Log Write (non-blocking async db logging)
        try:
            async with AsyncSessionLocal() as db:
                import uuid
                log_entry = AuditLog(
                    user_id=uuid.UUID(user_id) if user_id else None,
                    method=method,
                    path=path,
                    ip_address=client_ip,
                    status_code=response.status_code
                )
                db.add(log_entry)
                await db.commit()
        except Exception:
            pass

        return response
