# Vercel Deployment Guide

This guide will help you deploy the Meillor Backend to Vercel.

## Prerequisites

- A Vercel account ([sign up here](https://vercel.com/signup))
- Vercel CLI installed (optional, but recommended)
- Your Supabase credentials ready

## Deployment Methods

### Method 1: Deploy via Vercel Dashboard (Recommended)

#### Step 1: Push to Git Repository

Make sure your code is pushed to a Git repository (GitHub, GitLab, or Bitbucket):

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

#### Step 2: Import Project to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import your Git repository
4. Vercel will auto-detect the NestJS project

#### Step 3: Configure Environment Variables

In the Vercel project settings, add the following environment variables:

```
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
JWT_SECRET=your_jwt_secret_key
NODE_ENV=production
```

**Important**: Make sure to set these in:
- **Settings** → **Environment Variables**
- Add for **Production**, **Preview**, and **Development** environments

#### Step 4: Deploy

Click **"Deploy"** and Vercel will:
1. Install dependencies
2. Run the build command (`nest build`)
3. Deploy your application

Your app will be available at: `https://your-project-name.vercel.app`

### Method 2: Deploy via Vercel CLI

#### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

#### Step 2: Login to Vercel

```bash
vercel login
```

#### Step 3: Deploy

```bash
# For preview deployment
vercel

# For production deployment
vercel --prod
```

#### Step 4: Set Environment Variables

```bash
vercel env add SUPABASE_URL
vercel env add SUPABASE_KEY
vercel env add JWT_SECRET
```

## Configuration Files

The following files have been added for Vercel deployment:

### 1. `vercel.json`

Main configuration file that tells Vercel how to deploy the app:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "dist/main.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "dist/main.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  },
  "outputDirectory": "dist"
}
```

### 2. `api/index.ts`

Serverless entry point for the NestJS application.

### 3. `.vercelignore`

Specifies files/directories to ignore during deployment.

## Verifying Deployment

After deployment, test your API endpoints:

### Test Base URL
```bash
curl https://your-project-name.vercel.app/coins
```

### Test with Parameters
```bash
curl "https://your-project-name.vercel.app/coins?page=1&limit=10"
```

### Test Statistics
```bash
curl https://your-project-name.vercel.app/coins/statistics
```

## Important Notes

### 1. Serverless Function Limitations

Vercel has some limitations for serverless functions:
- **Execution timeout**: 10 seconds (Hobby), 60 seconds (Pro), 900 seconds (Enterprise)
- **Payload size**: 4.5 MB request/response
- **Deployment size**: 250 MB

### 2. Environment Variables

Always set environment variables in Vercel dashboard, never commit them to Git:

```bash
# ❌ DON'T commit .env file
# ✅ DO set in Vercel dashboard
```

### 3. Cold Starts

Serverless functions may have cold starts (1-2 seconds delay) after inactivity. This is normal for Vercel's free tier.

### 4. API Routes

All your endpoints will be available at:
```
https://your-project-name.vercel.app/coins
https://your-project-name.vercel.app/coins/statistics
https://your-project-name.vercel.app/coins/:id
```

### 5. CORS Configuration

The application is configured to accept requests from any origin. For production, you may want to restrict this:

```typescript
// In api/index.ts or src/main.ts
app.enableCors({
  origin: ['https://your-frontend-domain.com'], // Restrict to your frontend
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: 'Content-Type,Authorization',
  credentials: true,
});
```

## Continuous Deployment

Vercel automatically deploys:
- **Production**: When you push to `main` branch
- **Preview**: When you create a pull request or push to other branches

## Monitoring and Logs

### View Deployment Logs

1. Go to your project in Vercel Dashboard
2. Click on a deployment
3. View **Build Logs** and **Function Logs**

### View Runtime Logs

```bash
vercel logs [deployment-url]
```

### Real-time Logs

```bash
vercel logs --follow
```

## Troubleshooting

### Build Fails

**Problem**: Build fails during deployment

**Solution**:
```bash
# Test build locally first
npm run build

# Check for TypeScript errors
npm run lint
```

### Environment Variables Not Working

**Problem**: App can't connect to Supabase

**Solution**:
1. Verify environment variables in Vercel dashboard
2. Ensure variables are set for the correct environment (Production/Preview)
3. Redeploy after adding variables

### Cold Start Delays

**Problem**: First request takes 2-3 seconds

**Solution**:
- This is normal for serverless functions
- Upgrade to Vercel Pro for better performance
- Consider implementing a keep-alive ping

### Function Timeout

**Problem**: "Function execution timeout" error

**Solution**:
- Optimize your database queries
- Add pagination to limit data
- Upgrade Vercel plan for longer timeouts

## Performance Optimization

### 1. Enable Edge Caching

Add caching headers for GET requests:

```typescript
@Get()
@Header('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=59')
async findAll(@Query() queryDto: QueryCoinsDto) {
  return this.coinsService.findAll(queryDto);
}
```

### 2. Optimize Bundle Size

The smaller your deployment, the faster it loads:

```bash
# Check bundle size
npm run build
```

### 3. Use Environment-Specific Configs

```typescript
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  // Production-specific configurations
  app.enableShutdownHooks();
}
```

## Scaling

As your app grows:

1. **Monitor usage**: Check Vercel analytics
2. **Optimize queries**: Use Supabase indexes
3. **Consider caching**: Add Redis for frequently accessed data
4. **Upgrade plan**: Get more bandwidth and better performance

## Custom Domain

### Add Custom Domain

1. Go to **Settings** → **Domains**
2. Add your domain
3. Configure DNS records as instructed
4. Wait for SSL certificate provisioning

### Update CORS

After adding a custom domain, update CORS settings:

```typescript
app.enableCors({
  origin: ['https://yourdomain.com', 'https://www.yourdomain.com'],
  // ... other settings
});
```

## Security Best Practices

1. ✅ **Never commit secrets** to Git
2. ✅ **Use Vercel environment variables** for sensitive data
3. ✅ **Enable HTTPS only** (Vercel does this automatically)
4. ✅ **Implement rate limiting** (consider @nestjs/throttler)
5. ✅ **Validate all inputs** (already implemented with DTOs)
6. ✅ **Restrict CORS** in production to your frontend domains

## Deployment Checklist

Before deploying to production:

- [ ] Environment variables configured in Vercel
- [ ] Supabase database set up with proper schema
- [ ] `.env` file added to `.gitignore`
- [ ] All tests passing (`npm test`)
- [ ] No linter errors (`npm run lint`)
- [ ] Build succeeds locally (`npm run build`)
- [ ] CORS configured for your frontend domain
- [ ] API endpoints tested
- [ ] Documentation updated

## Support

If you encounter issues:

1. Check [Vercel Documentation](https://vercel.com/docs)
2. Check [NestJS Documentation](https://docs.nestjs.com)
3. Review deployment logs in Vercel dashboard
4. Check this project's `docs/` folder for additional guides

## Example Vercel Configuration

Here's the complete `vercel.json` for reference:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "dist/main.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "dist/main.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  },
  "outputDirectory": "dist"
}
```

## Next Steps After Deployment

1. Test all API endpoints
2. Set up monitoring and alerts
3. Configure your frontend to use the Vercel URL
4. Monitor performance and optimize as needed
5. Set up CI/CD pipeline for automated testing

Your NestJS app is now ready for Vercel deployment! 🚀

