# 🔧 Setup Your Supabase Credentials

## Step 1: Get Your Supabase Credentials

1. Go to https://supabase.com/dashboard
2. Select your project (or create a new one)
3. Go to **Settings** → **API**
4. Copy these two values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (long string starting with `eyJ...`)

## Step 2: Update config.js

Replace the placeholders in `config.js`:

```javascript
if (name === 'SUPABASE_URL') {
  return 'https://YOUR_PROJECT_ID.supabase.co'; // 👈 Replace this
}
if (name === 'SUPABASE_ANON_KEY') {
  return 'eyJxxxxx...'; // 👈 Replace this with your anon key
}
```

## Step 3: Update manifest.json

Replace the host permission in `manifest.json`:

```json
"host_permissions": [
  "https://YOUR_PROJECT_ID.supabase.co/*"  // 👈 Replace this
],
```

## Step 4: Set Up Database Tables

Run this SQL in your Supabase SQL editor:

```sql
-- Enable Row Level Security
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
  id BIGINT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  completed BOOLEAN DEFAULT FALSE,
  date_created TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  date_completed TIMESTAMP WITH TIME ZONE,
  category TEXT DEFAULT 'Personal',
  priority TEXT DEFAULT 'Medium',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own tasks" ON public.tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tasks" ON public.tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks" ON public.tasks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks" ON public.tasks
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON public.tasks(created_at);
```

## Step 5: Test the Extension

1. Build the extension: `node build.js`
2. Load it in Chrome
3. Try signing up with a test email
4. Add some tasks to verify everything works

## Step 6: Publish Ready!

Once everything works, your extension is ready to publish to the Chrome Web Store with your Supabase backend built-in!

## Troubleshooting

**Invalid API Key Error:**
- Double-check your anon key is correct
- Make sure your Supabase project is active
- Verify the Project URL matches your project

**Database Errors:**
- Run the SQL setup above in your Supabase SQL editor
- Check that RLS policies are created
- Verify the user has proper permissions
