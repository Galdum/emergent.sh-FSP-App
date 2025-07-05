from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from typing import List, Optional
from datetime import datetime, timedelta
import logging
from motor.motor_asyncio import AsyncIOMotorClient
import os

from ..models import (
    GameResult, GameResultCreate, GameResultResponse, ClinicalCase, 
    FachbegriffTerm, UserGameStats, Leaderboard, GameType
)
from ..auth import get_current_user, UserInDB

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()
security = HTTPBearer()

# MongoDB connection - consistent with main app configuration
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "fsp_navigator")
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# Collections
game_results_collection = db.game_results
clinical_cases_collection = db.clinical_cases
fachbegriffe_collection = db.fachbegriffe_terms
user_game_stats_collection = db.user_game_stats

@router.post("/game-result", response_model=GameResultResponse)
async def save_game_result(
    game_result: GameResultCreate,
    current_user: UserInDB = Depends(get_current_user)
):
    """Save a game result and update user statistics."""
    try:
        # Create game result
        result = GameResult(
            user_id=current_user.id,
            **game_result.dict()
        )
        
        # Insert into database
        result_dict = result.dict()
        result_dict['created_at'] = result_dict['created_at'].isoformat()
        
        await game_results_collection.insert_one(result_dict)
        
        # Update user game statistics
        await update_user_game_stats(current_user.id, result)
        
        logger.info(f"Game result saved for user {current_user.id}: {game_result.game_type} - {game_result.score}%")
        
        return GameResultResponse(**result.dict())
        
    except Exception as e:
        logger.error(f"Error saving game result: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error saving game result: {str(e)}"
        )

@router.get("/game-results", response_model=List[GameResultResponse])
async def get_user_game_results(
    game_type: Optional[GameType] = None,
    limit: int = 20,
    current_user: UserInDB = Depends(get_current_user)
):
    """Get user's game results with optional filtering."""
    try:
        query = {"user_id": current_user.id}
        if game_type:
            query["game_type"] = game_type.value
        
        cursor = game_results_collection.find(query).sort("created_at", -1).limit(limit)
        results = await cursor.to_list(length=limit)
        
        game_results = []
        for result in results:
            result['created_at'] = datetime.fromisoformat(result['created_at'])
            game_results.append(GameResultResponse(**result))
        
        return game_results
        
    except Exception as e:
        logger.error(f"Error fetching game results: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching game results: {str(e)}"
        )

@router.get("/game-stats", response_model=UserGameStats)
async def get_user_game_stats(
    current_user: UserInDB = Depends(get_current_user)
):
    """Get user's game statistics."""
    try:
        stats = await user_game_stats_collection.find_one({"user_id": current_user.id})
        
        if not stats:
            # Create initial stats
            stats = UserGameStats(user_id=current_user.id)
            stats_dict = stats.dict()
            stats_dict['created_at'] = stats_dict['created_at'].isoformat()
            stats_dict['updated_at'] = stats_dict['updated_at'].isoformat()
            await user_game_stats_collection.insert_one(stats_dict)
        else:
            stats['created_at'] = datetime.fromisoformat(stats['created_at'])
            stats['updated_at'] = datetime.fromisoformat(stats['updated_at'])
            stats = UserGameStats(**stats)
        
        return stats
        
    except Exception as e:
        logger.error(f"Error fetching game stats: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching game stats: {str(e)}"
        )

@router.get("/leaderboard", response_model=List[Leaderboard])
async def get_leaderboard(
    game_type: GameType,
    limit: int = 10,
    current_user: UserInDB = Depends(get_current_user)
):
    """Get leaderboard for a specific game type."""
    try:
        # Aggregate pipeline to get top users
        pipeline = [
            {"$match": {"game_type": game_type.value}},
            {"$group": {
                "_id": "$user_id",
                "best_score": {"$max": "$score"},
                "total_games": {"$sum": 1},
                "avg_score": {"$avg": "$score"}
            }},
            {"$sort": {"best_score": -1, "avg_score": -1}},
            {"$limit": limit}
        ]
        
        cursor = game_results_collection.aggregate(pipeline)
        results = await cursor.to_list(length=limit)
        
        leaderboard = []
        for i, result in enumerate(results, 1):
            # Get user name (simplified - in real implementation, you'd join with users collection)
            user_name = f"User {result['_id'][:8]}"  # Simplified display
            
            leaderboard.append(Leaderboard(
                rank=i,
                user_id=result['_id'],
                user_name=user_name,
                score=result['best_score'],
                games_played=result['total_games'],
                game_type=game_type
            ))
        
        return leaderboard
        
    except Exception as e:
        logger.error(f"Error fetching leaderboard: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching leaderboard: {str(e)}"
        )

