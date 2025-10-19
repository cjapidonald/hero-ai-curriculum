#!/bin/bash

# Script to apply database migrations to Supabase
# Run this after setting up your Supabase connection

echo "========================================="
echo "Applying HeroSchool Database Migrations"
echo "========================================="

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Error: Supabase CLI is not installed"
    echo "Install it with: npm install -g supabase"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "supabase/migrations/20250119_enhanced_schema.sql" ]; then
    echo "Error: Migration file not found. Make sure you're in the project root directory."
    exit 1
fi

echo ""
echo "Step 1: Applying enhanced schema migration..."
echo "This will:"
echo "  - Add username, classes, and rate fields to teachers table"
echo "  - Create resources table for lesson planner"
echo "  - Create classes table"
echo "  - Create skills_master table"
echo "  - Create attendance table"
echo "  - Add automatic triggers for session tracking and earnings"
echo ""

# Apply the migration
supabase db push

if [ $? -eq 0 ]; then
    echo "✅ Enhanced schema migration applied successfully!"
else
    echo "❌ Error applying migration. Please check your Supabase connection."
    exit 1
fi

echo ""
echo "Step 2: Setting up storage buckets..."
echo "Note: Storage buckets need to be created via Supabase Dashboard or CLI"
echo "Required buckets:"
echo "  - curriculum-resources (public, 50MB limit)"
echo "  - profile-images (public, 5MB limit)"
echo "  - student-work (private, 10MB limit)"
echo ""
echo "You can create these manually in the Supabase Dashboard under Storage."
echo "Or apply the storage-buckets.sql file manually."

echo ""
echo "========================================="
echo "Migration Complete!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Create storage buckets in Supabase Dashboard"
echo "2. Test the new Enhanced Lesson Planner"
echo "3. Add sample resources to the resource library"
echo ""
