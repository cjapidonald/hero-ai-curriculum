# Test Login Instructions

## Step 1: Make Sure Database is Set Up

**IMPORTANT:** Before testing login, you MUST run the database schemas in Supabase.

### Go to Supabase Dashboard:
1. Visit: https://supabase.com/dashboard/project/mqlihjzdfkhaomehxbye
2. Click "SQL Editor" in left sidebar
3. Click "New Query"

### Run These Scripts IN ORDER:

**First, run the base schema:**
```sql
-- Copy and paste entire contents of:
supabase/dashboard-schema.sql
-- Click "Run" or press Ctrl+Enter
```

**Second, run the sample data:**
```sql
-- Copy and paste entire contents of:
supabase/sample-data.sql
-- Click "Run" or press Ctrl+Enter
```

### Verify Tables Were Created:
1. Click "Table Editor" in left sidebar
2. You should see these tables:
   - teachers
   - dashboard_students
   - curriculum
   - assessment
   - skills_evaluation
   - homework_completion
   - blog_posts

## Step 2: Test the Login

### Navigate to Login Page:
http://localhost:8080/login

### Try Teacher Login:
```
Click the "Teacher" tab
Email: donald@heroschool.com
Password: teacher123
Click "Sign In"
```

### Try Student Login:
```
Click the "Student" tab
Email: emma@student.com
Password: student123
Click "Sign In"
```

## Troubleshooting

### If login doesn't work:

1. **Check browser console** (F12 or Right-click > Inspect > Console tab)
   - Look for any red errors
   - Common issues:
     - "Table doesn't exist" = Database schema not run
     - "No rows returned" = Sample data not loaded
     - Network errors = Check Supabase connection

2. **Verify Supabase Connection:**
   - Check `.env` file has correct credentials
   - Project ID should be: mqlihjzdfkhaomehxbye

3. **Check Tables Exist:**
   - Go to Supabase > Table Editor
   - Look for `teachers` table
   - Click on it
   - You should see 10 teachers including Donald Chapman

4. **Manually verify data:**
```sql
-- Run this in Supabase SQL Editor:
SELECT * FROM teachers WHERE email = 'donald@heroschool.com';
SELECT * FROM dashboard_students WHERE email = 'emma@student.com';
```

### Still not working?

Check these:
- [ ] Database schemas ran successfully (no errors in SQL Editor)
- [ ] Tables exist in Table Editor
- [ ] Sample data loaded (run verification query above)
- [ ] Dev server is running (http://localhost:8080)
- [ ] No console errors in browser
- [ ] .env file has correct Supabase credentials

## What Should Happen

### Successful Teacher Login:
1. You enter credentials
2. Button shows "Signing in..."
3. Toast notification: "Welcome! Logged in successfully as teacher"
4. Redirects to: /teacher/dashboard
5. Shows: "Welcome, Teacher Donald!"
6. Can see 6 tabs and My Classes with all students

### Successful Student Login:
1. You enter credentials
2. Button shows "Signing in..."
3. Toast notification: "Welcome! Logged in successfully as student"
4. Redirects to: /student/dashboard
5. (Student dashboard not yet implemented - will show 404)

## Quick Debug Commands

### Test Supabase Connection:
Open browser console and run:
```javascript
// Check if Supabase is connected
console.log(import.meta.env.VITE_SUPABASE_URL);
console.log(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
```

### Test Database Query:
In Supabase SQL Editor:
```sql
-- Count records
SELECT
  (SELECT COUNT(*) FROM teachers) as teacher_count,
  (SELECT COUNT(*) FROM dashboard_students) as student_count,
  (SELECT COUNT(*) FROM curriculum) as curriculum_count;
```

Should return:
- teacher_count: 10
- student_count: 30
- curriculum_count: 15

---

**If everything is set up correctly, login should work smoothly!** 🎉
