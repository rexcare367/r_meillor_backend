# CORS Configuration

## Current Configuration

The application is configured to **allow ALL requests from ANY origin** to prevent CORS errors.

### Configuration Details

```typescript
app.enableCors({
  origin: '*',              // Allow all origins
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  allowedHeaders: '*',      // Allow all headers
  credentials: false,       // Must be false when origin is '*'
  preflightContinue: false,
  optionsSuccessStatus: 204,
});
```

### What This Means

✅ **Any domain** can make requests to your API  
✅ **All HTTP methods** are allowed (GET, POST, PATCH, DELETE, etc.)  
✅ **All headers** are allowed  
✅ **Preflight requests** (OPTIONS) are handled automatically  

### Where It's Configured

This configuration is set in **two places**:

1. **`src/main.ts`** - For local development and standard deployment
2. **`api/index.ts`** - For Vercel serverless deployment

### Security Considerations

⚠️ **Important**: This configuration is very permissive and suitable for:
- Public APIs
- Development environments
- APIs that don't handle sensitive user data via cookies

### When to Restrict CORS

If your application requires tighter security, you should restrict CORS in production:

#### Option 1: Specific Domains

```typescript
app.enableCors({
  origin: [
    'https://yourdomain.com',
    'https://www.yourdomain.com',
    'https://app.yourdomain.com'
  ],
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  allowedHeaders: 'Content-Type,Authorization',
  credentials: true, // Can be true with specific origins
});
```

#### Option 2: Dynamic Based on Environment

```typescript
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? ['https://yourdomain.com', 'https://www.yourdomain.com']
    : '*',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  allowedHeaders: '*',
  credentials: process.env.NODE_ENV !== 'production',
};

app.enableCors(corsOptions);
```

#### Option 3: Pattern Matching

```typescript
app.enableCors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    // Allow all subdomains of yourdomain.com
    if (origin.endsWith('.yourdomain.com') || origin === 'https://yourdomain.com') {
      return callback(null, true);
    }
    
    // Block all other origins
    callback(new Error('Not allowed by CORS'));
  },
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  allowedHeaders: 'Content-Type,Authorization',
  credentials: true,
});
```

### Testing CORS

You can test CORS from the browser console:

```javascript
// Test from any website's console
fetch('https://your-api-domain.com/coins')
  .then(r => r.json())
  .then(data => console.log(data))
  .catch(err => console.error('CORS Error:', err));
```

Or using curl:

```bash
# Simulate a browser preflight request
curl -X OPTIONS https://your-api-domain.com/coins \
  -H "Origin: https://example.com" \
  -H "Access-Control-Request-Method: GET" \
  -i

# Make actual request
curl https://your-api-domain.com/coins \
  -H "Origin: https://example.com" \
  -i
```

### Common CORS Headers in Response

With the current configuration, your API responses include:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS
Access-Control-Allow-Headers: *
```

### Credentials and Cookies

**Note**: When `origin: '*'`, browsers will NOT send cookies or authentication tokens stored in the browser's credentials.

If you need to send cookies:
1. Set `origin` to specific domains (not `*`)
2. Set `credentials: true`
3. Client must include `credentials: 'include'` in fetch requests

```javascript
// Client-side with credentials
fetch('https://your-api.com/coins', {
  credentials: 'include'  // Include cookies
})
```

### Best Practices

✅ **Development**: Use `origin: '*'` for ease of development  
✅ **Public APIs**: Use `origin: '*'` if API is meant to be public  
✅ **Private APIs**: Restrict to specific domains  
✅ **With Auth Cookies**: Must use specific origins + credentials: true  
✅ **Environment-Based**: Use different CORS configs for dev/prod  

### Current Status

🟢 **CORS is fully open** - No CORS errors will occur from any origin.

This is ideal for:
- Development and testing
- Public APIs
- APIs accessed from multiple domains/apps
- Mobile app backends

---

**Need to change CORS settings?** Update the configuration in:
- `src/main.ts` (line ~18)
- `api/index.ts` (line ~31)

