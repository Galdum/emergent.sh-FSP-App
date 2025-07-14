# Celery Deployment Guide for Backup Background Tasks

## Overview

This guide explains how to deploy the robust Celery-based backup solution that provides true asynchronous processing for database and files backups.

## Prerequisites

- Python 3.8+
- Redis server
- Celery 5.4.0+ (already in requirements.txt)

## Installation Steps

### 1. Install Redis

#### Ubuntu/Debian:
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

#### macOS:
```bash
brew install redis
brew services start redis
```

#### Docker:
```bash
docker run -d --name redis -p 6379:6379 redis:alpine
```

### 2. Install Python Dependencies

```bash
pip install celery[redis]>=5.4.0
```

### 3. Environment Configuration

Add these environment variables to your `.env` file:

```bash
# Celery Configuration
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# Optional: Celery Worker Configuration
CELERY_WORKER_CONCURRENCY=4
CELERY_WORKER_MAX_TASKS_PER_CHILD=1000
```

## Running Celery

### 1. Start Celery Worker

```bash
# From the backend directory
cd backend

# Start Celery worker
celery -A celery_app worker --loglevel=info --concurrency=4
```

### 2. Start Celery Beat (for scheduled tasks, optional)

```bash
# Start Celery beat scheduler
celery -A celery_app beat --loglevel=info
```

### 3. Monitor Celery

```bash
# Monitor Celery tasks
celery -A celery_app flower
```

## Docker Deployment

### Docker Compose Configuration

Add this to your `docker-compose.yml`:

```yaml
version: '3.8'

services:
  # ... existing services ...
  
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

  celery-worker:
    build: .
    command: celery -A backend.celery_app worker --loglevel=info --concurrency=4
    volumes:
      - .:/workspace
    environment:
      - CELERY_BROKER_URL=redis://redis:6379/0
      - CELERY_RESULT_BACKEND=redis://redis:6379/0
    depends_on:
      - redis
      - mongodb
    restart: unless-stopped

  celery-beat:
    build: .
    command: celery -A backend.celery_app beat --loglevel=info
    volumes:
      - .:/workspace
    environment:
      - CELERY_BROKER_URL=redis://redis:6379/0
      - CELERY_RESULT_BACKEND=redis://redis:6379/0
    depends_on:
      - redis
    restart: unless-stopped

  flower:
    build: .
    command: celery -A backend.celery_app flower --port=5555
    ports:
      - "5555:5555"
    environment:
      - CELERY_BROKER_URL=redis://redis:6379/0
      - CELERY_RESULT_BACKEND=redis://redis:6379/0
    depends_on:
      - redis
    restart: unless-stopped

volumes:
  redis_data:
```

### Dockerfile Updates

Ensure your Dockerfile includes Celery:

```dockerfile
# ... existing Dockerfile content ...

# Install Celery
RUN pip install celery[redis]>=5.4.0

# ... rest of Dockerfile ...
```

## Production Deployment

### 1. Systemd Service Files

Create `/etc/systemd/system/celery-worker.service`:

```ini
[Unit]
Description=Celery Worker Service
After=network.target

[Service]
Type=forking
User=www-data
Group=www-data
EnvironmentFile=/path/to/your/.env
WorkingDirectory=/path/to/your/backend
ExecStart=/bin/sh -c '${WorkingDirectory}/venv/bin/celery -A celery_app worker --loglevel=info --concurrency=4 --pidfile=/var/run/celery/worker.pid --logfile=/var/log/celery/worker.log'
ExecReload=/bin/kill -HUP $MAINPID
ExecStop=/bin/kill -TERM $MAINPID
Restart=always

[Install]
WantedBy=multi-user.target
```

Create `/etc/systemd/system/celery-beat.service`:

