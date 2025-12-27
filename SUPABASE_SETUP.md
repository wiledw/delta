# Supabase Setup Guide

## Google OAuth Configuration

To enable Google authentication in PairLab:

1. **Enable Google Provider in Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to **Authentication** → **Providers**
   - Find **Google** and click to enable it

2. **Get Google OAuth Credentials**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the **Google+ API**
   - Go to **Credentials** → **Create Credentials** → **OAuth client ID**
   - Choose **Web application**
   - Add authorized redirect URIs:
     - `https://<your-project-ref>.supabase.co/auth/v1/callback`
     - Your production URL: `https://yourdomain.com/auth/callback`
   - Copy the **Client ID** and **Client Secret**

3. **Configure in Supabase**
   - Paste the Client ID and Client Secret into the Google provider settings in Supabase
   - Save the configuration

4. **Add Redirect URLs**
   - In Supabase Dashboard, go to **Authentication** → **URL Configuration**
   - Add your production URL to **Redirect URLs**:
     - `https://yourdomain.com/auth/callback`
     - `https://yourdomain.com/auth/confirm`
     - `https://yourdomain.com/dashboard`

## Email Template Configuration

To customize email templates with the PairLab branding:

1. **Go to Email Templates**
   - In Supabase Dashboard, navigate to **Authentication** → **Email Templates**

2. **Update Confirmation Email**
   - Click on **Confirm signup**
   - Update the subject line to include "PairLab":
     ```
     Confirm your PairLab account
     ```
   - Update the email body to include the app name:
     ```html
     <h2>Welcome to PairLab!</h2>
     <p>Click the link below to confirm your email address:</p>
     <p><a href="{{ .ConfirmationURL }}">Confirm Email</a></p>
     <p>If you didn't sign up for PairLab, you can safely ignore this email.</p>
     ```

3. **Update Magic Link Email** (if using passwordless)
   - Click on **Magic Link**
   - Update subject: `Sign in to PairLab`
   - Include app name in the body

4. **Update Password Reset Email**
   - Click on **Reset Password**
   - Update subject: `Reset your PairLab password`
   - Include app name in the body

5. **Update Change Email Address Email**
   - Click on **Change Email Address**
   - Update subject: `Confirm your new email for PairLab`
   - Include app name in the body

## Environment Variables

Make sure to set the following environment variables:

```env
# Site URL (required for email links and OAuth redirects)
NEXT_PUBLIC_SITE_URL=https://yourdomain.com

# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_key
```

**Important:** 
- For production, set `NEXT_PUBLIC_SITE_URL` to your actual domain
- For local development, it will default to `http://localhost:3000`
- The site URL is used for all email confirmation links and OAuth redirects

## Testing

1. **Test Google OAuth**
   - Try signing up/login with Google
   - Verify redirect works correctly

2. **Test Email Confirmation**
   - Sign up with email/password
   - Check that the confirmation email includes "PairLab" in subject and body
   - Verify the confirmation link points to your production URL (not localhost)

3. **Test Password Reset**
   - Request a password reset
   - Verify the reset link points to your production URL

