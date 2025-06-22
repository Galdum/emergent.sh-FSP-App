from datetime import datetime
from pydantic import BaseModel
from typing import Optional, List

# GDPR and Legal Compliance Models

class GDPRConsent(BaseModel):
    user_id: str
    privacy_policy_version: str = "1.0"
    terms_of_service_version: str = "1.0"
    consent_date: datetime
    ip_address: str
    user_agent: str
    marketing_consent: bool = False
    analytics_consent: bool = False
    essential_cookies: bool = True

class DataExportRequest(BaseModel):
    user_id: str
    request_date: datetime
    status: str  # 'pending', 'processing', 'completed', 'failed'
    export_url: Optional[str] = None
    expiry_date: Optional[datetime] = None

class DataDeletionRequest(BaseModel):
    user_id: str
    request_date: datetime
    deletion_date: Optional[datetime] = None
    status: str  # 'pending', 'processing', 'completed'
    reason: Optional[str] = None

class PrivacySettings(BaseModel):
    user_id: str
    data_processing_consent: bool = True
    email_notifications: bool = True
    analytics_tracking: bool = False
    third_party_sharing: bool = False
    data_retention_period: int = 730  # days

# Legal Documents and Terms
PRIVACY_POLICY = {
    "version": "1.0",
    "effective_date": "2025-01-01",
    "content": {
        "en": """
        # Privacy Policy - Medical Licensing Guide Application
        
        ## 1. Data Controller
        This application is provided as an educational tool. The operator is not responsible for any medical, legal, or professional advice provided through this platform.
        
        ## 2. Data We Collect
        - Email address (for account verification)
        - Progress data (completed tasks, quiz results)
        - Uploaded documents (stored locally, encrypted)
        - Usage analytics (anonymized)
        
        ## 3. Legal Basis for Processing
        - Contract performance (providing the service)
        - Legitimate interest (improving the service)
        - Consent (marketing communications)
        
        ## 4. Data Retention
        - Account data: 2 years after last login
        - Progress data: Until account deletion
        - Uploaded files: 30 days after account deletion
        
        ## 5. Your Rights (GDPR)
        - Right to access your data
        - Right to rectification
        - Right to erasure ("right to be forgotten")
        - Right to data portability
        - Right to object to processing
        
        ## 6. Disclaimers
        - Information may be outdated or incorrect
        - No guarantee of accuracy for medical/legal procedures
        - User assumes all responsibility for decisions made
        - No refunds for subscription services except as required by law
        
        ## 7. Contact
        For privacy concerns, contact through the app's feedback system.
        """,
        "ro": """
        # Politica de Confidențialitate - Aplicația Ghid Licențe Medicale
        
        ## 1. Administrator de Date
        Această aplicație este furnizată ca instrument educativ. Operatorul nu este responsabil pentru sfaturile medicale, legale sau profesionale oferite prin această platformă.
        
        ## 2. Datele Colectate
        - Adresa de email (pentru verificarea contului)
        - Date de progres (sarcini completate, rezultate quiz-uri)
        - Documente încărcate (stocate local, criptate)
        - Analize de utilizare (anonimizate)
        
        ## 3. Baza Legală pentru Procesare
        - Executarea contractului (furnizarea serviciului)
        - Interes legitim (îmbunătățirea serviciului)
        - Consimțământ (comunicări de marketing)
        
        ## 4. Reținerea Datelor
        - Date cont: 2 ani după ultima autentificare
        - Date progres: Până la ștergerea contului
        - Fișiere încărcate: 30 zile după ștergerea contului
        
        ## 5. Drepturile Dumneavoastră (GDPR)
        - Dreptul de acces la datele dumneavoastră
        - Dreptul la rectificare
        - Dreptul la ștergere ("dreptul de a fi uitat")
        - Dreptul la portabilitatea datelor
        - Dreptul de a vă opune procesării
        
        ## 6. Exonerări de Răspundere
        - Informațiile pot fi învechite sau incorecte
        - Nu există garanție de acuratețe pentru procedurile medicale/legale
        - Utilizatorul își asumă toată responsabilitatea pentru deciziile luate
        - Nu se returnează banii pentru serviciile de abonament, cu excepția cazurilor prevăzute de lege
        
        ## 7. Contact
        Pentru preocupări legate de confidențialitate, contactați prin sistemul de feedback al aplicației.
        """
    }
}

