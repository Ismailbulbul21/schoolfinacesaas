# Security Guidelines

## Environment Variables

This project requires the following environment variables to be set:

### Required Variables
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

### Setup Instructions

1. Copy `.env.example` to `.env.local`
2. Fill in your actual Supabase credentials
3. Never commit `.env.local` or any `.env` files to version control

### Example .env.local
```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Security Notes

- The Supabase anonymous key is safe to use in frontend applications
- Never commit sensitive tokens or API keys
- Use environment variables for all configuration
- The MCP configuration file contains sensitive tokens and should not be committed

## Development Setup

1. Install dependencies: `npm install`
2. Create `.env.local` with your Supabase credentials
3. Run development server: `npm run dev`
