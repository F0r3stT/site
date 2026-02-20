import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings


async def send_otp_email(to_email: str, code: str, ttl_minutes: int):
    """Send OTP code via email"""
    if not settings.SMTP_HOST:
        # Development mode - log to console
        logging.info(f"[MAIL] To: {to_email}, Code: {code}, TTL: {ttl_minutes}")
        return
    
    subject = "Your CircuitWorks login code"
    body = f"""
    Your CircuitWorks login code: {code}
    
    This code expires in {ttl_minutes} minutes.
    If you didn't request this, ignore this email.
    """
    
    msg = MIMEMultipart()
    msg["From"] = settings.SMTP_FROM
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "plain"))
    
    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            if settings.SMTP_STARTTLS:
                server.starttls()
            if settings.SMTP_USER and settings.SMTP_PASS:
                server.login(settings.SMTP_USER, settings.SMTP_PASS)
            server.send_message(msg)
    except Exception as e:
        logging.error(f"Failed to send email: {e}")
        raise