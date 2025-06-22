from fastapi import APIRouter, Depends, HTTPException, Request
from datetime import datetime, timedelta
import json
import os
from typing import Optional
from .auth import get_current_user
from .models_gdpr import GDPRConsent, DataExportRequest, DataDeletionRequest, PrivacySettings, PRIVACY_POLICY, TERMS_OF_SERVICE
from .database import get_database
import zipfile
import io

router = APIRouter(prefix="/api/gdpr", tags=["GDPR & Legal"])

@router.get("/privacy-policy")
async def get_privacy_policy(lang: str = "en"):
    """Get privacy policy in specified language"""
    if lang not in PRIVACY_POLICY["content"]:
        lang = "en"
    
    return {
        "version": PRIVACY_POLICY["version"],
        "effective_date": PRIVACY_POLICY["effective_date"],
        "content": PRIVACY_POLICY["content"][lang]
    }

@router.get("/terms-of-service")
async def get_terms_of_service(lang: str = "en"):
    """Get terms of service in specified language"""
    if lang not in TERMS_OF_SERVICE["content"]:
        lang = "en"
    
    return {
        "version": TERMS_OF_SERVICE["version"],
        "effective_date": TERMS_OF_SERVICE["effective_date"],
        "content": TERMS_OF_SERVICE["content"][lang]
    }

@router.post("/consent")
async def record_consent(
    request: Request,
    privacy_version: str = "1.0",
    terms_version: str = "1.0",
    marketing_consent: bool = False,
    analytics_consent: bool = False,
    user: dict = Depends(get_current_user)
):
    """Record user consent for GDPR compliance"""
    db = await get_database()
    
    consent = GDPRConsent(
        user_id=user["user_id"],
        privacy_policy_version=privacy_version,
        terms_of_service_version=terms_version,
        consent_date=datetime.utcnow(),
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent", ""),
        marketing_consent=marketing_consent,
        analytics_consent=analytics_consent
    )
    
    # Store consent record
    await db.gdpr_consents.insert_one(consent.dict())
    
    return {"message": "Consent recorded successfully", "consent_id": str(consent.consent_date)}

@router.get("/my-data")
async def get_user_data(user: dict = Depends(get_current_user)):
    """Get all user data for GDPR data access request"""
    db = await get_database()
    
    # Collect all user data
    user_data = {
        "user_info": await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0}),
        "progress": await db.user_progress.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(length=None),
        "personal_files": await db.personal_files.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(length=None),
        "subscriptions": await db.subscriptions.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(length=None),
        "payment_history": await db.payment_transactions.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(length=None),
        "gdpr_consents": await db.gdpr_consents.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(length=None),
        "audit_logs": await db.audit_logs.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(length=None)
    }
    
    return user_data

@router.post("/export-data")
async def request_data_export(user: dict = Depends(get_current_user)):
    """Request complete data export (GDPR Article 20)"""
    db = await get_database()
    
    # Check for existing pending requests
    existing = await db.data_export_requests.find_one({
        "user_id": user["user_id"],
        "status": {"$in": ["pending", "processing"]}
    })
    
    if existing:
        return {"message": "Export request already in progress", "request_id": existing["_id"]}
    
    # Create new export request
    export_request = DataExportRequest(
        user_id=user["user_id"],
        request_date=datetime.utcnow(),
        status="pending"
    )
    
    result = await db.data_export_requests.insert_one(export_request.dict())
    
    # In a real app, you'd trigger an async job to prepare the export
    # For now, we'll simulate immediate processing
    user_data = await get_user_data(user)
    
    # Create ZIP file with all user data
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w') as zip_file:
        zip_file.writestr("user_data.json", json.dumps(user_data, indent=2, default=str))
        zip_file.writestr("readme.txt", "This is your complete data export as per GDPR Article 20.")
    
    # In production, upload to secure storage and provide download link
    # For now, we'll mark as completed
    await db.data_export_requests.update_one(
        {"_id": result.inserted_id},
        {
            "$set": {
                "status": "completed",
                "export_url": f"/api/gdpr/download-export/{result.inserted_id}",
                "expiry_date": datetime.utcnow() + timedelta(days=7)
            }
        }
    )
    
    return {
        "message": "Data export prepared successfully",
        "request_id": str(result.inserted_id),
        "download_url": f"/api/gdpr/download-export/{result.inserted_id}",
        "expires_in": "7 days"
    }

