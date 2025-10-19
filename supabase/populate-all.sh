#!/bin/bash

# HeroSchool Database Population Script
# This script applies all schemas and populates the database with seed data

echo "=================================="
echo "HeroSchool Database Setup"
echo "=================================="

# Check if we're in the right directory
if [ ! -f "supabase/schema.sql" ]; then
    echo "Error: Please run this script from the project root directory"
    exit 1
fi

echo ""
echo "Step 1: Applying main schema..."
supabase db push --db-url "$(supabase status | grep 'DB URL' | awk '{print $3}')" < supabase/schema.sql 2>&1

echo ""
echo "Step 2: Applying dashboard schema..."
supabase db push --db-url "$(supabase status | grep 'DB URL' | awk '{print $3}')" < supabase/dashboard-schema.sql 2>&1

echo ""
echo "Step 3: Applying enhanced dashboard schema..."
supabase db push --db-url "$(supabase status | grep 'DB URL' | awk '{print $3}')" < supabase/enhanced-dashboard-schema.sql 2>&1

echo ""
echo "Step 4: Populating with seed data..."
supabase db push --db-url "$(supabase status | grep 'DB URL' | awk '{print $3}')" < supabase/seed-data.sql 2>&1

echo ""
echo "=================================="
echo "Database setup complete!"
echo "=================================="
echo ""
echo "You can now:"
echo "1. Login as student: emma@student.com / student123"
echo "2. Login as teacher: donald@heroschool.com / teacher123"
echo "3. Login as admin: admin@heroschool.com / admin123"
echo ""
