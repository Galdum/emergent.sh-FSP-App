#!/bin/bash
"""
Setup cron jobs for automated tasks
"""

echo "Setting up cron jobs for Medical Licensing Guide Application..."

# Create logs directory
mkdir -p /app/logs

# Create cron job for daily backups at 2 AM
echo "0 2 * * * cd /app && python3 scripts/daily_backup.py >> /app/logs/cron.log 2>&1" > /tmp/crontab

# Create cron job for weekly cleanup at 3 AM on Sundays
echo "0 3 * * 0 cd /app && python3 scripts/weekly_maintenance.py >> /app/logs/cron.log 2>&1" >> /tmp/crontab

# Install cron jobs
crontab /tmp/crontab

# Verify installation
echo "Installed cron jobs:"
crontab -l

echo "Cron jobs setup complete!"
echo "Logs will be written to /app/logs/"
echo ""
echo "Manual backup: python3 /app/scripts/daily_backup.py"
echo "Check status: tail -f /app/logs/backup.log"