# Supabase Authentication Workflow

## 🔐 Overview

This NestJS backend uses **Supabase Admin Client** to verify JWT access tokens issued by Supabase Auth. The authentication flow follows industry best practices for stateless JWT verification.

---

## 🔄 Complete Authentication Flow

```
Frontend (Next.js) 
    ↓ User logs in
Supabase Auth
    ↓ Returns access_token
Frontend stores token
    ↓ Includes in API requests
NestJS Backend (AuthGuard)
    ↓ Extracts token from Authorization header
Supabase Admin API (auth.getUser)
    ↓ Verifies token validity
NestJS attaches user to request
    ↓ Route handler executes
Protected resource returned
```

---

## 📝 Step-by-Step Workflow

### 1️⃣ Frontend: User Login

User authenticates via Supabase (email/password, OAuth, magic link, etc.):

```typescript
// Frontend (Next.js/React)
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123',
});

// Supabase returns session with access_token
const accessToken = data.session?.access_token;
```

### 2️⃣ Frontend: Store and Send Token

Store the access token securely and include it in all API requests:

```typescript
// Get current session
const { data: { session } } = await supabase.auth.getSession();

// Make API request with token
const response = await fetch('http://localhost:3000/api/coins', {
  headers: {
    'Authorization': `Bearer ${session?.access_token}`,
  },
});
```

### 3️⃣ Backend: Extract Authorization Header

The `AuthGuard` automatically extracts the Authorization header:

```typescript
// AuthGuard extracts from request
const authHeader = request.headers.authorization;
// Format: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

const token = authHeader?.split(' ')[1];
```

### 4️⃣ Backend: Verify Token with Supabase

The guard uses **Supabase Admin API** to verify the token:

```typescript
// AuthService.verifyToken()
const { data: { user }, error } = await this.supabase.auth.getUser(token);

if (error || !user) {
  throw new UnauthorizedException('Invalid or expired token');
}

return user; // Returns full User object from Supabase
```

### 5️⃣ Backend: Attach User to Request

Once verified, the user is attached to the request object:

```typescript
// In AuthGuard
request.user = user;       // Full Supabase User object
request.userRole = role;   // Extracted from user metadata
```

### 6️⃣ Backend: Access User in Controllers

Controllers can access the authenticated user via `@CurrentUser()` decorator:

```typescript
@Get('profile')
async getProfile(@CurrentUser() user: User) {
  return {
    id: user.id,
    email: user.email,
    role: user.app_metadata?.role || 'user',
  };
}
```

---

## 🛡️ AuthGuard Implementation

### Key Features

1. **Global Guard**: Applied to all routes by default
2. **Public Routes**: Use `@Public()` decorator to bypass authentication
3. **Optional Auth**: Public routes can optionally include user if token is provided
4. **Role-Based Access**: Extracts user roles from Supabase metadata

### Code Structure

```typescript
@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Check if route is public
    const isPublic = this.reflector.getAllAndOverride(IS_PUBLIC_KEY, [...]);
    
    // 2. Extract Authorization header
    const authHeader = request.headers.authorization;
    
    // 3. Handle missing auth header
    if (!authHeader) {
      return isPublic; // Allow if public, deny if protected
    }
    
    // 4. Extract token from "Bearer <token>"
    const token = authHeader.split(' ')[1];
    
    // 5. Verify token with Supabase Admin API
    try {
      const user = await this.authService.verifyToken(token);
      request.user = user;
      return true;
    } catch {
      return isPublic; // Allow if public, deny if protected
    }
  }
}
```

---

## 🎯 Route Protection Examples

### Protected Route (Requires Authentication)

```typescript
@Controller('favorites')
export class FavoritesController {
  // No @Public() decorator = authentication required
  @Post()
  async addFavorite(
    @Body() dto: AddFavoriteDto,
    @CurrentUser() user: User, // User automatically injected
  ) {
    return this.favoritesService.addFavorite(user.id, dto.coin_id);
  }
}
```

### Public Route (No Authentication Required)

