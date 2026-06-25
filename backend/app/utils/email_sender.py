from app.utils.logger import logger

async def send_verification_email(email: str, token: str):
    """Send verification email. In local dev mode, just logs the token."""
    logger.info(
        "verification_email_stub",
        email=email,
        token=token,
        message="Email sending disabled in local mode. Use this token to verify."
    )

async def send_password_reset_email(email: str, token: str):
    """Send password reset email. In local dev mode, just logs the token."""
    logger.info(
        "password_reset_email_stub",
        email=email,
        token=token,
        message="Email sending disabled in local mode. Use this token to reset."
    )