TERMS_OF_SERVICE = {
    "version": "1.0",
    "effective_date": "2025-01-01",
    "content": {
        "en": """
        # Terms of Service - Medical Licensing Guide Application
        
        ## 1. Acceptance of Terms
        By using this application, you agree to these terms and acknowledge that this is an educational tool only.
        
        ## 2. Service Description
        This application provides general information about medical licensing procedures in Germany. It is NOT professional medical or legal advice.
        
        ## 3. User Responsibilities
        - You are responsible for verifying all information independently
        - You must not rely solely on this app for critical decisions
        - You agree to use the service lawfully and ethically
        
        ## 4. Disclaimers and Limitations
        - NO WARRANTIES: Service provided "as is"
        - NO GUARANTEES of accuracy, completeness, or timeliness
        - NO LIABILITY for decisions made based on app content
        - Information may change without notice
        
        ## 5. Subscription Terms
        - Payments are non-refundable except as required by law
        - Subscriptions renew automatically unless cancelled
        - We may modify pricing with 30 days notice
        - Service may be discontinued with reasonable notice
        
        ## 6. Intellectual Property
        - App content is protected by copyright
        - Users retain rights to their uploaded content
        - Limited license granted for personal use only
        
        ## 7. Termination
        - We may terminate accounts for violations
        - Users may cancel subscriptions at any time
        - Data deletion occurs according to privacy policy
        
        ## 8. Governing Law
        These terms are governed by Romanian law and EU regulations.
        """,
        "ro": """
        # Termeni și Condiții - Aplicația Ghid Licențe Medicale
        
        ## 1. Acceptarea Termenilor
        Prin utilizarea acestei aplicații, sunteți de acord cu acești termeni și recunoașteți că aceasta este doar un instrument educativ.
        
        ## 2. Descrierea Serviciului
        Această aplicație oferă informații generale despre procedurile de licențiere medicală în Germania. NU este sfat medical sau legal profesional.
        
        ## 3. Responsabilitățile Utilizatorului
        - Sunteți responsabil pentru verificarea independentă a tuturor informațiilor
        - Nu trebuie să vă bazați exclusiv pe această aplicație pentru decizii critice
        - Sunteți de acord să utilizați serviciul în mod legal și etic
        
        ## 4. Exonerări și Limitări
        - FĂRĂ GARANȚII: Serviciul este furnizat "ca atare"
        - FĂRĂ GARANȚII de acuratețe, completitudine sau actualitate
        - FĂRĂ RĂSPUNDERE pentru deciziile luate pe baza conținutului aplicației
        - Informațiile se pot schimba fără notificare
        
        ## 5. Termenii Abonamentului
        - Plățile nu sunt rambursabile, cu excepția cazurilor prevăzute de lege
        - Abonamentele se reînnoiesc automat dacă nu sunt anulate
        - Putem modifica prețurile cu preaviz de 30 de zile
        - Serviciul poate fi întrerupt cu un preaviz rezonabil
        
        ## 6. Proprietatea Intelectuală
        - Conținutul aplicației este protejat de drepturi de autor
        - Utilizatorii rețin drepturile asupra conținutului încărcat
        - Se acordă licență limitată doar pentru uz personal
        
        ## 7. Terminarea
        - Putem termina conturile pentru încălcări
        - Utilizatorii pot anula abonamentele oricând
        - Ștergerea datelor se face conform politicii de confidențialitate
        
        ## 8. Legea Aplicabilă
        Acești termeni sunt guvernați de legea română și reglementările UE.
        """
    }
}