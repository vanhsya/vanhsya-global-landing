# VANHSYA GLOBAL - Netlify Deployment Guide

## Quick Deploy to Netlify

### Option 1: Drag & Drop Deploy
1. Run `npm run build` to create the `dist` folder
2. Go to [netlify.com](https://netlify.com)
3. Drag the `dist` folder to the deploy area
4. Your site will be live instantly

### Option 2: Git Deploy
1. Push this repository to GitHub
2. Connect your GitHub repo to Netlify
3. Set build command: `npm run build`
4. Set publish directory: `dist`
5. Deploy automatically

### Option 3: Netlify CLI
```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod --dir=dist
```

## Custom Domain Setup (vanhsya.com)

1. In Netlify dashboard, go to Domain settings
2. Add custom domain: `vanhsya.com`
3. Configure DNS:
   - Add CNAME record: `www` → `your-site.netlify.app`
   - Add A record: `@` → Netlify's IP addresses
4. Enable HTTPS (automatic with Netlify)

## Environment Variables
- Set `GEMINI_API_KEY` in Netlify environment variables
- Go to Site settings → Environment variables
- Add: `GEMINI_API_KEY` = your actual API key

## Performance Optimizations Applied
- Gzip compression enabled
- Asset caching configured
- SPA routing with redirects
- Optimized build output

Your site is ready for production deployment!