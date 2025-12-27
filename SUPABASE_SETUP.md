# Supabase Setup Guide

## Google OAuth Configuration

To enable Google authentication in PairLab:

1. **Enable Google Provider in Supabase Dashboard**

   - Go to your Supabase project dashboard
   - Navigate to **Authentication** → **Providers**
   - Find **Google** and click to enable it

2. **Configure OAuth Consent Screen** (IMPORTANT: This makes it show "PairLab" instead of Supabase domain)

   - In Google Cloud Console, go to **APIs & Services** → **OAuth consent screen**
   - Choose **External** (unless you have a Google Workspace account)
   - Fill in the required information:
     - **App name**: `PairLab` (this is what users will see!)
     - **User support email**: Your email address
     - **App logo**: Upload your PairLab logo (optional but recommended)
     - **Application home page**: `https://yourdomain.com`
     - **Application privacy policy link**: `https://yourdomain.com/privacy` (create this page)
     - **Application terms of service link**: `https://yourdomain.com/terms` (create this page)
     - **Authorized domains**: Add your domain (e.g., `yourdomain.com`)
   - Add scopes (at minimum):
     - `email`
     - `profile`
     - `openid`
   - Add test users (if app is in testing mode) - your email address
   - **Save and Continue** through all steps
   - **Publish** the app (or keep in testing mode for development)

3. **Get Google OAuth Credentials**

   - Go to **Credentials** → **Create Credentials** → **OAuth client ID**
   - Choose **Web application**
   - **Name**: `PairLab Web Client`
   - Add authorized redirect URIs:
     - `https://<your-project-ref>.supabase.co/auth/v1/callback`
     - Your production URL: `https://yourdomain.com/auth/callback`
   - Copy the **Client ID** and **Client Secret**

4. **Configure in Supabase**

   - Paste the Client ID and Client Secret into the Google provider settings in Supabase
   - **Optional**: Add additional scopes if needed (default: `email profile openid`)
   - Save the configuration

5. **Add Redirect URLs**
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

## Improving OAuth User Experience

The OAuth screen will show "Choose an account to continue to PairLab" instead of the Supabase domain if you:

1. **Properly configure the OAuth Consent Screen** (see step 2 above)

   - Make sure the app name is set to "PairLab"
   - Add your logo for better branding
   - Set your domain as the authorized domain

2. **Verify the consent screen is published**

   - In Google Cloud Console, check **OAuth consent screen** status
   - If in "Testing" mode, only test users can sign in
   - Publish the app to make it available to all users

3. **Check the redirect URL**
   - Make sure `redirectTo` in your code uses your production domain
   - The OAuth flow will show your app name from the consent screen configuration

## Testing

1. **Test Google OAuth**

   - Try signing up/login with Google
   - You should see "Choose an account to continue to PairLab" (not Supabase domain)
   - Verify redirect works correctly
   - Check that user profile is created correctly

2. **Test Email Confirmation**

   - Sign up with email/password
   - Check that the confirmation email includes "PairLab" in subject and body
   - Verify the confirmation link points to your production URL (not localhost)

3. **Test Password Reset**
   - Request a password reset
   - Verify the reset link points to your production URL
