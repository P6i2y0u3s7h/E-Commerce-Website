import os
import sys

# Add backend directory to sys.path to guarantee 'app' imports resolve cleanly
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.main import app

# Vercel ASGI serverless handler
handler = app
