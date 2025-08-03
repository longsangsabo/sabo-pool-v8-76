# Netlify Deployment Troubleshooting Guide

## Common Errors and Solutions

### Husky Installation Errors

**Error Message:**

```
Failed during stage 'Install dependencies': dependency_installation script returned non-zero exit code: 1
> project-name@1.0.0 prepare
> husky install
sh: 1: husky: not found
```

**Solution:**

1. Update the `prepare` script in `package.json` to conditionally run husky:

   ```json
   "prepare": "[ -z \"$SKIP_HUSKY\" ] && husky install || echo \"Skipping husky install\""
   ```

2. Make sure `SKIP_HUSKY=1` is set in your Netlify environment variables:
   - In the Netlify UI: Site settings > Build & deploy > Environment > Environment variables
   - In `netlify.toml`:
     ```toml
     [build.environment]
       SKIP_HUSKY = "1"
     ```
   - In your build command:
     ```toml
     [build]
       command = "SKIP_HUSKY=1 npm run build"
     ```

3. Create a `.env.production` file with:

   ```
   SKIP_HUSKY=1
   ```

4. For more reliable deployment, use the provided deployment script:
   ```bash
   ./deploy-netlify.sh
   ```

### Environment Variable Issues

**Error Message:**

```
Error: Missing environment variable: VITE_SUPABASE_URL
```

**Solution:**

1. Make sure all required environment variables are defined in `netlify.toml`:

   ```toml
   [context.production.environment]
     VITE_SUPABASE_URL = "https://your-project.supabase.co"
     VITE_SUPABASE_ANON_KEY = "your-public-key"
   ```

2. Or use a `.env.production` file in your repository (note: sensitive keys should still be set via the Netlify UI).

### Build Performance Optimizations

For faster builds:

1. Configure proper cache settings:

   ```toml
   [[plugins]]
     package = "netlify-plugin-cache"

     [plugins.inputs]
       paths = ["node_modules/.cache", ".eslintcache", ".env"]
   ```

2. Use selective deployment based on changes:

   ```toml
   [build]
     ignore = "git log -1 --pretty=%B | grep dependabot"
   ```

3. Optimize build times by setting the CI environment variable:
   ```toml
   [build.environment]
     CI = "true"
   ```

## Deployment Best Practices

### 1. Use Netlify CLI for Local Testing

Test deployments locally before pushing:

```bash
netlify build
netlify deploy --prod
```

### 2. Configure Proper Build Settings

For Vite applications:

```toml
[build]
  command = "SKIP_HUSKY=1 npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "20"
  NPM_VERSION = "10"
```

### 3. Optimize Assets and Caching

Improve site performance:

```toml
[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

### 4. Setup Post-Deployment Checks

Add automated checks after deployment:

```toml
[[plugins]]
  package = "@netlify/plugin-lighthouse"

  [plugins.inputs.thresholds]
    performance = 0.8
    accessibility = 0.9
```
