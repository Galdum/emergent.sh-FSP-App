from fastapi import APIRouter, Depends, HTTPException, status, Request
from typing import List, Optional, Dict
from backend.auth import get_current_user
from backend.database import get_database
from backend.models import UserInDB
from backend.security import AuditLogger
from datetime import datetime
import google.generativeai as genai
import os
import logging
import json
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ai-assistant", tags=["ai_assistant"])

# Configure Gemini API
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-pro')
else:
    logger.warning("Gemini API key not configured")
    model = None

# Request/Response models
class ChatMessage(BaseModel):
    role: str  # user or assistant
    content: str
    timestamp: datetime = datetime.utcnow()

class ChatRequest(BaseModel):
    message: str
    context: Optional[Dict[str, Any]] = None
    language: str = "en"  # en, de, ro

class ChatResponse(BaseModel):
    response: str
    suggestions: List[str] = []
    relevant_documents: List[str] = []
    next_steps: List[str] = []

# System prompts for different contexts
SYSTEM_PROMPTS = {
    "general": """You are ApprobMed Assistant, an AI helper specialized in guiding medical graduates through the German medical license (Approbation) process. 

Your knowledge includes:
- Document requirements for each Bundesland
- FSP (Fachsprachprüfung) preparation tips
- Timeline expectations
- Common challenges and solutions
- Legal requirements and procedures

Always be helpful, accurate, and encouraging. If you're unsure about specific requirements, advise users to verify with official sources.""",
    
    "documents": """Focus on document-related queries. Help users understand:
- Which documents are required for their specific situation
- Translation and apostille requirements
- How to obtain specific documents
- Common mistakes to avoid
- Bundesland-specific requirements""",
    
    "fsp": """Focus on FSP (Fachsprachprüfung) preparation. Help with:
- Medical German vocabulary
- Common exam scenarios
- Doctor-patient communication in German
- Exam format and expectations
- Study strategies and resources""",
    
    "timeline": """Focus on timeline and process questions. Explain:
- Typical processing times for each Bundesland
- How to optimize the application process
- What can cause delays
- Parallel vs sequential steps
- Realistic expectations"""
}

# Predefined responses for common questions
QUICK_RESPONSES = {
    "documents_needed": {
        "en": "The basic documents needed for Approbation include: medical diploma, transcript, police clearance certificate, CV, passport, and language certificate. Specific requirements vary by Bundesland.",
        "de": "Die grundlegenden Dokumente für die Approbation umfassen: Medizinisches Diplom, Transcript, Führungszeugnis, Lebenslauf, Reisepass und Sprachzertifikat. Die spezifischen Anforderungen variieren je nach Bundesland.",
        "ro": "Documentele de bază necesare pentru Approbation includ: diplomă medicală, foaie matricolă, cazier judiciar, CV, pașaport și certificat de limbă. Cerințele specifice variază în funcție de Bundesland."
    },
    "fsp_info": {
        "en": "The FSP (Fachsprachprüfung) is a medical German language exam required for foreign doctors. It tests your ability to communicate with patients and colleagues in German medical settings.",
        "de": "Die FSP (Fachsprachprüfung) ist eine medizinische Deutschprüfung für ausländische Ärzte. Sie prüft Ihre Fähigkeit, mit Patienten und Kollegen in deutschen medizinischen Einrichtungen zu kommunizieren.",
        "ro": "FSP (Fachsprachprüfung) este un examen de limbă germană medicală necesar pentru medicii străini. Testează capacitatea de a comunica cu pacienții și colegii în mediul medical german."
    }
}

async def get_user_context(user_id: str, db):
    """Gather relevant context about the user for personalized responses."""
    context = {}
    
    # Get user profile
    user = await db.users.find_one({"id": user_id})
    if user:
        context["country_of_origin"] = user.get("country_of_origin")
        context["target_bundesland"] = user.get("target_bundesland")
        context["german_level"] = user.get("german_level")
        context["preferred_language"] = user.get("preferred_language", "en")
    
    # Get document status
    documents = await db.documents.find({"user_id": user_id}).to_list(None)
    context["documents_uploaded"] = len([d for d in documents if d["status"] == "uploaded"])
    context["documents_verified"] = len([d for d in documents if d["status"] == "verified"])
    context["documents_total"] = len(documents)
    
    # Get FSP progress
    fsp_progress = await db.fsp_progress.find_one({"user_id": user_id})
    if fsp_progress:
        context["fsp_practice_sessions"] = fsp_progress.get("practice_sessions", 0)
        context["vocabulary_mastered"] = len(fsp_progress.get("vocabulary_mastered", []))
    
    return context

