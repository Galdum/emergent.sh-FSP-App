# Rate Limiting Implementation

## Overview

The FSP Navigator API now uses **slowapi** with **Redis** for distributed rate limiting across multiple server instances. This replaces the previous in-memory rate limiting that was vulnerable to multi-instance attacks.

## Architecture

### Components

1. **slowapi**: FastAPI-compatible rate limiting library
2. **Redis**: Distributed storage for rate limit counters
3. **Rate Limit Decorators**: Applied to sensitive endpoints
4. **Exception Handler**: Custom error responses for rate limit violations

### Key Benefits

- ✅ **Distributed**: Works across multiple server instances
- ✅ **Persistent**: Rate limits survive server restarts
- ✅ **Configurable**: Environment-based rate limit settings
- ✅ **Secure**: Prevents IP rotation attacks
- ✅ **Memory Efficient**: No in-memory storage growth

## Configuration

### Environment Variables

```bash
# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your-redis-password
REDIS_DB=0
REDIS_MAX_CONNECTIONS=10

# Rate Limiting Limits
RATE_LIMIT_DEFAULT=200 per day, 50 per hour
RATE_LIMIT_LOGIN=10 per minute
RATE_LIMIT_REGISTER=5 per hour
RATE_LIMIT_UPLOAD=20 per hour
RATE_LIMIT_PASSWORD_RESET=3 per hour
```

### Rate Limit Syntax

slowapi uses a simple syntax for defining limits:
- `"10 per minute"` - 10 requests per minute
- `"100 per hour"` - 100 requests per hour
- `"1000 per day"` - 1000 requests per day
- `"200 per day, 50 per hour"` - Multiple limits (most restrictive applies)

## Protected Endpoints

| Endpoint | Rate Limit | Purpose |
|----------|------------|---------|
| `POST /api/auth/register` | 5 per hour | Prevent spam registrations |
| `POST /api/auth/login` | 10 per minute | Prevent brute force attacks |
| `POST /api/auth/forgot-password` | 3 per hour | Prevent password reset spam |
| `POST /api/files/upload` | 20 per hour | Prevent storage abuse |

## Implementation Details

### 1. Redis Integration

```python
# backend/security.py
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(
    key_func=get_remote_address,  # Use IP address as key
    storage_uri=redis_url,        # Redis storage
    default_limits=["200 per day", "50 per hour"]
)
```

### 2. Endpoint Protection

```python
@router.post("/login")
@limiter.limit("10 per minute")
async def login(request: Request, ...):
    # Endpoint logic
    pass
```

### 3. Error Handling

```python
def rate_limit_exceeded_handler(request, exc):
    return {
        "error": "Rate limit exceeded",
        "detail": "Too many requests. Please try again later.",
        "retry_after": exc.retry_after
    }
```

## Setup Instructions

### 1. Install Redis

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

**macOS:**
```bash
brew install redis
brew services start redis
```

**Docker:**
```bash
docker run -d --name redis -p 6379:6379 redis:alpine
```

### 2. Configure Environment

Copy `.env.example` to `.env` and update Redis settings:

```bash
cp .env.example .env
# Edit .env with your Redis configuration
```

### 3. Test Connection

```bash
# Test Redis connection
redis-cli ping
# Should return: PONG
```

### 4. Verify Rate Limiting

```bash
# Test rate limiting (replace with your API URL)
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}'

# After hitting the limit, you should get:
# {"error": "Rate limit exceeded", "detail": "Too many requests..."}
```

## Monitoring

### Health Check

The `/api/deployment/status` endpoint now includes Redis status:

```json
{
  "status": "healthy",
  "services": {
    "redis": "running",
    "database": "running",
    "backend": "running"
  }
}
```

### Redis Health

```python
from backend.redis_config import redis_health_check

status = await redis_health_check()
# Returns Redis version, memory usage, connected clients, etc.
```

## Fallback Behavior

If Redis is unavailable, the system will:

1. Log a warning message
2. Continue operating without rate limiting
3. Show Redis as "unavailable" in health checks

This ensures the application remains functional even if Redis is down.

## Security Considerations

### IP Address Handling

- Uses `get_remote_address` from slowapi
- Handles proxy headers automatically
- Supports IPv4 and IPv6 addresses

### Rate Limit Bypass Prevention

- Redis-based storage prevents IP rotation attacks
- Consistent limits across all server instances
- No in-memory storage that can be bypassed

### Configuration Security

- Rate limits are environment-configurable
- No hardcoded limits in application code
- Separate Redis database for isolation

## Troubleshooting

### Common Issues

1. **Redis Connection Failed**
   - Check Redis server is running
   - Verify REDIS_URL in environment
   - Check firewall settings

2. **Rate Limits Not Working**
   - Ensure slowapi is properly imported
   - Check decorators are applied to endpoints
   - Verify Redis connection

3. **Performance Issues**
   - Monitor Redis memory usage
   - Check connection pool settings
   - Consider Redis clustering for high load

### Debug Commands

```bash
# Check Redis info
redis-cli info

# Monitor Redis commands
redis-cli monitor

# Check rate limit keys
redis-cli keys "*slowapi*"
```

## Migration from Old System

The old in-memory `RateLimiter` class is still available for backward compatibility but is deprecated. It will show warnings when used.

To migrate:

1. ✅ **Already Done**: Replace custom middleware with slowapi
2. ✅ **Already Done**: Add Redis configuration
3. ✅ **Already Done**: Apply decorators to sensitive endpoints
4. ✅ **Already Done**: Update health checks

## Performance Impact

- **Minimal overhead**: Redis operations are fast
- **Connection pooling**: Reuses Redis connections
- **Async operations**: Non-blocking rate limit checks
- **Memory efficient**: No application memory growth

## Future Enhancements

- [ ] User-based rate limiting (in addition to IP-based)
- [ ] Dynamic rate limit adjustment based on user tier
- [ ] Rate limit analytics and monitoring
- [ ] Integration with security monitoring systems