@router.get("/clinical-cases", response_model=List[ClinicalCase])
async def get_clinical_cases(
    category: Optional[str] = None,
    difficulty: Optional[str] = None,
    limit: int = 10,
    current_user: UserInDB = Depends(get_current_user)
):
    """Get clinical cases for the mini-game."""
    try:
        query = {"is_active": True}
        if category:
            query["category"] = category
        if difficulty:
            query["difficulty"] = difficulty
        
        cursor = clinical_cases_collection.find(query).limit(limit)
        cases = await cursor.to_list(length=limit)
        
        clinical_cases = []
        for case in cases:
            case['created_at'] = datetime.fromisoformat(case['created_at'])
            case['updated_at'] = datetime.fromisoformat(case['updated_at'])
            clinical_cases.append(ClinicalCase(**case))
        
        return clinical_cases
        
    except Exception as e:
        logger.error(f"Error fetching clinical cases: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching clinical cases: {str(e)}"
        )

@router.get("/fachbegriffe", response_model=List[FachbegriffTerm])
async def get_fachbegriffe_terms(
    category: Optional[str] = None,
    difficulty: Optional[str] = None,
    limit: int = 20,
    current_user: UserInDB = Depends(get_current_user)
):
    """Get Fachbegriffe terms for the mini-game."""
    try:
        query = {"is_active": True}
        if category:
            query["category"] = category
        if difficulty:
            query["difficulty"] = difficulty
        
        cursor = fachbegriffe_collection.find(query).limit(limit)
        terms = await cursor.to_list(length=limit)
        
        fachbegriffe_terms = []
        for term in terms:
            term['created_at'] = datetime.fromisoformat(term['created_at'])
            term['updated_at'] = datetime.fromisoformat(term['updated_at'])
            fachbegriffe_terms.append(FachbegriffTerm(**term))
        
        return fachbegriffe_terms
        
    except Exception as e:
        logger.error(f"Error fetching fachbegriffe terms: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching fachbegriffe terms: {str(e)}"
        )

async def update_user_game_stats(user_id: str, game_result: GameResult):
    """Update user game statistics after a game."""
    try:
        # Get current stats
        current_stats = await user_game_stats_collection.find_one({"user_id": user_id})
        
        if not current_stats:
            # Create new stats
            stats = UserGameStats(user_id=user_id)
            current_stats = stats.dict()
            current_stats['created_at'] = current_stats['created_at'].isoformat()
            current_stats['updated_at'] = current_stats['updated_at'].isoformat()
            await user_game_stats_collection.insert_one(current_stats)
        
        # Update stats based on game type
        update_data = {
            "total_games_played": current_stats.get("total_games_played", 0) + 1,
            "total_time_spent_seconds": current_stats.get("total_time_spent_seconds", 0) + game_result.time_spent_seconds,
            "updated_at": datetime.utcnow().isoformat()
        }
        
        if game_result.game_type == GameType.CLINICAL_CASES:
            update_data.update({
                "clinical_cases_played": current_stats.get("clinical_cases_played", 0) + 1,
                "clinical_cases_best_score": max(current_stats.get("clinical_cases_best_score", 0), game_result.score),
                "clinical_cases_total_score": current_stats.get("clinical_cases_total_score", 0) + game_result.score,
            })
            # Calculate average
            games_played = update_data["clinical_cases_played"]
            total_score = update_data["clinical_cases_total_score"]
            update_data["clinical_cases_average_score"] = total_score / games_played if games_played > 0 else 0
            
        elif game_result.game_type == GameType.FACHBEGRIFFE:
            update_data.update({
                "fachbegriffe_played": current_stats.get("fachbegriffe_played", 0) + 1,
                "fachbegriffe_best_score": max(current_stats.get("fachbegriffe_best_score", 0), game_result.score),
                "fachbegriffe_total_score": current_stats.get("fachbegriffe_total_score", 0) + game_result.score,
                "fachbegriffe_best_streak": max(current_stats.get("fachbegriffe_best_streak", 0), game_result.streak or 0),
            })
            # Calculate average
            games_played = update_data["fachbegriffe_played"]
            total_score = update_data["fachbegriffe_total_score"]
            update_data["fachbegriffe_average_score"] = total_score / games_played if games_played > 0 else 0
        
        # Update in database
        await user_game_stats_collection.update_one(
            {"user_id": user_id},
            {"$set": update_data},
            upsert=True
        )
        
        logger.info(f"Updated game stats for user {user_id}")
        
    except Exception as e:
        logger.error(f"Error updating user game stats: {str(e)}")
        # Don't raise exception as this shouldn't block the main operation

