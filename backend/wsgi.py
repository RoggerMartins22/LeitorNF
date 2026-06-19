"""
WSGI entry point for PythonAnywhere.

PythonAnywhere serves apps via WSGI; FastAPI is ASGI. Adapt with a2wsgi.
Configure in the PythonAnywhere Web tab:
    Source code:        /home/<seu-usuario>/LeitorNF/backend
    Working directory:  /home/<seu-usuario>/LeitorNF/backend
    WSGI config file:   /var/www/<seu-usuario>_pythonanywhere_com_wsgi.py
        (cole o conteúdo deste arquivo lá, ajustando os paths)
"""
import os
import sys

# Adjust if your repo layout differs on PythonAnywhere
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from a2wsgi import ASGIMiddleware  # noqa: E402
from app.main import app  # noqa: E402

application = ASGIMiddleware(app)
