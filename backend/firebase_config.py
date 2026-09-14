import os
import json
import firebase_admin
from firebase_admin import credentials, auth


def initialize_firebase():
    """
    Initialize Firebase using:
    1. FIREBASE_SERVICE_ACCOUNT environment variable on Render
    2. firebase-service-account.json locally
    """

    if firebase_admin._apps:
        return

    firebase_json = os.getenv("FIREBASE_SERVICE_ACCOUNT")

    if firebase_json:
        # Render: credentials stored as an environment variable
        service_account_info = json.loads(firebase_json)
        cred = credentials.Certificate(service_account_info)

    else:
        # Local development: use the JSON file
        base_dir = os.path.dirname(os.path.abspath(__file__))
        service_account_path = os.path.join(
            base_dir,
            "firebase-service-account.json"
        )

        cred = credentials.Certificate(service_account_path)

    firebase_admin.initialize_app(cred)


initialize_firebase()


def verify_firebase_token(id_token: str):
    try:
        decoded_token = auth.verify_id_token(id_token)
        return decoded_token
    except Exception:
        return None