@router.post("/delete-account")
async def request_account_deletion(
    reason: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    """Request account deletion (GDPR Article 17 - Right to be forgotten)"""
    db = await get_database()
    
    # Check for existing deletion request
    existing = await db.data_deletion_requests.find_one({
        "user_id": user["user_id"],
        "status": {"$in": ["pending", "processing"]}
    })
    
    if existing:
        return {"message": "Deletion request already in progress"}
    
    # Create deletion request
    deletion_request = DataDeletionRequest(
        user_id=user["user_id"],
        request_date=datetime.utcnow(),
        status="pending",
        reason=reason
    )
    
    await db.data_deletion_requests.insert_one(deletion_request.dict())
    
    return {
        "message": "Account deletion requested successfully",
        "notice": "Your account will be deleted within 30 days as per GDPR requirements. You can cancel this request within 7 days."
    }

@router.get("/privacy-settings")
async def get_privacy_settings(user: dict = Depends(get_current_user)):
    """Get user's privacy settings"""
    db = await get_database()
    
    settings = await db.privacy_settings.find_one({"user_id": user["user_id"]})
    if not settings:
        # Create default settings
        default_settings = PrivacySettings(user_id=user["user_id"])
        await db.privacy_settings.insert_one(default_settings.dict())
        return default_settings.dict()
    
    return settings

@router.put("/privacy-settings")
async def update_privacy_settings(
    settings: PrivacySettings,
    user: dict = Depends(get_current_user)
):
    """Update user's privacy settings"""
    db = await get_database()
    
    settings.user_id = user["user_id"]
    
    await db.privacy_settings.update_one(
        {"user_id": user["user_id"]},
        {"$set": settings.dict()},
        upsert=True
    )
    
    return {"message": "Privacy settings updated successfully"}

@router.get("/consent-history")
async def get_consent_history(user: dict = Depends(get_current_user)):
    """Get user's consent history"""
    db = await get_database()
    
    consents = await db.gdpr_consents.find(
        {"user_id": user["user_id"]},
        {"_id": 0}
    ).sort("consent_date", -1).to_list(length=10)
    
    return {"consents": consents}

# Webhook for data retention cleanup (run daily)
@router.post("/cleanup-expired-data")
async def cleanup_expired_data():
    """Clean up expired data according to retention policies"""
    db = await get_database()
    
    # Delete old export requests (older than 7 days)
    cutoff_date = datetime.utcnow() - timedelta(days=7)
    await db.data_export_requests.delete_many({
        "expiry_date": {"$lt": cutoff_date}
    })
    
    # Process pending deletion requests (older than 30 days)
    deletion_cutoff = datetime.utcnow() - timedelta(days=30)
    pending_deletions = await db.data_deletion_requests.find({
        "request_date": {"$lt": deletion_cutoff},
        "status": "pending"
    }).to_list(length=None)
    
    for deletion in pending_deletions:
        user_id = deletion["user_id"]
        
        # Delete all user data
        await db.users.delete_one({"user_id": user_id})
        await db.user_progress.delete_many({"user_id": user_id})
        await db.personal_files.delete_many({"user_id": user_id})
        await db.subscriptions.delete_many({"user_id": user_id})
        await db.payment_transactions.delete_many({"user_id": user_id})
        await db.gdpr_consents.delete_many({"user_id": user_id})
        await db.privacy_settings.delete_many({"user_id": user_id})
        await db.audit_logs.delete_many({"user_id": user_id})
        
        # Mark deletion as completed
        await db.data_deletion_requests.update_one(
            {"_id": deletion["_id"]},
            {
                "$set": {
                    "status": "completed",
                    "deletion_date": datetime.utcnow()
                }
            }
        )
    
    return {"message": f"Cleaned up expired data. Processed {len(pending_deletions)} deletions."}

# Legal disclaimers endpoint
@router.get("/disclaimers")
async def get_legal_disclaimers():
    """Get legal disclaimers and liability limitations"""
    return {
        "disclaimers": {
            "medical_advice": "This application does not provide medical advice. Always consult with qualified healthcare professionals.",
            "legal_advice": "This application does not provide legal advice. Consult with qualified legal professionals for legal matters.",
            "accuracy": "Information provided may be outdated, incomplete, or incorrect. Users must verify all information independently.",
            "liability": "The application operator assumes no liability for decisions made based on application content.",
            "no_guarantees": "No warranties or guarantees are provided regarding the accuracy, completeness, or usefulness of information.",
            "refund_policy": "Subscription payments are generally non-refundable except as required by applicable law.",
            "service_availability": "Service availability is not guaranteed and may be interrupted or discontinued.",
            "data_security": "While we implement security measures, no system is 100% secure. Users acknowledge data breach risks."
        },
        "limitations": {
            "jurisdictions": "Information may not be applicable in all jurisdictions. Check local requirements.",
            "regulatory_changes": "Medical licensing requirements may change. Always verify current requirements with official sources.",
            "individual_circumstances": "Individual circumstances may affect applicability of general information provided.",
            "third_party_content": "Third-party content and links are not endorsed and may contain inaccurate information."
        }
    }