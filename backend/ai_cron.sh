#!/bin/bash

# AI Analysis Cron Job
# Runs every hour to process new regulatory updates

# Set environment
cd /app/backend
source /root/.venv/bin/activate

# Run the AI processor
echo "========================================="
echo "AI Analysis Cron Job - $(date)"
echo "========================================="

python ai_processor.py >> /var/log/ai_analysis.log 2>&1

echo "Completed at $(date)"
echo ""
