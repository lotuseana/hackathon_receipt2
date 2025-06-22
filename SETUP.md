# Setup Guide for Receipt Budget Assistant

This guide will help you set up all the required API keys and environment variables for the Receipt Budget Assistant.

## Required API Keys

### 1. Google Cloud Vision API Key

The app now uses Google Cloud Vision API for OCR processing instead of Tesseract. This provides better accuracy and faster processing.

#### Steps to get your Google Cloud Vision API key:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Cloud Vision API:
   - Go to "APIs & Services" > "Library"
   - Search for "Cloud Vision API"
   - Click on it and press "Enable"
4. Create credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy the generated API key
5. (Optional) Restrict the API key to Cloud Vision API for security

### 2. Anthropic API Key

Used for AI-powered receipt analysis and spending tips.

#### Steps to get your Anthropic API key:

1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Sign up or log in
3. Go to "API Keys" section
4. Create a new API key
5. Copy the generated key

### 3. Supabase Configuration

Used for data storage and user authentication.

#### Steps to get your Supabase credentials:

1. Go to [Supabase](https://supabase.com/)
2. Create a new project or select an existing one
3. Go to "Settings" > "API"
4. Copy the "Project URL" and "anon public" key

## Environment Variables Setup

1. Create a `.env` file in the root directory of your project
2. Add the following variables:

```env
# Google Cloud Vision API Key
REACT_APP_GOOGLE_CLOUD_VISION_API_KEY=your_google_cloud_vision_api_key_here

# Anthropic API Key (for AI analysis)
REACT_APP_ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Supabase Configuration
REACT_APP_SUPABASE_URL=your_supabase_url_here
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

## Installation Steps

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up your environment variables (see above)

3. Start the development server:
   ```bash
   npm start
   ```

## Testing the Setup

1. Open the app in your browser
2. Sign in with your Supabase account
3. Try uploading a receipt image or taking a photo
4. The app should now use Google Cloud Vision API for OCR processing

## Troubleshooting

### Google Cloud Vision API Issues

- **"API key not valid"**: Make sure you've enabled the Cloud Vision API in your Google Cloud project
- **"Quota exceeded"**: Check your Google Cloud billing and quotas
- **"No text detected"**: Try with a clearer image or better lighting

### General Issues

- Make sure all environment variables are set correctly
- Check the browser console for any error messages
- Ensure your API keys have the necessary permissions

## Security Notes

- Never commit your `.env` file to version control
- Consider restricting your API keys to specific domains/IPs
- Monitor your API usage to avoid unexpected charges 