```typescript
@Controller('coins')
export class CoinsController {
  @Get()
  @Public() // Anyone can access
  async findAll() {
    return this.coinsService.findAll();
  }
}
```

### Public Route with Optional Authentication

```typescript
@Controller('coins')
export class CoinsController {
  @Get()
  @Public() // Public route
  async findAll(@CurrentUser() user?: User) {
    // If user is authenticated, include favorite status
    // If not authenticated, still works but no favorites
    return this.coinsService.findAll(user?.id);
  }
}
```

---

## 🔑 Environment Configuration

Required environment variables:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Note: Use SERVICE_ROLE_KEY (not anon key) for backend
# This key bypasses Row Level Security for admin operations
```

⚠️ **Important**: 
- Frontend uses `SUPABASE_ANON_KEY`
- Backend uses `SUPABASE_SERVICE_ROLE_KEY`
- Never expose service role key to frontend!

---

## 🧪 Testing the Authentication

### 1. Login and Get Token (Frontend)

```typescript
const { data } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123',
});

const token = data.session?.access_token;
console.log('Access Token:', token);
```

### 2. Test Protected Endpoint

```bash
# Without token - should return 401
curl http://localhost:3000/favorites

# With token - should return data
curl http://localhost:3000/favorites \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 3. Test Public Endpoint

```bash
# Without token - works, no favorites data
curl http://localhost:3000/coins

# With token - works, includes is_favorite field
curl http://localhost:3000/coins \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 🚨 Error Handling

### Common Authentication Errors

| Error | Status | Cause |
|-------|--------|-------|
| `Missing authorization header` | 401 | No `Authorization` header on protected route |
| `Invalid authorization format` | 401 | Malformed header (not "Bearer <token>") |
| `Invalid or expired token` | 401 | Token is invalid, expired, or user deleted |

### Frontend Error Handling

```typescript
try {
  const response = await fetch('http://localhost:3000/favorites', {
    headers: {
      'Authorization': `Bearer ${session?.access_token}`,
    },
  });
  
  if (response.status === 401) {
    // Token expired or invalid - redirect to login
    await supabase.auth.signOut();
    router.push('/login');
  }
} catch (error) {
  console.error('API Error:', error);
}
```

---

## 🔒 Security Best Practices

### ✅ Current Implementation

- ✅ Uses Supabase Admin API for token verification
- ✅ Verifies token on every request (stateless)
- ✅ Automatically handles token expiration
- ✅ Service role key kept secret (backend only)
- ✅ Global guard with explicit public routes
- ✅ User data attached to request for easy access

### 🔐 Additional Recommendations

1. **HTTPS Only**: Always use HTTPS in production
2. **Token Refresh**: Frontend should handle token refresh automatically
3. **Short-lived Tokens**: Keep access token TTL short (default: 1 hour)
4. **Rate Limiting**: Add rate limiting for authentication endpoints
5. **Logging**: Log authentication failures for security monitoring

---

## 📚 API Documentation

### Available Decorators

| Decorator | Usage | Description |
|-----------|-------|-------------|
| `@Public()` | On route/controller | Marks route as publicly accessible |
| `@CurrentUser()` | On parameter | Injects authenticated user |
| `@Roles(...roles)` | On route | Restricts access to specific roles |

### Example: Role-Based Access

```typescript
@Delete(':id')
@UseGuards(RolesGuard)
@Roles('admin')
async deleteUser(@Param('id') id: string, @CurrentUser() user: User) {
  // Only admin users can access this
  return this.usersService.delete(id);
}
```

---

## 🎉 Summary

Your NestJS backend now properly implements Supabase authentication following these principles:

1. ✅ **Stateless JWT Verification**: Uses Supabase Admin API
2. ✅ **Global Protection**: All routes protected by default
3. ✅ **Public Routes**: Explicit opt-in with `@Public()` decorator
4. ✅ **Optional Auth**: Public routes can optionally use user data
5. ✅ **Type Safety**: Full TypeScript support with Supabase User type
6. ✅ **Error Handling**: Proper 401 responses for invalid tokens

The implementation is production-ready and follows Supabase best practices! 🚀

