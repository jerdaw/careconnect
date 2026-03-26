#!/bin/bash
# Check Vercel usage across all projects
# Run monthly to ensure staying within free tier

echo "=== Vercel Free Tier Limits ==="
echo "Bandwidth: 100GB/month"
echo "Function minutes: 6,000/month"
echo "Cron invocations: 1,000/month"
echo "Deployments: 100/day"
echo ""
echo "=== Current Project Stats ==="
echo "Cron schedule: Every 3 hours = 240/month (24% of limit)"
echo "API routes: 24 serverless functions"
echo ""
echo "Run 'vercel logs' to check actual usage"
echo "Visit: https://vercel.com/dashboard/usage"
