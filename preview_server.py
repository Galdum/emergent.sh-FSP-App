#!/usr/bin/env python3
"""
ApprobMed Preview Server - Standalone version for quick testing
"""

from http.server import HTTPServer, SimpleHTTPRequestHandler
import json
import os
import sys
from urllib.parse import urlparse, parse_qs
import uuid
from datetime import datetime
import hashlib

# Simple in-memory storage
USERS = {}
TOKENS = {}
DOCUMENTS = {}

class ApprobMedHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        """Handle GET requests"""
        path = urlparse(self.path).path
        
        # Serve the React application
        if path == "/" or path == "/index.html":
            self.send_response(200)
            self.send_header("Content-type", "text/html")
            self.end_headers()
            
            build_index = os.path.join("frontend", "build", "index.html")
            if os.path.exists(build_index):
                with open(build_index, "rb") as f:
                    self.wfile.write(f.read())
            else:
                self.wfile.write(b"<h1>ApprobMed Preview</h1><p>React build not found. Please run 'npm run build' in frontend directory.</p>")
            return
        
        # Serve static assets from React build
        if path.startswith("/static/"):
            static_path = os.path.join("frontend", "build", path[1:])  # Remove leading slash
            if os.path.exists(static_path):
                # Determine content type
                if path.endswith('.js'):
                    content_type = "application/javascript"
                elif path.endswith('.css'):
                    content_type = "text/css"
                elif path.endswith('.map'):
                    content_type = "application/json"
                else:
                    content_type = "application/octet-stream"
                
                self.send_response(200)
                self.send_header("Content-type", content_type)
                self.end_headers()
                
                with open(static_path, "rb") as f:
                    self.wfile.write(f.read())
                return
        
        # Serve the clear storage utility
        if path == "/clear":
            self.send_response(200)
            self.send_header("Content-type", "text/html")
            self.end_headers()
            
            if os.path.exists("clear_storage.html"):
                with open("clear_storage.html", "rb") as f:
                    self.wfile.write(f.read())
            else:
                self.wfile.write(b"<h1>Clear Storage</h1><script>localStorage.clear(); window.location.href='/';</script>")
            return
        
        # Serve the preview HTML file for legacy compatibility
        if path == "/preview.html":
            self.send_response(200)
            self.send_header("Content-type", "text/html")
            self.end_headers()
            
            if os.path.exists("preview.html"):
                with open("preview.html", "rb") as f:
                    self.wfile.write(f.read())
            else:
                self.wfile.write(b"<h1>ApprobMed Preview</h1><p>preview.html not found</p>")
            return
        
        # API endpoints
        if path == "/api":
            self.send_json({"message": "ApprobMed API Preview", "version": "1.0.0"})
        elif path == "/docs":
            self.send_response(200)
            self.send_header("Content-type", "text/html")
            self.end_headers()
            self.wfile.write(self.generate_docs().encode())
        elif path.startswith("/api/"):
            self.handle_api_get(path)
        else:
            super().do_GET()
    
    def do_POST(self):
        """Handle POST requests"""
        path = urlparse(self.path).path
        
        if path.startswith("/api/"):
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data) if post_data else {}
            except:
                data = {}
            
            self.handle_api_post(path, data)
        else:
            self.send_error(404)
    
    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()
    
    def handle_api_get(self, path):
        """Handle API GET requests"""
        auth_token = self.headers.get('Authorization', '').replace('Bearer ', '')
        
        if path == "/api/auth/me":
            if auth_token in TOKENS:
                user = USERS.get(TOKENS[auth_token])
                if user:
                    self.send_json({
                        "id": user["id"],
                        "email": user["email"],
                        "first_name": user.get("first_name", ""),
                        "last_name": user.get("last_name", "")
                    })
                    return
            self.send_error(401, "Unauthorized")
        
        elif path == "/api/documents/checklist":
            if auth_token in TOKENS:
                self.send_json({
                    "checklist": [
                        {"type": "diploma", "title": "Medical Diploma", "status": "pending"},
                        {"type": "transcript", "title": "Academic Transcript", "status": "pending"},
                        {"type": "cv", "title": "Curriculum Vitae", "status": "pending"},
                        {"type": "passport", "title": "Passport Copy", "status": "pending"}
                    ],
                    "progress": {"total": 4, "completed": 0, "percentage": 0}
                })
            else:
                self.send_error(401, "Unauthorized")
        
        elif path.startswith("/api/documents/requirements/"):
            if auth_token in TOKENS:
                bundesland = path.split("/")[-1]
                self.send_json({
                    "bundesland": bundesland,
                    "required_documents": [
                        {"type": "diploma", "title": "Medical Diploma", "description": "Your medical degree certificate"},
                        {"type": "transcript", "title": "Transcript", "description": "Academic records"},
                        {"type": "police_certificate", "title": "Police Certificate", "description": "Criminal background check"}
                    ],
                    "specific_notes": f"Requirements for {bundesland.replace('-', ' ').title()}",
                    "overall_progress": 0.0
                })
            else:
                self.send_error(401, "Unauthorized")
        
        elif path.startswith("/api/gdpr/privacy-policy"):
            self.send_json({
                "version": "1.0",
                "effective_date": "2025-01-01",
                "content": "<h1>Politica de Confidențialitate</h1><p>Această aplicație colectează și procesează datele dumneavoastră personale în conformitate cu Regulamentul General privind Protecția Datelor (GDPR).</p><h2>Datele colectate</h2><p>Colectăm următoarele tipuri de date:</p><ul><li>Informații de contact (email)</li><li>Progres în aplicație</li><li>Preferințe de utilizare</li></ul><h2>Utilizarea datelor</h2><p>Datele sunt utilizate pentru:</p><ul><li>Furnizarea serviciilor aplicației</li><li>Îmbunătățirea experienței utilizatorului</li><li>Comunicări importante despre serviciu</li></ul>"
            })
        
        elif path.startswith("/api/gdpr/terms-of-service"):
            self.send_json({
                "version": "1.0", 
                "effective_date": "2025-01-01",
                "content": "<h1>Termeni și Condiții</h1><p>Prin utilizarea acestei aplicații, acceptați următorii termeni și condiții.</p><h2>Utilizarea Serviciului</h2><p>Această aplicație este destinată exclusiv scopurilor educaționale și informative pentru medicii care doresc să lucreze în Germania.</p><h2>Limitarea Răspunderii</h2><p>Informațiile furnizate sunt doar în scop informativ și nu constituie consiliere juridică sau profesională.</p><h2>Modificări</h2><p>Ne rezervăm dreptul de a modifica acești termeni în orice moment.</p>"
            })
        
        else:
            self.send_error(404, "Not Found")
    
    def handle_api_post(self, path, data):
        """Handle API POST requests"""
        if path == "/api/auth/register":
            email = data.get("email", "")
            password = data.get("password", "")
            
            if not email or not password:
                self.send_json({"detail": "Email and password required"}, 400)
                return
            
            if email in USERS:
                self.send_json({"detail": "Email already registered"}, 400)
                return
            
            # Create user
            user_id = str(uuid.uuid4())
            USERS[email] = {
                "id": user_id,
                "email": email,
                "password_hash": hashlib.sha256(password.encode()).hexdigest(),
                "first_name": data.get("first_name", ""),
                "last_name": data.get("last_name", ""),
                "created_at": datetime.now().isoformat()
            }
            
            # Create token
            token = str(uuid.uuid4())
            TOKENS[token] = email
            
            self.send_json({
                "access_token": token,
                "token_type": "bearer"
            })
        
        elif path == "/api/auth/login":
            email = data.get("email", "")
            password = data.get("password", "")
            
            user = USERS.get(email)
            if user and user["password_hash"] == hashlib.sha256(password.encode()).hexdigest():
                token = str(uuid.uuid4())
                TOKENS[token] = email
                
                self.send_json({
                    "access_token": token,
                    "token_type": "bearer"
                })
            else:
                self.send_json({"detail": "Invalid credentials"}, 401)
        
        elif path == "/api/ai-assistant/chat":
            auth_token = self.headers.get('Authorization', '').replace('Bearer ', '')
            if auth_token in TOKENS:
                message = data.get("message", "")
                language = data.get("language", "en")
                
                responses = {
                    "en": f"This is a preview response. In the full version, I would help you with: {message}",
                    "de": f"Dies ist eine Vorschau-Antwort. In der Vollversion würde ich Ihnen helfen mit: {message}",
                    "ro": f"Acesta este un răspuns de previzualizare. În versiunea completă, v-aș ajuta cu: {message}"
                }
                
                self.send_json({
                    "response": responses.get(language, responses["en"]),
                    "suggestions": ["Complete your profile", "Upload documents", "Check requirements"],
                    "next_steps": ["Set your target Bundesland", "Start document collection"]
                })
            else:
                self.send_error(401, "Unauthorized")
        
        elif path == "/api/gdpr/consent":
            # Record GDPR consent
            self.send_json({
                "status": "success",
                "message": "Consent recorded successfully",
                "consent_id": str(uuid.uuid4())
            })
        
        else:
            self.send_error(404, "Not Found")
    
    def send_json(self, data, status=200):
        """Send JSON response"""
        self.send_response(status)
        self.send_header("Content-type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
    
    def generate_docs(self):
        """Generate simple API documentation"""
        return """
        <!DOCTYPE html>
        <html>
        <head>
            <title>ApprobMed API Documentation</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; }
                h1 { color: #667eea; }
                .endpoint { background: #f5f5f5; padding: 10px; margin: 10px 0; border-radius: 5px; }
                code { background: #e2e8f0; padding: 2px 5px; border-radius: 3px; }
            </style>
        </head>
        <body>
            <h1>ApprobMed API Documentation</h1>
            <p>Preview API for the ApprobMed medical license guide platform.</p>
            
            <h2>Authentication Endpoints</h2>
            <div class="endpoint">
                <strong>POST /api/auth/register</strong><br>
                Register a new user<br>
                Body: <code>{"email": "string", "password": "string", "first_name": "string", "last_name": "string"}</code>
            </div>
            
            <div class="endpoint">
                <strong>POST /api/auth/login</strong><br>
                Login user<br>
                Body: <code>{"email": "string", "password": "string"}</code>
            </div>
            
            <div class="endpoint">
                <strong>GET /api/auth/me</strong><br>
                Get current user info<br>
                Headers: <code>Authorization: Bearer {token}</code>
            </div>
            
            <h2>Document Endpoints</h2>
            <div class="endpoint">
                <strong>GET /api/documents/checklist</strong><br>
                Get document checklist<br>
                Headers: <code>Authorization: Bearer {token}</code>
            </div>
            
            <div class="endpoint">
                <strong>GET /api/documents/requirements/{bundesland}</strong><br>
                Get requirements for specific Bundesland<br>
                Headers: <code>Authorization: Bearer {token}</code>
            </div>
            
            <h2>AI Assistant</h2>
            <div class="endpoint">
                <strong>POST /api/ai-assistant/chat</strong><br>
                Chat with AI assistant<br>
                Headers: <code>Authorization: Bearer {token}</code><br>
                Body: <code>{"message": "string", "language": "en|de|ro"}</code>
            </div>
            
            <p><a href="/">Back to App</a></p>
        </body>
        </html>
        """

def main():
    port = 8000
    server_address = ('', port)
    httpd = HTTPServer(server_address, ApprobMedHandler)
    
    print(f"""
╔══════════════════════════════════════════════════════╗
║          ApprobMed Preview Server                      ║
╠══════════════════════════════════════════════════════╣
║  🚀 Server running at: http://localhost:{port}         ║
║  📚 API Docs at: http://localhost:{port}/docs         ║
║  🌐 Preview UI at: http://localhost:{port}/            ║
║                                                        ║
║  This is a preview server with mock data.             ║
║  Press Ctrl+C to stop the server.                     ║
╚══════════════════════════════════════════════════════╝
    """)
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\nShutting down server...")
        httpd.shutdown()

if __name__ == "__main__":
    main()