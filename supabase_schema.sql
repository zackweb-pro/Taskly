-- Taskly Database Schema for Supabase
-- Run these SQL commands in your Supabase SQL Editor

-- Table to store users
CREATE TABLE IF NOT EXISTS taskly_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table to store tasks
CREATE TABLE IF NOT EXISTS taskly_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  task_id BIGINT NOT NULL,
  text TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  date_created TIMESTAMP WITH TIME ZONE NOT NULL,
  task_date DATE NOT NULL, -- The date this task belongs to (YYYY-MM-DD)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  FOREIGN KEY (user_id) REFERENCES taskly_users(user_id) ON DELETE CASCADE
);

-- Table to store daily task summaries for faster stats queries
CREATE TABLE IF NOT EXISTS taskly_daily_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  task_date DATE NOT NULL,
  total_tasks INTEGER DEFAULT 0,
  completed_tasks INTEGER DEFAULT 0,
  completion_rate DECIMAL(5,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  FOREIGN KEY (user_id) REFERENCES taskly_users(user_id) ON DELETE CASCADE,
  UNIQUE(user_id, task_date)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_taskly_tasks_user_id ON taskly_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_taskly_tasks_task_date ON taskly_tasks(task_date);
CREATE INDEX IF NOT EXISTS idx_taskly_tasks_user_date ON taskly_tasks(user_id, task_date);
CREATE INDEX IF NOT EXISTS idx_taskly_daily_stats_user_id ON taskly_daily_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_taskly_daily_stats_task_date ON taskly_daily_stats(task_date);

-- Function to update daily stats when tasks change
CREATE OR REPLACE FUNCTION update_daily_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update or insert daily stats for the affected date
  INSERT INTO taskly_daily_stats (user_id, task_date, total_tasks, completed_tasks, completion_rate)
  SELECT 
    user_id,
    task_date,
    COUNT(*) as total_tasks,
    COUNT(*) FILTER (WHERE completed = true) as completed_tasks,
    CASE 
      WHEN COUNT(*) > 0 THEN 
        ROUND((COUNT(*) FILTER (WHERE completed = true)::DECIMAL / COUNT(*)) * 100, 2)
      ELSE 0 
    END as completion_rate
  FROM taskly_tasks 
  WHERE user_id = COALESCE(NEW.user_id, OLD.user_id) 
    AND task_date = COALESCE(NEW.task_date, OLD.task_date)
  GROUP BY user_id, task_date
  ON CONFLICT (user_id, task_date) 
  DO UPDATE SET
    total_tasks = EXCLUDED.total_tasks,
    completed_tasks = EXCLUDED.completed_tasks,
    completion_rate = EXCLUDED.completion_rate,
    updated_at = timezone('utc'::text, now());

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update daily stats
DROP TRIGGER IF EXISTS trigger_update_daily_stats ON taskly_tasks;
CREATE TRIGGER trigger_update_daily_stats
  AFTER INSERT OR UPDATE OR DELETE ON taskly_tasks
  FOR EACH ROW EXECUTE FUNCTION update_daily_stats();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-update updated_at columns
CREATE TRIGGER update_taskly_users_updated_at BEFORE UPDATE ON taskly_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_taskly_tasks_updated_at BEFORE UPDATE ON taskly_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_taskly_daily_stats_updated_at BEFORE UPDATE ON taskly_daily_stats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE taskly_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE taskly_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE taskly_daily_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Allow all operations for now, you can make them more restrictive later)
CREATE POLICY "Allow all operations on taskly_users" ON taskly_users FOR ALL USING (true);
CREATE POLICY "Allow all operations on taskly_tasks" ON taskly_tasks FOR ALL USING (true);
CREATE POLICY "Allow all operations on taskly_daily_stats" ON taskly_daily_stats FOR ALL USING (true);
