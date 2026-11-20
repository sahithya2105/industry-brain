import os
import logging
from typing import Optional, Dict, Any
from fastapi import Header, HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger("industry_brain.auth")

FIREBASE_INITIALIZED = False
firebase_auth = None

# Attempt to initialize Firebase Admin SDK
cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH")
project_id = os.getenv("FIREBASE_PROJECT_ID")

if cred_path and os.path.exists(cred_path):
    try:
        import firebase_admin
        from firebase_admin import credentials, auth
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred, {"projectId": project_id} if project_id else None)
        firebase_auth = auth
        FIREBASE_INITIALIZED = True
        logger.info("Firebase Admin initialized successfully using service account credentials.")
    except Exception as e:
        logger.warning("Failed to initialize Firebase Admin with credentials: %s. Falling back to Demo Mode.", e)
else:
    logger.info("No Firebase service account found at '%s'. Running in Demo Mode (mock auth enabled).", cred_path)

security = HTTPBearer(auto_error=False)

def is_demo_mode() -> bool:
    return not FIREBASE_INITIALIZED

def get_current_user(creds: Optional[HTTPAuthorizationCredentials] = Security(security)) -> Dict[str, Any]:
    """
    Verifies Firebase token when configured.
    Falls back gracefully to Demo Mode if Firebase credentials are missing
    or if the client supplies a demo token.
    """
    demo_user = {
        "uid": "demo-operator-101",
        "email": "demo.engineer@industrybrain.ai",
        "name": "Demo Plant Operator",
        "role": "Plant Reliability Engineer",
        "mode": "demo"
    }

    # 1. If Firebase is not configured at all, allow all protected endpoints in Demo Mode
    if not FIREBASE_INITIALIZED:
        return demo_user

    # 2. If no authorization header provided
    if not creds or not creds.credentials:
        raise HTTPException(
            status_code=401,
            detail="Authentication token required. Sign in or switch to Demo Mode."
        )

    token = creds.credentials.strip()

    # 3. Allow explicitly labeled demo tokens even when Firebase is active (e.g. for testing)
    if token.startswith("demo-") or token == "mock-demo-token":
        return demo_user

    # 4. Verify real Firebase ID Token
    try:
        decoded = firebase_auth.verify_id_token(token)
        return {
            "uid": decoded.get("uid"),
            "email": decoded.get("email"),
            "name": decoded.get("name") or decoded.get("email", "Operator"),
            "role": "Verified User",
            "mode": "firebase"
        }
    except Exception as e:
        logger.warning("Firebase token verification failed: %s", e)
        raise HTTPException(
            status_code=401,
            detail=f"Invalid or expired authentication token: {str(e)}"
        )
