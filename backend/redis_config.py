"""
Redis configuration for rate limiting and caching.

This module provides Redis connection utilities and configuration
for the FSP Navigator application.
"""

import os
import redis.asyncio as redis
from typing import Optional
import logging

logger = logging.getLogger(__name__)

# Redis configuration
REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379')
REDIS_PASSWORD = os.environ.get('REDIS_PASSWORD')
REDIS_DB = int(os.environ.get('REDIS_DB', '0'))
REDIS_MAX_CONNECTIONS = int(os.environ.get('REDIS_MAX_CONNECTIONS', '10'))

# Rate limiting configuration
RATE_LIMIT_DEFAULT = os.environ.get('RATE_LIMIT_DEFAULT', '200 per day, 50 per hour')
RATE_LIMIT_LOGIN = os.environ.get('RATE_LIMIT_LOGIN', '10 per minute')
RATE_LIMIT_REGISTER = os.environ.get('RATE_LIMIT_REGISTER', '5 per hour')
RATE_LIMIT_UPLOAD = os.environ.get('RATE_LIMIT_UPLOAD', '20 per hour')
RATE_LIMIT_PASSWORD_RESET = os.environ.get('RATE_LIMIT_PASSWORD_RESET', '3 per hour')

async def get_redis_client() -> Optional[redis.Redis]:
    """
    Get Redis client with connection pooling and error handling.
    
    Returns:
        Redis client instance or None if connection fails
    """
    try:
        # Parse Redis URL
        if REDIS_PASSWORD:
            # If password is provided separately, construct URL
            redis_client = redis.from_url(
                REDIS_URL,
                password=REDIS_PASSWORD,
                db=REDIS_DB,
                max_connections=REDIS_MAX_CONNECTIONS,
                decode_responses=True,
                retry_on_timeout=True,
                socket_keepalive=True
            )
        else:
            # Use URL as-is (password may be in URL)
            redis_client = redis.from_url(
                REDIS_URL,
                db=REDIS_DB,
                max_connections=REDIS_MAX_CONNECTIONS,
                decode_responses=True,
                retry_on_timeout=True,
                socket_keepalive=True
            )
        
        # Test connection
        await redis_client.ping()
        logger.info("Redis connection established successfully")
        return redis_client
        
    except Exception as e:
        logger.error(f"Failed to connect to Redis: {e}")
        return None

async def test_redis_connection() -> bool:
    """
    Test Redis connection and return status.
    
    Returns:
        True if Redis is available, False otherwise
    """
    client = await get_redis_client()
    if client:
        try:
            await client.ping()
            await client.close()
            return True
        except Exception:
            return False
    return False

def get_rate_limit_config() -> dict:
    """
    Get rate limiting configuration.
    
    Returns:
        Dictionary with rate limit settings
    """
    return {
        'default': RATE_LIMIT_DEFAULT,
        'login': RATE_LIMIT_LOGIN,
        'register': RATE_LIMIT_REGISTER,
        'upload': RATE_LIMIT_UPLOAD,
        'password_reset': RATE_LIMIT_PASSWORD_RESET
    }

# Health check function
async def redis_health_check() -> dict:
    """
    Perform Redis health check.
    
    Returns:
        Dictionary with Redis health status
    """
    try:
        client = await get_redis_client()
        if client:
            await client.ping()
            info = await client.info()
            await client.close()
            
            return {
                'status': 'healthy',
                'version': info.get('redis_version', 'unknown'),
                'connected_clients': info.get('connected_clients', 0),
                'used_memory_human': info.get('used_memory_human', 'unknown'),
                'uptime_in_seconds': info.get('uptime_in_seconds', 0)
            }
        else:
            return {
                'status': 'unavailable',
                'error': 'Failed to connect to Redis'
            }
    except Exception as e:
        return {
            'status': 'error',
            'error': str(e)
        }