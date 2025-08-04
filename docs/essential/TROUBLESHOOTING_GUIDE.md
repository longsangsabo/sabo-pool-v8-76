# 🚨 Troubleshooting Guide

**Quick fixes for common issues**

## 🔧 Development Issues

### Build Errors

**Error: Module not found**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Error: Vite config issues**
```bash
# Check configs/vite.config.ts
# Ensure all paths use configs/ prefix
```

**Error: TypeScript errors**
```bash
# Run type check
npm run type-check

# Check tsconfig files in configs/
```

### Runtime Errors

**Error: Supabase connection failed**
```bash
# Check environment variables
cat .env.local

# Test connection
npm run test:db
```

**Error: VNPAY payment failed**
```bash
# Check VNPAY credentials
npm run test:vnpay

# Verify webhook URLs
```

**Error: Component not found**
```bash
# Check import paths (use @/ alias)
# Verify component exists in src/
```

## 🗄️ Database Issues

### Connection Problems
```sql
-- Check connection
SELECT NOW();

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'your_table';
```

### Migration Issues
```bash
# Reset database (development only!)
supabase db reset

# Apply specific migration
supabase db push --include-all
```

### Performance Issues
```sql
-- Check slow queries
SELECT query, mean_exec_time 
FROM pg_stat_statements 
WHERE mean_exec_time > 1000;

-- Check indexes
SELECT schemaname, tablename, indexname 
FROM pg_indexes 
WHERE tablename = 'your_table';
```

## 💰 Payment Issues

### VNPAY Integration
```bash
# Test payment flow
curl -X POST http://localhost:5173/api/payments/test

# Check webhook endpoint
curl -X POST http://localhost:5173/api/payments/webhook
```

### Common Payment Errors
- **Invalid merchant ID**: Check VITE_VNPAY_MERCHANT_ID
- **Signature mismatch**: Verify VITE_VNPAY_SECRET_KEY
- **Webhook failure**: Check URL accessibility
- **Amount validation**: Ensure correct format (VND)

## 🚀 Deployment Issues

### Build Failures
```bash
# Check build logs
npm run build 2>&1 | tee build.log

# Verify environment variables
echo $VITE_SUPABASE_URL
```

### Production Errors
```bash
# Check application health
curl https://your-domain.com/api/health

# Check database connectivity
curl https://your-domain.com/api/db/status
```

### Performance Issues
- **Slow loading**: Check bundle sizes, optimize images
- **Memory leaks**: Check React DevTools Profiler
- **Database slow**: Optimize queries, add indexes

## 🔒 Security Issues

### Authentication Problems
```bash
# Check Supabase auth
# Verify JWT tokens in browser DevTools
# Check RLS policies in Supabase dashboard
```

### CORS Issues
```typescript
// Check CORS configuration
// Verify allowed origins in Supabase settings
```

## 📊 Monitoring & Debugging

### React DevTools
1. Install React DevTools browser extension
2. Check component tree and props
3. Use Profiler to identify performance issues

### Network Debugging
```bash
# Check API calls in browser Network tab
# Verify request/response headers
# Check for failed requests (4xx, 5xx)
```

### Console Debugging
```typescript
// Add debug logging
console.log('Debug info:', data);

// Use browser debugger
debugger; // Pauses execution
```

## 🆘 Emergency Procedures

### System Completely Down
1. Check hosting provider status
2. Verify DNS settings
3. Check database connectivity
4. Contact emergency support

### Database Corruption
1. Stop all application instances
2. Contact Supabase support immediately
3. Restore from latest backup
4. Verify data integrity

### Payment System Down
1. Display maintenance message
2. Contact VNPAY support
3. Monitor transaction logs
4. Communicate with users

## 📞 Getting Help

### Internal Support
1. **Check Documentation**: Start with [Essential Docs](../essential/)
2. **Search Issues**: Check existing GitHub issues
3. **Ask Team**: Contact development team
4. **Create Issue**: Document problem with steps to reproduce

### External Support
- **Supabase**: support@supabase.io
- **VNPAY**: [Support contact]
- **Hosting**: [Provider support]

### Community Resources
- **React**: https://react.dev/community
- **Vite**: https://vitejs.dev/guide/
- **TypeScript**: https://www.typescriptlang.org/docs/

## 🐛 Common Gotchas

### React Hooks
- Don't call hooks inside loops/conditions
- Use dependency arrays correctly in useEffect
- Avoid infinite re-renders

### TypeScript
- Check for `any` types - use specific types
- Verify import/export statements
- Use proper type assertions

### Supabase
- RLS policies must be correct for data access
- Real-time subscriptions need proper cleanup
- Connection pooling limits in production

---

**Still stuck?** Create a GitHub issue with:
1. Error message/screenshot
2. Steps to reproduce  
3. Expected vs actual behavior
4. Environment details