```ini
[Unit]
Description=Celery Beat Service
After=network.target

[Service]
Type=forking
User=www-data
Group=www-data
EnvironmentFile=/path/to/your/.env
WorkingDirectory=/path/to/your/backend
ExecStart=/bin/sh -c '${WorkingDirectory}/venv/bin/celery -A celery_app beat --loglevel=info --pidfile=/var/run/celery/beat.pid --logfile=/var/log/celery/beat.log'
ExecReload=/bin/kill -HUP $MAINPID
ExecStop=/bin/kill -TERM $MAINPID
Restart=always

[Install]
WantedBy=multi-user.target
```

### 2. Enable and Start Services

```bash
# Create log directories
sudo mkdir -p /var/log/celery
sudo mkdir -p /var/run/celery
sudo chown www-data:www-data /var/log/celery /var/run/celery

# Enable and start services
sudo systemctl enable celery-worker
sudo systemctl enable celery-beat
sudo systemctl start celery-worker
sudo systemctl start celery-beat

# Check status
sudo systemctl status celery-worker
sudo systemctl status celery-beat
```

## Monitoring and Logging

### 1. Log Files

- Worker logs: `/var/log/celery/worker.log`
- Beat logs: `/var/log/celery/beat.log`
- Application logs: Check your application logging configuration

### 2. Flower Monitoring

Access Flower web interface at `http://your-server:5555` to monitor:
- Task status and history
- Worker status
- Queue statistics
- Real-time task monitoring

### 3. Health Checks

Add health check endpoints to your FastAPI application:

```python
@router.get("/health/celery")
async def celery_health_check():
    """Check Celery worker status."""
    try:
        # Check if Celery workers are available
        inspect = celery_app.control.inspect()
        active_workers = inspect.active()
        
        if active_workers:
            return {"status": "healthy", "workers": len(active_workers)}
        else:
            return {"status": "unhealthy", "error": "No active workers"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}
```

## Troubleshooting

### Common Issues

1. **Redis Connection Error**:
   ```bash
   # Check Redis status
   sudo systemctl status redis
   
   # Test Redis connection
   redis-cli ping
   ```

2. **Celery Worker Not Starting**:
   ```bash
   # Check logs
   tail -f /var/log/celery/worker.log
   
   # Check permissions
   sudo chown -R www-data:www-data /var/log/celery /var/run/celery
   ```

3. **Tasks Not Executing**:
   ```bash
   # Check worker status
   celery -A backend.celery_app inspect active
   
   # Check queue status
   celery -A backend.celery_app inspect stats
   ```

### Performance Tuning

1. **Worker Concurrency**: Adjust based on CPU cores and workload
2. **Task Time Limits**: Set appropriate timeouts for backup operations
3. **Memory Management**: Monitor memory usage and adjust worker settings
4. **Queue Management**: Use separate queues for different task types

## Security Considerations

1. **Redis Security**:
   ```bash
   # Configure Redis authentication
   echo "requirepass your_strong_password" >> /etc/redis/redis.conf
   sudo systemctl restart redis
   ```

2. **Network Security**:
   - Use firewall rules to restrict Redis access
   - Consider using Redis over SSL/TLS
   - Bind Redis to localhost only in production

3. **Celery Security**:
   - Use strong broker passwords
   - Implement task result backend security
   - Monitor task execution logs

## Migration from Quick Fix

1. **Deploy Redis and Celery infrastructure**
2. **Update environment variables**
3. **Start Celery workers**
4. **Test new endpoints** (`/backup/database/celery`, etc.)
5. **Monitor performance and stability**
6. **Gradually migrate traffic to new endpoints**

## Backup Strategy

1. **Redis Persistence**: Configure Redis persistence for task results
2. **Database Backups**: Use the new Celery-based backup system
3. **Log Rotation**: Implement log rotation for Celery logs
4. **Monitoring**: Set up alerts for failed tasks and worker issues

This deployment guide provides a complete setup for the robust Celery-based backup solution, ensuring reliable and scalable background task processing.