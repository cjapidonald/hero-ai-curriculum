#!/bin/bash

# Apply schemas to Supabase database
# Usage: ./apply-schemas.sh [DATABASE_URL]

set -e

PROJECT_ID="mqlihjzdfkhaomehxbye"
SUPABASE_URL="https://${PROJECT_ID}.supabase.co"

echo "🚀 Applying HeroSchool Database Schemas to Supabase"
echo "=================================================="
echo ""

# Check if DATABASE_URL is provided
if [ -z "$1" ]; then
  echo "⚠️  Database URL not provided."
  echo ""
  echo "To apply schemas, you have two options:"
  echo ""
  echo "Option 1: Use Supabase Dashboard (Recommended)"
  echo "-----------------------------------------------"
  echo "1. Go to: https://supabase.com/dashboard/project/${PROJECT_ID}/sql"
  echo "2. Click 'New Query'"
  echo "3. Copy and paste the contents of 'schema.sql'"
  echo "4. Click 'Run' or press Cmd+Enter"
  echo "5. Repeat steps 2-4 with 'dashboard-schema.sql'"
  echo ""
  echo "Option 2: Use this script with DATABASE_URL"
  echo "-------------------------------------------"
  echo "Get your database connection string from:"
  echo "https://supabase.com/dashboard/project/${PROJECT_ID}/settings/database"
  echo ""
  echo "Then run:"
  echo "./supabase/apply-schemas.sh 'postgresql://postgres:[YOUR-PASSWORD]@db.${PROJECT_ID}.supabase.co:5432/postgres'"
  echo ""
  exit 1
fi

DATABASE_URL="$1"

echo "✅ Database URL provided"
echo "📄 Applying schema.sql..."

# Apply main schema
if psql "$DATABASE_URL" -f "$(dirname "$0")/schema.sql" > /dev/null 2>&1; then
  echo "✅ schema.sql applied successfully"
else
  echo "❌ Error applying schema.sql"
  echo "Please check the error above and ensure:"
  echo "  - Your database URL is correct"
  echo "  - You have the necessary permissions"
  echo "  - psql is installed (brew install postgresql)"
  exit 1
fi

echo "📄 Applying dashboard-schema.sql..."

# Apply dashboard schema
if psql "$DATABASE_URL" -f "$(dirname "$0")/dashboard-schema.sql" > /dev/null 2>&1; then
  echo "✅ dashboard-schema.sql applied successfully"
else
  echo "❌ Error applying dashboard-schema.sql"
  exit 1
fi

echo ""
echo "🎉 All schemas applied successfully!"
echo ""
echo "Next steps:"
echo "1. Generate TypeScript types: npm run typegen"
echo "2. Check your tables at: ${SUPABASE_URL}/project/${PROJECT_ID}/editor"
