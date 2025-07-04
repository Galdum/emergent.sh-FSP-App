import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
import asyncio
import functools
from functools import wraps

def async_wrap(func):
    @wraps(func)
    async def run(*args, loop=None, executor=None, **kwargs):
        if loop is None:
            loop = asyncio.get_event_loop()
        partial_func = functools.partial(func, *args, **kwargs)
        return await loop.run_in_executor(executor, partial_func)
    return run

class EmailService:
    def __init__(self):
        self.smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
        self.smtp_port = int(os.getenv('SMTP_PORT', '587'))
        self.smtp_username = os.getenv('SMTP_USERNAME')
        self.smtp_password = os.getenv('SMTP_PASSWORD')
        self.from_email = os.getenv('FROM_EMAIL', self.smtp_username)
        
        # Check if email is properly configured
        self.is_configured = all([
            self.smtp_username, 
            self.smtp_password, 
            self.from_email
        ])
    
    def _send_email_sync(self, to_email: str, subject: str, html_body: str, text_body: str = None):
        """Synchronous email sending"""
        if not self.is_configured:
            print(f"Email not configured. Would send to {to_email}: {subject}")
            return True
        
        try:
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = self.from_email
            msg['To'] = to_email
            
            # Add text and HTML parts
            if text_body:
                text_part = MIMEText(text_body, 'plain', 'utf-8')
                msg.attach(text_part)
            
            html_part = MIMEText(html_body, 'html', 'utf-8')
            msg.attach(html_part)
            
            # Send email
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_username, self.smtp_password)
                server.send_message(msg)
            
            return True
            
        except Exception as e:
            print(f"Failed to send email to {to_email}: {str(e)}")
            return False
    
    async def send_email(self, to_email: str, subject: str, html_body: str, text_body: str = None):
        """Asynchronous email sending"""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None, 
            self._send_email_sync, 
            to_email, 
            subject, 
            html_body, 
            text_body
        )
    
    async def send_password_reset_email(self, to_email: str, reset_token: str):
        """Send password reset email"""
        # In production, this would be your app's URL
        base_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
        reset_url = f"{base_url}/reset-password?token={reset_token}"
        
        subject = "FSP Navigator - Resetare parolă"
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Resetare parolă FSP Navigator</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 28px;">FSP Navigator</h1>
                <p style="color: #e0e7ff; margin: 10px 0 0 0;">Ghidul tău pentru Approbation în Germania</p>
            </div>
            
            <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
                <h2 style="color: #1f2937; margin-top: 0;">Resetare parolă</h2>
                
                <p>Salut!</p>
                
                <p>Ai solicitat resetarea parolei pentru contul tău FSP Navigator. Fă click pe butonul de mai jos pentru a crea o parolă nouă:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{reset_url}" 
                       style="display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                        Resetează parola
                    </a>
                </div>
                
                <p style="color: #6b7280; font-size: 14px;">
                    Dacă nu poți da click pe buton, copiază și lipește acest link în browser:<br>
                    <a href="{reset_url}" style="color: #3b82f6; word-break: break-all;">{reset_url}</a>
                </p>
                
                <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0;">
                    <p style="margin: 0; color: #92400e; font-size: 14px;">
                        <strong>Atenție:</strong> Acest link expiră în 1 oră din motive de securitate.
                    </p>
                </div>
                
                <p style="color: #6b7280; font-size: 14px;">
                    Dacă nu ai solicitat această resetare, poți ignora acest email în siguranță. Parola ta nu va fi schimbată.
                </p>
            </div>
            
            <div style="background: #f9fafb; padding: 20px; text-align: center; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
                <p style="margin: 0; color: #6b7280; font-size: 12px;">
                    © 2024 FSP Navigator. Toate drepturile rezervate.<br>
                    Acest email a fost trimis pentru <strong>{to_email}</strong>
                </p>
            </div>
        </body>
        </html>
        """
        
        text_body = f"""
FSP Navigator - Resetare parolă

Salut!

Ai solicitat resetarea parolei pentru contul tău FSP Navigator.

Pentru a reseta parola, accesează următorul link:
{reset_url}

Atenție: Acest link expiră în 1 oră din motive de securitate.

Dacă nu ai solicitat această resetare, poți ignora acest email în siguranță.

© 2024 FSP Navigator
        """
        
        return await self.send_email(to_email, subject, html_body, text_body)
    
    async def send_welcome_email(self, to_email: str, first_name: str = None):
        """Send welcome email to new users"""
        name = first_name if first_name else "Doctor"
        subject = f"Bine ai venit la FSP Navigator, {name}!"
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Bine ai venit la FSP Navigator</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Bine ai venit!</h1>
                <p style="color: #e0e7ff; margin: 10px 0 0 0;">La FSP Navigator - Ghidul tău pentru Germania</p>
            </div>
            
            <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
                <h2 style="color: #1f2937; margin-top: 0;">Salut, {name}!</h2>
                
                <p>Felicitări pentru că ai făcut primul pas către obținerea Approbation-ului în Germania! 🇩🇪</p>
                
                <p>FSP Navigator te va ghida prin întreg procesul complex, oferindu-ți:</p>
                
                <ul style="color: #374151;">
                    <li>📋 Pași clari și organizați pentru fiecare Bundesland</li>
                    <li>🤖 Tutor AI pentru exersarea germanei medicale (FSP)</li>
                    <li>📄 Management complet al documentelor</li>
                    <li>💬 Generator de email-uri profesionale</li>
                    <li>🎯 Urmărirea progresului în timp real</li>
                    <li>📚 Resurse verificate și actualizate</li>
                </ul>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{os.getenv('FRONTEND_URL', 'http://localhost:3000')}" 
                       style="display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                        Începe acum
                    </a>
                </div>
                
                <div style="background: #eff6ff; border: 1px solid #3b82f6; border-radius: 8px; padding: 15px; margin: 20px 0;">
                    <p style="margin: 0; color: #1e40af; font-size: 14px;">
                        💡 <strong>Sfat:</strong> Completează-ți profilul pentru a primi recomandări personalizate bazate pe țara ta de origine și Bundesland-ul țintă.
                    </p>
                </div>
                
                <p>Succes în călătoria ta către o carieră medicală de succes în Germania!</p>
                
                <p style="color: #6b7280; font-style: italic;">
                    Echipa FSP Navigator
                </p>
            </div>
            
            <div style="background: #f9fafb; padding: 20px; text-align: center; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
                <p style="margin: 0; color: #6b7280; font-size: 12px;">
                    © 2024 FSP Navigator. Toate drepturile rezervate.
                </p>
            </div>
        </body>
        </html>
        """
        
        return await self.send_email(to_email, subject, html_body)

# Global email service instance
email_service = EmailService()

# Convenience function for password reset
async def send_password_reset_email(email: str, token: str):
    return await email_service.send_password_reset_email(email, token)

# Convenience function for welcome email
async def send_welcome_email(email: str, first_name: str = None):
    return await email_service.send_welcome_email(email, first_name)