async def generate_ai_response(message: str, context: Dict, language: str = "en") -> ChatResponse:
    """Generate AI response using Gemini API."""
    if not model:
        return ChatResponse(
            response="AI assistant is currently unavailable. Please try again later.",
            suggestions=["Check our FAQ section", "Contact support"]
        )
    
    # Determine the appropriate system prompt
    prompt_type = "general"
    if "document" in message.lower() or "upload" in message.lower():
        prompt_type = "documents"
    elif "fsp" in message.lower() or "exam" in message.lower() or "german" in message.lower():
        prompt_type = "fsp"
    elif "timeline" in message.lower() or "how long" in message.lower():
        prompt_type = "timeline"
    
    # Build the full prompt
    system_prompt = SYSTEM_PROMPTS[prompt_type]
    
    # Add language instruction
    language_instruction = {
        "en": "Respond in English.",
        "de": "Antworte auf Deutsch.",
        "ro": "Răspunde în română."
    }
    
    # Include user context
    context_str = f"""
User Context:
- Country of origin: {context.get('country_of_origin', 'Not specified')}
- Target Bundesland: {context.get('target_bundesland', 'Not specified')}
- German level: {context.get('german_level', 'Not specified')}
- Documents uploaded: {context.get('documents_uploaded', 0)}/{context.get('documents_total', 0)}
- FSP practice sessions: {context.get('fsp_practice_sessions', 0)}
"""
    
    full_prompt = f"""{system_prompt}

{context_str}

{language_instruction.get(language, language_instruction['en'])}

User Question: {message}

Provide a helpful, specific response. If relevant, include:
1. Direct answer to the question
2. Practical next steps
3. Relevant documents or resources
4. Common pitfalls to avoid

Format your response in a clear, friendly manner."""
    
    try:
        # Generate response
        response = model.generate_content(full_prompt)
        
        # Extract suggestions and next steps from the response
        response_text = response.text
        suggestions = []
        next_steps = []
        
        # Simple extraction of bullet points as suggestions/next steps
        lines = response_text.split('\n')
        for line in lines:
            if line.strip().startswith(('•', '-', '*', '1.', '2.', '3.')):
                cleaned_line = line.strip().lstrip('•-*123456789. ')
                if len(cleaned_line) < 100:  # Short items are likely action items
                    next_steps.append(cleaned_line)
        
        # Determine relevant documents based on context
        relevant_documents = []
        if "diploma" in message.lower():
            relevant_documents.append("diploma")
        if "police" in message.lower() or "certificate" in message.lower():
            relevant_documents.append("police_certificate")
        if "cv" in message.lower() or "resume" in message.lower():
            relevant_documents.append("cv")
        
        return ChatResponse(
            response=response_text,
            suggestions=suggestions[:3],  # Limit suggestions
            relevant_documents=relevant_documents,
            next_steps=next_steps[:5]  # Limit next steps
        )
        
    except Exception as e:
        logger.error(f"Error generating AI response: {str(e)}")
        return ChatResponse(
            response="I apologize, but I'm having trouble generating a response. Please try rephrasing your question or contact support if the issue persists.",
            suggestions=["Try a simpler question", "Check our FAQ", "Contact support"]
        )

@router.post("/chat", response_model=ChatResponse)
async def chat_with_assistant(
    request: ChatRequest,
    current_user: UserInDB = Depends(get_current_user),
    db = Depends(get_database)
):
    """Chat with the AI assistant for personalized guidance."""
    # Get user context
    user_context = await get_user_context(current_user.id, db)
    
    # Merge with provided context
    if request.context:
        user_context.update(request.context)
    
    # Check for quick responses first
    message_lower = request.message.lower()
    for key, responses in QUICK_RESPONSES.items():
        if key in message_lower:
            quick_response = responses.get(request.language, responses["en"])
            # Still generate AI response for additional context
            break
    
    # Generate AI response
    response = await generate_ai_response(
        request.message,
        user_context,
        request.language
    )
    
    # Save chat history
    chat_entry = {
        "user_id": current_user.id,
        "timestamp": datetime.utcnow(),
        "user_message": request.message,
        "assistant_response": response.response,
        "language": request.language,
        "context": user_context
    }
    await db.chat_history.insert_one(chat_entry)
    
    # Log interaction
    audit_logger = AuditLogger(db)
    await audit_logger.log_action(
        user_id=current_user.id,
        action="ai_chat",
        details={
            "message_length": len(request.message),
            "language": request.language,
            "has_suggestions": len(response.suggestions) > 0
        }
    )
    
    return response

