# Taskly Supabase Setup Guide

## 1. Database Setup

1. Go to your Supabase project: https://mksxrwldbhknicbbmssz.supabase.co
2. Navigate to the SQL Editor
3. Copy and paste the contents of `supabase_schema.sql` into the SQL Editor
4. Run the SQL script to create the tables and functions

## 2. Database Schema Overview

The setup creates three main tables:

### `taskly_users`
- Stores unique user identifiers
- Each Chrome extension installation gets a unique user ID

### `taskly_tasks`
- Stores all tasks with their completion status
- Linked to users and organized by date
- Supports the full task history

### `taskly_daily_stats`
- Pre-calculated daily statistics for faster heatmap rendering
- Automatically updated via database triggers when tasks change

## 3. Features

### Data Persistence
- Tasks are automatically synced to Supabase when online
- Local storage acts as a backup for offline usage
- No data loss when switching devices or reinstalling

### Offline Support
- Extension works completely offline
- Data syncs automatically when connection is restored
- Local storage maintains task history for immediate access

### Performance
- Daily stats are pre-calculated for fast heatmap rendering
- Database indexes ensure quick queries even with large datasets
- Efficient sync only updates changed data

## 4. Security

- Row Level Security (RLS) is enabled on all tables
- Currently set to permissive policies for testing
- You can restrict access further based on your needs

## 5. API Usage

The extension uses your Supabase REST API with the provided credentials:
- URL: `https://mksxrwldbhknicbbmssz.supabase.co`
- API Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## 6. Testing

1. Install the extension in Chrome
2. Add some tasks and mark them as completed
3. Check your Supabase dashboard to see the data being synced
4. Try the stats view to see the heatmap with your data

## 7. Monitoring

You can monitor usage and data through your Supabase dashboard:
- View tables in the Table Editor
- Monitor API calls in the API section
- Check logs for any errors

## 8. Backup Strategy

- Primary: Supabase cloud database
- Secondary: Chrome local storage
- Automatic sync ensures data consistency
