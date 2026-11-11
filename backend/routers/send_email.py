from fastapi import Depends, APIRouter, HTTPException, Request, status
from source.send_email_contact import SendContactEmail
from model.base_models_send_contact_email import ContactForm
from model.base_models_send_contact_email import SendMessageSuccess
from model.base_models_errors import ErrorResponseModel
from utility.analytics import tracker
from utility.client_ip import client_ip
from utility.logger import Logger
from utility.rate_limit import InMemoryRateLimiter
from utility.view_counter import record_public_event
from utility.settings import EMAIL_RATE_LIMIT_MAX_REQUESTS, EMAIL_RATE_LIMIT_WINDOW_SECONDS, \
    EMAIL_RATE_LIMIT_GLOBAL_MAX_REQUESTS

logger = Logger(__name__)

router = APIRouter(tags=["Drop Me A Message"])

rate_limiter = InMemoryRateLimiter(
    max_requests=EMAIL_RATE_LIMIT_MAX_REQUESTS,
    window_seconds=EMAIL_RATE_LIMIT_WINDOW_SECONDS,
    global_max_requests=EMAIL_RATE_LIMIT_GLOBAL_MAX_REQUESTS
)


@router.post('/send_email', status_code=status.HTTP_201_CREATED)
async def send_email(request: Request, contact_form: ContactForm = Depends(ContactForm.as_form)):
    client = client_ip(request)
    if not rate_limiter.allow(client):
        error_message = "Error: Too many messages sent. Please try again later."
        logger.warning(f"{error_message} (rate limit exceeded for {client})")
        error_detail = ErrorResponseModel(
            error_message=error_message,
            error_type="RateLimitExceeded"
        )
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=error_detail.model_dump())
    try:
        send_contact_email = SendContactEmail(
            sender_name=contact_form.name,
            sender_email=contact_form.email,
            sender_content=contact_form.message
        )
        await send_contact_email.send_email()
    except Exception as e:
        error_message = "Error: There was an error sending your message. Please try again later."
        logger.error(f"{error_message} ({type(e).__name__}: {e})")
        error_detail = ErrorResponseModel(
            error_message=error_message,
            error_type="EmailDeliveryFailed"
        )
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=error_detail.model_dump())
    success_message = "Your message has been sent successfully."
    tracker.track(event="contact_submit", client=client)
    record_public_event("contact_submit")
    logger.info(success_message)
    email_success = SendMessageSuccess(
        message=success_message
    )
    return email_success.model_dump()
