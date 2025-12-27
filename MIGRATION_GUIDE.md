# Database Migration Guide

## Running the Migration

To set up the `analyses` table with Row Level Security (RLS) policies, you need to run the migration SQL file.

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy the contents of `supabase/migrations/001_create_analyses_table.sql`
4. Paste and run the SQL in the editor

### Option 2: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
# Make sure you're logged in
supabase login

# Link your project (if not already linked)
supabase link --project-ref your-project-ref

# Run the migration
supabase db push
```

Or manually:

```bash
supabase db execute -f supabase/migrations/001_create_analyses_table.sql
```

### Option 3: Direct SQL Execution

You can also execute the SQL directly using any PostgreSQL client connected to your Supabase database.

## What the Migration Does

1. Creates the `analyses` table with the following columns:
   - `id` (UUID, primary key)
   - `user_id` (UUID, references auth.users)
   - `created_at` (timestamp)
   - `asset_a` (text)
   - `asset_b` (text)
   - `input_data` (JSONB)
   - `result_data` (JSONB)

2. Creates an index on `(user_id, created_at DESC)` for efficient queries

3. Enables Row Level Security (RLS)

4. Creates RLS policies for:
   - SELECT: Users can only view their own analyses
   - INSERT: Users can only insert their own analyses
   - UPDATE: Users can only update their own analyses
   - DELETE: Users can only delete their own analyses

## Verification

After running the migration, verify it worked:

```sql
-- Check table exists
SELECT * FROM analyses LIMIT 1;

-- Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'analyses';

-- Check policies
SELECT * FROM pg_policies WHERE tablename = 'analyses';
```

