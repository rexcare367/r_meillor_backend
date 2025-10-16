# 🚀 Quick Deployment to Vercel

## One-Click Deploy (Easiest)

1. Push your code to GitHub/GitLab/Bitbucket
2. Go to [vercel.com](https://vercel.com)
3. Click **"Add New Project"**
4. Import your repository
5. Add environment variables:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_key
   JWT_SECRET=your_jwt_secret
   ```
6. Click **Deploy** ✨

Your API will be live at: `https://your-project.vercel.app`

## Via CLI (Fast)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

## Test Deployment

```bash
# Test your deployed API
curl https://your-project.vercel.app/coins

# Test with parameters
curl "https://your-project.vercel.app/coins?page=1&limit=10"
```

## Files Created for Vercel

✅ `vercel.json` - Vercel configuration  
✅ `api/index.ts` - Serverless entry point  
✅ `.vercelignore` - Files to ignore  
✅ `.gitignore` - Git ignore (includes .vercel)  

## Environment Variables Required

Set these in Vercel Dashboard → Settings → Environment Variables:

| Variable | Description | Where to Find |
|----------|-------------|---------------|
| `SUPABASE_URL` | Your Supabase project URL | Supabase → Settings → API |
| `SUPABASE_KEY` | Your Supabase anon key | Supabase → Settings → API |
| `JWT_SECRET` | JWT secret for auth | Supabase → Settings → API → JWT Secret |

## Endpoints After Deployment

- `GET https://your-project.vercel.app/coins` - Get all coins
- `GET https://your-project.vercel.app/coins/statistics` - Get statistics
- `GET https://your-project.vercel.app/coins/:id` - Get single coin
- `POST https://your-project.vercel.app/coins` - Create coin (protected)
- `PATCH https://your-project.vercel.app/coins/:id` - Update coin (protected)
- `DELETE https://your-project.vercel.app/coins/:id` - Delete coin (protected)

## Common Issues

**Build fails?**
```bash
# Test locally first
npm run build
```

**Environment variables not working?**
- Make sure they're set in Vercel Dashboard
- Redeploy after adding variables

**Cold starts slow?**
- Normal for serverless (1-2 seconds on first request)
- Subsequent requests are fast

## Full Documentation

See [docs/VERCEL_DEPLOYMENT.md](docs/VERCEL_DEPLOYMENT.md) for complete guide with:
- Detailed step-by-step instructions
- Troubleshooting guide
- Performance optimization tips
- Custom domain setup
- Security best practices

## Support

Need help? Check:
- 📖 [Vercel Docs](https://vercel.com/docs)
- 📖 [NestJS Docs](https://docs.nestjs.com)
- 📁 Full docs in `docs/` folder

---

**That's it!** Your NestJS + Supabase API is now deployed on Vercel! 🎉

