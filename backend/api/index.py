import os
import sys

# Add backend directory to sys.path to guarantee 'app' imports resolve cleanly
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.main import app


class VercelPathMiddleware:
    """
    Middleware for Vercel serverless rewrites:
    When Vercel rewrites incoming traffic to /api/index.py, the ASGI scope['path']
    is set to '/api/index.py' while the true requested path is stored in the
    'x-matched-path' or 'x-forwarded-uri' request header (e.g. '/auth/login', '/health').
    This middleware restores scope['path'] so FastAPI matches the correct route.
    """
    def __init__(self, asgi_app):
        self.asgi_app = asgi_app

    async def __call__(self, scope, receive, send):
        if scope["type"] in ("http", "websocket"):
            headers = dict(scope.get("headers", []))
            # Check for Vercel's original matched path header
            matched_path = headers.get(b"x-matched-path", b"").decode("utf-8")
            if not matched_path:
                matched_path = headers.get(b"x-forwarded-uri", b"").decode("utf-8")

            if matched_path:
                # Strip query parameters if present
                clean_path = matched_path.split("?")[0]
                scope["path"] = clean_path
                scope["raw_path"] = clean_path.encode("utf-8")

        await self.asgi_app(scope, receive, send)


# Wrap app for Vercel ASGI serverless handler
handler = VercelPathMiddleware(app)
