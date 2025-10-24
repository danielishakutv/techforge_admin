# Deployment Guide - TechForge Admin Portal

## Deployment URL
**Production**: `https://bootcamp.tokoacademy.org/admin`

---

## Pre-Deployment Checklist

- [ ] Backend API is running at `https://bootcamp.tokoacademy.org/api`
- [ ] All API endpoints are tested and working
- [ ] Authentication endpoints return JWT tokens
- [ ] CORS is configured to allow requests from `/admin` subdirectory
- [ ] Server is configured to handle SPA routing for `/admin/*` paths

---

## Build Process

### 1. Install Dependencies
```bash
npm install
```

### 2. Build for Production
```bash
npm run build
```

This creates an optimized production build in the `build/` folder with:
- Minified JavaScript and CSS
- Optimized images and assets
- Source maps for debugging
- Service worker for offline support (if configured)

---

## Server Configuration

### Option 1: Apache

Create or update `.htaccess` in your `/admin` directory:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /admin/
  
  # Don't rewrite files or directories
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  
  # Rewrite everything else to index.html to allow client-side routing
  RewriteRule . /admin/index.html [L]
</IfModule>

# Enable gzip compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

# Set cache headers
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
  ExpiresByType text/html "access plus 1 hour"
</IfModule>
```

### Option 2: Nginx

Add this to your Nginx configuration:

```nginx
server {
    listen 80;
    server_name bootcamp.tokoacademy.org;

    # Admin Portal
    location /admin {
        alias /var/www/bootcamp/admin-portal/build;
        try_files $uri $uri/ /admin/index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API endpoints
    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Option 3: Node.js/Express

```javascript
const express = require('express');
const path = require('path');
const app = express();

// Serve admin portal static files
app.use('/admin', express.static(path.join(__dirname, 'admin-portal/build')));

// Handle React routing - send all /admin/* requests to index.html
app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin-portal/build', 'index.html'));
});

// API routes
app.use('/api', require('./api/routes'));

app.listen(80, () => {
  console.log('Server running on port 80');
});
```

---

## Environment Variables

### Production (.env.production)
```
PUBLIC_URL=/admin
REACT_APP_API_BASE_URL=https://bootcamp.tokoacademy.org/api
```

### Development (.env.development)
```
PUBLIC_URL=/
REACT_APP_API_BASE_URL=http://localhost:8000/api
```

---

## Deployment Steps

### Using FTP/SFTP

1. Build the project:
   ```bash
   npm run build
   ```

2. Upload the contents of the `build/` folder to your server's `/admin` directory

3. Ensure `.htaccess` or server config is in place

4. Test the deployment:
   - Navigate to `https://bootcamp.tokoacademy.org/admin`
   - Login with credentials
   - Test all routes work correctly
   - Check that page refresh doesn't cause 404 errors

### Using Git Deployment

1. Push your code to your repository

2. SSH into your server:
   ```bash
   ssh user@bootcamp.tokoacademy.org
   ```

3. Navigate to project directory:
   ```bash
   cd /var/www/bootcamp/admin-portal
   ```

4. Pull latest changes:
   ```bash
   git pull origin main
   ```

5. Install dependencies and build:
   ```bash
   npm install --production
   npm run build
   ```

6. Restart your web server if needed:
   ```bash
   # Apache
   sudo systemctl restart apache2
   
   # Nginx
   sudo systemctl restart nginx
   ```

---

## Connecting to Backend API

Once deployed, update `AuthContext.jsx` and other files to use the API utility:

```javascript
import api from '../utils/api';

// Example: Login
const result = await api.login(email, password);
if (result.token) {
  setAuthToken(result.token);
  setAdminUser(result.user);
}

// Example: Fetch cohorts
const cohorts = await api.getCohorts();
setCohorts(cohorts);
```

Replace all mock data calls with real API calls as shown in the examples in `src/utils/api.js`.

---

## Post-Deployment Testing

### Manual Testing Checklist

- [ ] Admin portal loads at `https://bootcamp.tokoacademy.org/admin`
- [ ] Login page appears and accepts credentials
- [ ] After login, redirects to dashboard
- [ ] All navigation links work
- [ ] Page refresh doesn't cause 404
- [ ] Logout works and redirects to login
- [ ] API calls return data (once backend is connected)
- [ ] Mobile/tablet responsiveness works
- [ ] Browser console shows no errors

### API Testing

Test these endpoints once backend is connected:

```bash
# Login
curl -X POST https://bootcamp.tokoacademy.org/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@tokoacademy.org","password":"password"}'

# Get cohorts (with token)
curl https://bootcamp.tokoacademy.org/api/admin/cohorts \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Troubleshooting

### Issue: 404 on page refresh

**Solution**: Ensure server is configured to redirect all `/admin/*` requests to `/admin/index.html`

### Issue: Assets not loading

**Solution**: Check that `PUBLIC_URL=/admin` is set in `.env.production` and rebuild

### Issue: API calls failing

**Solution**: 
1. Check CORS configuration on backend
2. Verify API base URL in `.env.production`
3. Check browser network tab for actual errors

### Issue: Blank screen after deployment

**Solution**:
1. Check browser console for errors
2. Ensure all assets are uploaded
3. Verify `homepage` in `package.json` is correct
4. Rebuild with correct environment variables

---

## Security Considerations

1. **HTTPS Only**: Ensure the site runs on HTTPS in production
2. **Secure Cookies**: Backend should set secure, httpOnly cookies for auth
3. **CORS**: Configure CORS to only allow your domain
4. **Rate Limiting**: Implement rate limiting on API endpoints
5. **Input Validation**: Always validate user input on backend
6. **XSS Protection**: React handles this, but be careful with `dangerouslySetInnerHTML`
7. **CSRF Protection**: Implement CSRF tokens for state-changing operations

---

## Monitoring & Maintenance

### Recommended Tools

- **Error Tracking**: Sentry, Rollbar, or LogRocket
- **Analytics**: Google Analytics or Plausible
- **Uptime Monitoring**: UptimeRobot or Pingdom
- **Performance**: Lighthouse, WebPageTest

### Log Files

Check server logs regularly:

```bash
# Apache
tail -f /var/log/apache2/error.log

# Nginx
tail -f /var/log/nginx/error.log
```

---

## Support

For deployment issues, contact:
- **Email**: support@tokoacademy.org
- **Developer**: TechForge Development Team

---

**Last Updated**: October 24, 2025
