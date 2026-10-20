import httpx
from utility.settings import BREVO_API_KEY, MAIL_FROM, RECEIVER_EMAIL
from utility.logger import Logger

logger = Logger(__name__)

BREVO_SEND_EMAIL_URL = "https://api.brevo.com/v3/smtp/email"


class SendContactEmail:

    def __init__(self, sender_name, sender_email, sender_content):
        self._sender_name = sender_name
        self._sender_email = sender_email
        self._sender_content = sender_content
        self._sender_subject = f"New Message from {self._sender_name}"

    async def send_email(self):
        email_body = f"""
        
        Name: {self._sender_name}
        Email: {self._sender_email}
        
        Message: {self._sender_content}
        """

        payload = {
            "sender": {"name": f"{self._sender_name} via Portfolio", "email": MAIL_FROM},
            "to": [{"email": RECEIVER_EMAIL}],
            "replyTo": {"name": self._sender_name, "email": self._sender_email},
            "subject": self._sender_subject,
            "textContent": email_body
        }
        headers = {"api-key": BREVO_API_KEY, "accept": "application/json"}

        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.post(BREVO_SEND_EMAIL_URL, json=payload, headers=headers)
        if response.is_error:
            logger.error(f"Brevo send failed ({response.status_code}): {response.text}")
            response.raise_for_status()
