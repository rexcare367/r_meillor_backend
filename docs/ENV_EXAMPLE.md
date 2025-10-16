# Environment Variables

Create a `.env` file in the root directory with the following configuration:

```env
# Supabase Configuration
# Get these from your Supabase project settings: https://app.supabase.com
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-supabase-anon-key

# JWT Configuration
# This should be the same secret used by Supabase for JWT verification
# You can find this in Supabase under Settings > API > JWT Settings > JWT Secret
JWT_SECRET=your-jwt-secret-key

# Server Configuration
PORT=3005
NODE_ENV=development
```

## Getting Supabase Credentials

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Settings** > **API**
4. Copy the following:
   - **Project URL** → `SUPABASE_URL`
   - **anon/public key** → `SUPABASE_KEY`
5. For JWT_SECRET:
   - Navigate to **Settings** > **API** > **JWT Settings**
   - Copy the **JWT Secret** → `JWT_SECRET`

## Security Notes

- Never commit your `.env` file to version control
- Use different credentials for development, staging, and production
- Rotate secrets regularly
- Use environment-specific Supabase projects

## Environment-Specific Configurations

### Development
```env
NODE_ENV=development
PORT=3005
```

### Production
```env
NODE_ENV=production
PORT=3005
```

### Testing
```env
NODE_ENV=test
PORT=3006
```

