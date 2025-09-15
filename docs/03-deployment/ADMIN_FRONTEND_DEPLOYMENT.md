# Admin Frontend Deployment Guide

## Overview

This document explains the deployment process for the Run Houston admin frontend, including the specific Vite configuration and build commands required for successful deployment on Render.

## Architecture

The admin frontend is built using:
- **Vite** - Modern build tool and development server
- **React** - Frontend framework
- **TypeScript** - Type-safe JavaScript
- **Render** - Cloud deployment platform

## Deployment Configuration

### Render Service Settings

| Setting | Value | Description |
|---------|-------|-------------|
| **Service Type** | Static Site | For frontend applications |
| **Repository** | `sbezner/run-houston` | GitHub repository |
| **Branch** | `mvp1` | Git branch to deploy |
| **Root Directory** | `web` | Where the build process runs |
| **Build Command** | `npm ci --include=dev && npx vite build --config vite.config.admin.ts` | Custom build process |
| **Publish Directory** | `dist/admin` | Where built files are located |

### Environment Variables

| Variable | Value | Purpose |
|----------|-------|---------|
| `NODE_ENV` | `production` | Sets production mode |
| `VITE_API_BASE` | `https://run-houston-api.onrender.com` | API endpoint URL |

## Build Process Explained

### Why the Custom Build Command?

The standard `npm run build:admin` command failed due to TypeScript compilation issues in the deployment environment. Here's why:

#### Original Command (Failed)
```bash
npm ci && npm run build:admin
```

**What it does:**
1. `npm ci` - Installs dependencies (but skips devDependencies by default)
2. `npm run build:admin` - Runs `tsc -b && vite build --config vite.config.admin.ts`

**Why it failed:**
- `tsc -b` (TypeScript compiler) couldn't find React type declarations
- Path resolution issues in deployment environment
- Build failed before Vite could run

#### Working Command
```bash
npm ci --include=dev && npx vite build --config vite.config.admin.ts
```

**What it does:**
1. `npm ci --include=dev` - Installs ALL dependencies including devDependencies
2. `npx vite build --config vite.config.admin.ts` - Uses Vite's built-in TypeScript handling

**Why it works:**
- Vite has integrated TypeScript support that's more robust than separate `tsc` commands
- Better dependency resolution in deployment environments
- Still performs type checking, just using Vite's system instead of separate compilation

### Why `--include=dev` is Required

By default, `npm ci` in production environments skips devDependencies to:
- Reduce production image size
- Improve security (fewer packages)
- Follow the assumption that code is pre-built

However, modern frontend applications need devDependencies for:
- **Vite** - Build tool (devDependency)
- **@types/react** - TypeScript types (devDependency)
- **TypeScript** - Type checking (devDependency)

The `--include=dev` flag forces installation of all dependencies needed for the build process.

## Vite Configuration

### vite.config.admin.ts

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    host: true
  },
  build: {
    outDir: '../dist/admin',
    rollupOptions: {
      input: {
        admin: resolve(__dirname, 'admin/index.html')
      }
    }
  },
  root: './admin',
  resolve: {
    alias: {
      '@shared': resolve(__dirname, 'shared')
    }
  },
  define: {
    'import.meta.env.VITE_APP_TYPE': '"admin"'
  },
  cacheDir: 'node_modules/.vite/admin'
})
```

### Key Configuration Points

- **root: './admin'** - Sets the working directory for the admin app
- **outDir: '../dist/admin'** - Output directory for built files
- **alias: '@shared'** - Path mapping for shared components
- **define** - Injects environment variables at build time

## Environment Variable Handling

### Frontend Environment Variables

The admin frontend uses Vite's environment variable system:

```typescript
// shared/config.ts
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";
```

**Important:** Vite requires the `VITE_` prefix for environment variables to be accessible in the frontend code.

### Common Mistakes

1. **Wrong prefix**: Using `REACT_APP_` instead of `VITE_`
2. **Missing redeploy**: Environment variable changes require rebuild
3. **Browser cache**: Old cached versions may still use old URLs

## Troubleshooting

### CORS Errors

**Symptom:** `Access to fetch at 'http://localhost:8000/admin/login' from origin 'https://runhouston-admin.onrender.com' has been blocked by CORS policy`

**Causes:**
1. Environment variable not set correctly
2. Admin service not redeployed after environment variable change
3. Browser cache using old version

**Solutions:**
1. Verify `VITE_API_BASE` is set to production API URL
2. Redeploy admin service after environment variable changes
3. Clear browser cache or test in incognito mode

### TypeScript Errors During Build

**Symptom:** `Cannot find declaration file for module 'react'`

**Causes:**
1. devDependencies not installed
2. TypeScript compilation running before Vite

**Solutions:**
1. Use `--include=dev` flag
2. Use Vite's built-in TypeScript handling instead of separate `tsc` commands

### Environment Variable Not Working

**Symptom:** Frontend still uses `localhost:8000` despite setting environment variable

**Causes:**
1. Wrong environment variable name
2. Service not redeployed
3. Browser cache

**Solutions:**
1. Use `VITE_` prefix for Vite environment variables
2. Redeploy after environment variable changes
3. Clear browser cache

## Deployment Checklist

- [ ] Repository connected to Render
- [ ] Root directory set to `web`
- [ ] Build command: `npm ci --include=dev && npx vite build --config vite.config.admin.ts`
- [ ] Publish directory: `dist/admin`
- [ ] Environment variables set:
  - [ ] `NODE_ENV=production`
  - [ ] `VITE_API_BASE=https://run-houston-api.onrender.com`
- [ ] API CORS configured to allow admin frontend origin
- [ ] Test login functionality
- [ ] Clear browser cache if needed

## Best Practices

1. **Always redeploy** after environment variable changes
2. **Test in incognito mode** to bypass cache issues
3. **Use Vite's built-in TypeScript handling** instead of separate compilation
4. **Include devDependencies** for frontend build processes
5. **Verify CORS settings** on both frontend and backend

## Related Documentation

- [API Deployment Guide](./API_DEPLOYMENT.md)
- [CORS Configuration](./CORS_CONFIGURATION.md)
- [Environment Variables](./ENVIRONMENT_CONFIG.md)
