#!/bin/bash
#
# Cron script for running signal processor
#
# Add to crontab with: crontab -e
# Run every 5 minutes: */5 * * * * /path/to/cron-signals.sh
#
# Or run every 5 minutes during market hours only (9:30 AM - 4:00 PM ET):
# */5 9-16 * * 1-5 /path/to/cron-signals.sh
#

# Configuration
API_URL="${WEALTH_COUNCIL_URL:-http://localhost:3200}"
CRON_SECRET="${CRON_SECRET:-}"
LOG_FILE="${LOG_FILE:-/tmp/wealth-council-cron.log}"

# Timestamp for logging
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Build auth header if secret is set
AUTH_HEADER=""
if [ -n "$CRON_SECRET" ]; then
  AUTH_HEADER="-H \"Authorization: Bearer $CRON_SECRET\""
fi

# Call the cron endpoint
echo "[$TIMESTAMP] Running signal processor..." >> "$LOG_FILE"

RESPONSE=$(curl -s -w "\n%{http_code}" "$API_URL/api/cron/signals" $AUTH_HEADER)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
  SIGNALS=$(echo "$BODY" | grep -o '"signalsGenerated":[0-9]*' | cut -d':' -f2)
  echo "[$TIMESTAMP] Success - Generated $SIGNALS signals" >> "$LOG_FILE"
else
  echo "[$TIMESTAMP] Error - HTTP $HTTP_CODE: $BODY" >> "$LOG_FILE"
fi