@router.get("/chat-history")
async def get_chat_history(
    limit: int = 20,
    skip: int = 0,
    current_user: UserInDB = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get user's chat history with the AI assistant."""
    # Get chat history
    history_cursor = db.chat_history.find(
        {"user_id": current_user.id}
    ).sort("timestamp", -1).skip(skip).limit(limit)
    
    history = await history_cursor.to_list(limit)
    
    # Format for response
    formatted_history = []
    for entry in history:
        formatted_history.append({
            "timestamp": entry["timestamp"],
            "user_message": entry["user_message"],
            "assistant_response": entry["assistant_response"],
            "language": entry.get("language", "en")
        })
    
    return {
        "history": formatted_history,
        "total": await db.chat_history.count_documents({"user_id": current_user.id})
    }

@router.post("/quick-tips")
async def get_quick_tips(
    topic: str,
    language: str = "en",
    current_user: UserInDB = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get quick tips on specific topics without full chat."""
    # Predefined tips by topic
    tips = {
        "getting_started": {
            "en": [
                "Start by setting your target Bundesland in your profile",
                "Gather all original documents before starting translations",
                "Check if your degree needs recognition in the anabin database",
                "Consider starting German lessons early - B2/C1 is usually required",
                "Join online communities of doctors going through the same process"
            ],
            "de": [
                "Beginnen Sie damit, Ihr Ziel-Bundesland in Ihrem Profil festzulegen",
                "Sammeln Sie alle Originaldokumente, bevor Sie mit Übersetzungen beginnen",
                "Prüfen Sie, ob Ihr Abschluss in der anabin-Datenbank anerkannt werden muss",
                "Beginnen Sie frühzeitig mit Deutschkursen - B2/C1 wird normalerweise benötigt",
                "Treten Sie Online-Communities von Ärzten bei, die denselben Prozess durchlaufen"
            ]
        },
        "document_preparation": {
            "en": [
                "Always keep original documents safe - make certified copies",
                "Translations must be done by sworn translators",
                "Police certificates are usually valid for only 6 months",
                "Apostille is required for non-EU countries",
                "Digital copies are helpful but originals are usually required"
            ]
        },
        "fsp_preparation": {
            "en": [
                "Focus on patient communication scenarios",
                "Learn medical abbreviations used in German hospitals",
                "Practice taking patient history (Anamnese) in German",
                "Study anatomy terms in German - they're often different",
                "Record yourself speaking to improve pronunciation"
            ]
        }
    }
    
    topic_tips = tips.get(topic, {}).get(language, tips.get(topic, {}).get("en", []))
    
    if not topic_tips:
        # Generate tips using AI if not predefined
        if model:
            prompt = f"Provide 5 practical tips for medical graduates about {topic} in the context of German medical license (Approbation). Language: {language}"
            try:
                response = model.generate_content(prompt)
                topic_tips = response.text.split('\n')
                topic_tips = [tip.strip() for tip in topic_tips if tip.strip() and len(tip.strip()) > 10][:5]
            except:
                topic_tips = ["Please try a different topic or check our comprehensive guides."]
        else:
            topic_tips = ["AI tips generation is currently unavailable."]
    
    return {
        "topic": topic,
        "tips": topic_tips,
        "related_topics": ["getting_started", "document_preparation", "fsp_preparation"]
    }

@router.post("/analyze-profile")
async def analyze_user_profile(
    current_user: UserInDB = Depends(get_current_user),
    db = Depends(get_database)
):
    """Analyze user's profile and progress to provide personalized recommendations."""
    # Gather comprehensive user data
    user_context = await get_user_context(current_user.id, db)
    
    analysis = {
        "profile_completeness": 0,
        "missing_information": [],
        "document_progress": 0,
        "estimated_timeline_weeks": 30,
        "personalized_recommendations": [],
        "immediate_actions": [],
        "warnings": []
    }
    
    # Check profile completeness
    profile_fields = ["first_name", "last_name", "country_of_origin", "target_bundesland", 
                     "medical_degree_country", "german_level"]
    completed_fields = 0
    
    for field in profile_fields:
        if getattr(current_user, field, None):
            completed_fields += 1
        else:
            analysis["missing_information"].append(field.replace("_", " ").title())
    
    analysis["profile_completeness"] = (completed_fields / len(profile_fields)) * 100
    
    # Analyze document progress
    if user_context.get("documents_total", 0) > 0:
        analysis["document_progress"] = (
            user_context.get("documents_verified", 0) / user_context["documents_total"]
        ) * 100
    
    # Generate recommendations based on analysis
    if analysis["profile_completeness"] < 100:
        analysis["immediate_actions"].append("Complete your profile information")
    
    if not current_user.target_bundesland:
        analysis["immediate_actions"].append("Select your target Bundesland for specific requirements")
    
    if user_context.get("documents_uploaded", 0) == 0:
        analysis["immediate_actions"].append("Start uploading your documents")
    
    if not current_user.german_level or current_user.german_level < "B2":
        analysis["warnings"].append("German level B2 or higher is typically required")
    
    # Personalized recommendations
    if current_user.country_of_origin:
        if current_user.country_of_origin.lower() not in ["germany", "austria", "switzerland"]:
            analysis["personalized_recommendations"].append(
                "As a non-EU graduate, ensure your documents are apostilled"
            )
    
    if user_context.get("fsp_practice_sessions", 0) < 5:
        analysis["personalized_recommendations"].append(
            "Start practicing with our FSP preparation tools"
        )
    
    # Log analysis
    audit_logger = AuditLogger(db)
    await audit_logger.log_action(
        user_id=current_user.id,
        action="profile_analysis",
        details={"completeness": analysis["profile_completeness"]}
    )
    
    return analysis