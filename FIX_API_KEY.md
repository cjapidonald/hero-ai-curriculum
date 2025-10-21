# Fix API Key Issue

## Problem
The `VITE_SUPABASE_PUBLISHABLE_KEY` in your `.env` file is malformed, causing authentication failures.

## Solution

### Get the Correct API Key

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/mqlihjzdfkhaomehxbye

2. Navigate to: **Settings** → **API**

3. Find the **Project API keys** section

4. Copy the **`anon` `public`** key (NOT the service_role key)

5. Replace the `VITE_SUPABASE_PUBLISHABLE_KEY` in your `.env` file with the correct key

### Expected .env Format

```env
VITE_SUPABASE_PROJECT_ID="mqlihjzdfkhaomehxbye"
VITE_SUPABASE_PUBLISHABLE_KEY="[paste your anon public key here]"
VITE_SUPABASE_URL="https://mqlihjzdfkhaomehxbye.supabase.co"
```

## After Fixing

Once you've updated the `.env` file with the correct API key, restart your development server:

```bash
npm run dev
```

## Demo Credentials

After fixing the API key, you should be able to log in with these credentials:

**Admin:**
- Email: admin@heroschool.com
- Password: admin123

**Teacher:**
- Email/Username: donald@heroschool.com or donald
- Password: teacher123

**Student:**
- Email: emma@student.com
- Password: student123