@router.post("/initialize-sample-data")
async def initialize_sample_data(
    current_user: UserInDB = Depends(get_current_user)
):
    """Initialize sample data for mini-games (admin only)."""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can initialize sample data"
        )
    
    try:
        # Sample clinical cases
        sample_clinical_cases = [
            {
                "id": "case_1",
                "title": "Akute Dyspnoe",
                "patient_info": {
                    "name": "Herr Müller",
                    "age": 68,
                    "gender": "männlich",
                    "chief_complaint": "Atemnot seit 2 Stunden"
                },
                "phases": {
                    "anamnese": {
                        "question": "Führen Sie eine gezielte Anamnese durch. Was fragen Sie den Patienten?",
                        "options": [
                            "Haben Sie Schmerzen in der Brust?",
                            "Wann haben Sie das letzte Mal gegessen?",
                            "Nehmen Sie regelmäßig Medikamente ein?",
                            "Hatten Sie schon einmal ähnliche Beschwerden?"
                        ],
                        "correct": [0, 2, 3],
                        "patientResponses": {
                            "0": "Ja, ich habe drückende Schmerzen hinter dem Brustbein, die bis in den linken Arm ausstrahlen.",
                            "2": "Ich nehme täglich Ramipril 5mg und Metformin 500mg.",
                            "3": "Vor einem Jahr hatte ich einen Herzinfarkt. Seitdem war ich eigentlich beschwerdefrei."
                        }
                    },
                    "diagnosis": {
                        "question": "Aufgrund der Anamnese: Welche Verdachtsdiagnose stellen Sie?",
                        "options": [
                            "Akutes Koronarsyndrom",
                            "Lungenembolie",
                            "Pneumothorax",
                            "Asthma bronchiale"
                        ],
                        "correct": [0],
                        "explanation": "Die Kombination aus Dyspnoe, retrosternalen Schmerzen mit Ausstrahlung und der Anamnese eines früheren Herzinfarkts sprechen für ein akutes Koronarsyndrom."
                    },
                    "therapy": {
                        "question": "Welche Sofortmaßnahmen leiten Sie ein?",
                        "options": [
                            "O2-Gabe über Nasensonde",
                            "EKG schreiben",
                            "Venöser Zugang und Blutentnahme",
                            "Alle genannten Maßnahmen"
                        ],
                        "correct": [3],
                        "explanation": "Bei Verdacht auf akutes Koronarsyndrom sind alle genannten Maßnahmen indiziert: O2-Gabe, EKG-Diagnostik und Labordiagnostik."
                    }
                },
                "difficulty": "medium",
                "category": "cardiology",
                "created_by": current_user.id,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat(),
                "is_active": True
            }
        ]
        
        # Sample Fachbegriffe
        sample_fachbegriffe = [
            {
                "id": "term_1",
                "fachsprache": "Myokardinfarkt",
                "umgangssprache": "Herzinfarkt",
                "category": "anatomy",
                "options": ["Herzinfarkt", "Herzrhythmusstörung", "Herzinsuffizienz", "Herzklappendefekt"],
                "explanation": "Der Myokardinfarkt ist der medizinische Fachbegriff für den umgangssprachlichen Herzinfarkt - das Absterben von Herzmuskelgewebe.",
                "difficulty": "medium",
                "created_by": current_user.id,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat(),
                "is_active": True
            },
            {
                "id": "term_2",
                "fachsprache": "Dyspnoe",
                "umgangssprache": "Atemnot",
                "category": "symptoms",
                "options": ["Atemnot", "Husten", "Brustschmerzen", "Herzrasen"],
                "explanation": "Dyspnoe bezeichnet medizinisch die subjektiv empfundene Atemnot oder Luftnot.",
                "difficulty": "easy",
                "created_by": current_user.id,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat(),
                "is_active": True
            }
        ]
        
        # Insert sample data
        for case in sample_clinical_cases:
            await clinical_cases_collection.update_one(
                {"id": case["id"]},
                {"$set": case},
                upsert=True
            )
        
        for term in sample_fachbegriffe:
            await fachbegriffe_collection.update_one(
                {"id": term["id"]},
                {"$set": term},
                upsert=True
            )
        
        return {"message": "Sample data initialized successfully"}
        
    except Exception as e:
        logger.error(f"Error initializing sample data: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error initializing sample data: {str(e)}"
        )