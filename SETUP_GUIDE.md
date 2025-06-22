# Authentication Setup Guide

This guide will help you add user authentication to your existing Receipt Budget App using your current Supabase setup.

## 🚀 Quick Setup

### 1. Update Your Database
Run the SQL script in your Supabase SQL Editor:

1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `database-update.sql`
4. Click **Run**

This will:
- Add a `user_id` column to your existing categories table
- Enable Row Level Security (RLS)
- Set up policies so users can only see their own data
- Create a trigger to automatically create default categories for new users

### 2. Configure Authentication (Optional)

#### Enable Google OAuth:
1. In your Supabase dashboard, go to **Authentication > Providers**
2. Enable **Google** provider
3. Add your Google OAuth credentials
4. Set redirect URL: `https://your-project.supabase.co/auth/v1/callback`

#### Configure Email Settings:
1. Go to **Authentication > Settings**
2. Set your site URL (e.g., `http://localhost:3000` for development)
3. Optionally enable email confirmations

### 3. Test the App

1. Start your development server: `npm start`
2. You should now see a login/signup screen
3. Create a new account or sign in
4. Each user will have their own personalized spending data

## 🔧 What Changed

### New Features:
- ✅ **User Authentication**: Sign up, sign in, sign out
- ✅ **Google OAuth**: One-click sign-in with Google
- ✅ **Personalized Data**: Each user sees only their own spending
- ✅ **Automatic Setup**: New users get default categories automatically
- ✅ **Session Management**: Users stay logged in between visits

### Database Changes:
- Added `user_id` column to categories table
- Enabled Row Level Security (RLS)
- Created policies for data isolation
- Added trigger for automatic category creation

### Code Changes:
- Added `Auth.js` component for login/signup
- Updated `App.js` to handle authentication state
- Modified all database queries to filter by user
- Added user info display in header

## 🛡️ Security Features

- **Row Level Security**: Database-level protection
- **User Isolation**: Users can only access their own data
- **Session Management**: Secure authentication state
- **Automatic Logout**: Sessions expire appropriately

## 🔄 Migration Notes

If you have existing data in your categories table:
- The script will add the `user_id` column but leave it NULL
- You can optionally uncomment the migration section in the SQL script to assign existing data to a default user
- New users will get fresh, empty categories

## 🐛 Troubleshooting

**"Could not fetch categories"**
- Check that RLS policies are set up correctly
- Verify the database schema was updated

**"Error signing out"**
- Check your Supabase environment variables
- Verify the Supabase client is properly configured

**Categories not appearing for new users**
- Check that the trigger function was created
- Verify the trigger is attached to the auth.users table

## 🎉 You're Done!

Your app now has full user authentication and personalized data tracking. Each user will have their own private spending data, and the app will automatically handle login/logout flows. 