# Deployment Guide

This guide will help you deploy the School Finance Management System to production.

## 🚀 Quick Deployment Options

### Option 1: Vercel (Recommended)

1. **Connect your repository to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel will automatically detect it's a Vite React app

2. **Configure environment variables**
   - In Vercel dashboard, go to Settings > Environment Variables
   - Add the following variables:
     ```
     VITE_SUPABASE_URL=your_supabase_url
     VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

3. **Deploy**
   - Click "Deploy" and Vercel will build and deploy your app
   - Your app will be available at `https://your-app.vercel.app`

### Option 2: Netlify

1. **Connect your repository to Netlify**
   - Go to [netlify.com](https://netlify.com)
   - Connect your GitHub repository
   - Set build command: `npm run build`
   - Set publish directory: `dist`

2. **Configure environment variables**
   - In Netlify dashboard, go to Site settings > Environment variables
   - Add the same variables as above

3. **Deploy**
   - Netlify will automatically deploy on every push to main branch

### Option 3: Manual Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Upload the `dist` folder**
   - Upload the contents of the `dist` folder to your web server
   - Ensure your server supports SPA routing (configure redirects)

## 🔧 Environment Configuration

### Required Environment Variables

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### Getting Supabase Credentials

1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Copy the Project URL and anon/public key
4. Add these to your deployment platform's environment variables

## 🗄️ Database Setup

### Production Database

1. **Create a production Supabase project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project for production
   - Choose a region close to your users (e.g., Europe for Somalia)

2. **Run database migrations**
   - Use the Supabase CLI or dashboard to run the migrations
   - The migrations are in the database setup section of the README

3. **Configure Row Level Security**
   - Ensure all RLS policies are enabled
   - Test with different user roles

### Database Backups

1. **Enable automatic backups**
   - In Supabase dashboard, go to Settings > Database
   - Enable Point-in-time Recovery (PITR)
   - Set up regular backup schedules

## 🔒 Security Checklist

### Before Going Live

- [ ] Enable HTTPS (automatic with Vercel/Netlify)
- [ ] Verify all environment variables are set
- [ ] Test authentication flows
- [ ] Verify Row Level Security policies
- [ ] Test file upload functionality
- [ ] Verify offline capabilities
- [ ] Test on mobile devices
- [ ] Check performance with slow connections

### Post-Deployment

- [ ] Monitor error logs
- [ ] Set up uptime monitoring
- [ ] Configure analytics (optional)
- [ ] Set up user feedback collection
- [ ] Plan for regular updates

## 📱 Mobile Optimization

### PWA Features (Optional)

To make the app installable on mobile devices:

1. **Add a web app manifest**
   ```json
   {
     "name": "School Finance System",
     "short_name": "Finance",
     "start_url": "/",
     "display": "standalone",
     "background_color": "#ffffff",
     "theme_color": "#2563eb"
   }
   ```

2. **Add service worker for offline support**
   - Implement caching strategies
   - Handle offline payment queuing

## 🌍 Performance Optimization

### For Slow Connections

1. **Enable compression**
   - Most hosting platforms enable gzip compression automatically
   - Consider Brotli compression for better results

2. **Optimize images**
   - Use WebP format where supported
   - Implement lazy loading
   - Compress images before upload

3. **Code splitting**
   - The app already uses dynamic imports
   - Consider route-based splitting for larger apps

## 📊 Monitoring & Analytics

### Error Tracking

1. **Set up error monitoring**
   - Consider Sentry for error tracking
   - Monitor database errors
   - Track user experience issues

2. **Performance monitoring**
   - Use Web Vitals to track performance
   - Monitor Core Web Vitals scores
   - Track loading times on slow connections

### User Analytics (Optional)

1. **Privacy-compliant analytics**
   - Consider Plausible or Fathom for privacy-focused analytics
   - Avoid Google Analytics if privacy is a concern
   - Track only essential metrics

## 🔄 Updates & Maintenance

### Regular Updates

1. **Dependency updates**
   ```bash
   npm update
   npm audit fix
   ```

2. **Security patches**
   - Monitor for security vulnerabilities
   - Update dependencies regularly
   - Test updates in staging environment

3. **Feature updates**
   - Plan regular feature releases
   - Gather user feedback
   - Prioritize based on user needs

### Backup Strategy

1. **Database backups**
   - Daily automated backups
   - Test restore procedures
   - Store backups in multiple locations

2. **Code backups**
   - Use Git for version control
   - Tag releases for easy rollback
   - Maintain staging environment

## 🆘 Troubleshooting

### Common Issues

1. **Build failures**
   - Check Node.js version compatibility
   - Verify all dependencies are installed
   - Check for TypeScript errors

2. **Runtime errors**
   - Check browser console for errors
   - Verify environment variables
   - Check Supabase connection

3. **Performance issues**
   - Monitor bundle size
   - Check for memory leaks
   - Optimize database queries

### Support

- Check the main README for detailed documentation
- Review Supabase documentation for database issues
- Check React Query documentation for state management issues

---

**Ready to deploy! 🚀**

Your School Finance Management System is now ready for production use in Somali schools.
