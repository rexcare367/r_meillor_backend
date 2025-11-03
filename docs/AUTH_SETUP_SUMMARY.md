# 🎉 Authentication Setup Complete!

Your Nest.js backend now has a **production-ready authentication system** powered by Supabase.

---

## ✅ What Was Implemented

### **1. Core Authentication Module**

- **`AuthService`** - Verifies Supabase JWT tokens and manages user data
- **`AuthGuard`** - Global guard that protects all routes by default
- **`RolesGuard`** - Role-based access control for fine-grained permissions

### **2. Custom Decorators**

- **`@Public()`** - Mark routes as public (no authentication required)
- **`@CurrentUser()`** - Extract authenticated user in controller methods
- **`@Roles(...roles)`** - Specify required roles for route access

### **3. Global Protection**

All routes are now **protected by default**. To make a route public, you must explicitly add the `@Public()` decorator.

### **4. Updated Controllers**

- **`app.controller.ts`** - Example of public and protected routes
- **`coins.controller.ts`** - Real-world implementation with:
  - Public routes for browsing coins
  - Protected routes for creating/updating
  - Admin-only route for deleting (with role check)

---

## 🚀 Quick Start

### **1. Set Environment Variables**

Add to your `.env` file:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### **2. Start the Server**

```bash
npm run start:dev
```

### **3. Test the Authentication**

#### Test Public Route:
```bash
curl http://localhost:3000/
```

Expected: `"Hello World!"`

#### Test Protected Route (Without Token):
```bash
curl http://localhost:3000/protected
```

Expected: `401 Unauthorized`

#### Test Protected Route (With Token):

First, get a JWT token from your Next.js frontend by logging in with Supabase Auth, then:

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3000/protected
```

Expected:
```json
{
  "message": "Authentication works! 🎉",
  "user": {
    "id": "...",
    "email": "user@example.com",
    "role": "user"
  }
}
```

---

## 🔑 How to Get a JWT Token

### **Option 1: From Next.js Frontend**

After a user logs in with Supabase Auth:

```typescript
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

const supabase = createClientComponentClient()
const { data: { session } } = await supabase.auth.getSession()

if (session) {
  const token = session.access_token
  // Use this token in API requests
}
```

### **Option 2: From Supabase Dashboard (for testing)**

1. Go to **Authentication > Users**
2. Click on a user
3. Copy the **Access Token** (JWT)
4. Use it in your API requests

---

## 📖 Route Examples

### **Public Route**

```typescript
@Get()
@Public()
async findAll() {
  return this.service.findAll();
}
```

### **Protected Route**

```typescript
@Post()
async create(
  @Body() dto: CreateDto,
  @CurrentUser() user: User,
) {
  // User is automatically authenticated
  console.log('Authenticated user:', user.email);
  return this.service.create(dto);
}
```

### **Admin-Only Route**

```typescript
@Delete(':id')
@UseGuards(RolesGuard)
@Roles('admin')
async remove(
  @Param('id') id: string,
  @CurrentUser() user: User,
) {
  // Only admins can access this
  return this.service.remove(id);
}
```

---

## 🛠️ Setting User Roles

By default, users have the `'user'` role. To assign different roles:

### **Option 1: Via Supabase Dashboard**

1. Go to **Authentication > Users**
2. Click on a user
3. Edit **App Metadata**
4. Add: `{ "role": "admin" }`

### **Option 2: Via Supabase SQL**

```sql
-- Create a user_profiles table
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  role TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create a trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, role)
  VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### **Option 3: Via Auth Hook (Recommended for Production)**

Create a Supabase Edge Function to set roles during signup:

```typescript
// supabase/functions/set-user-role/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const { user } = await req.json()
  
  // Custom logic to assign roles
  let role = 'user'
  if (user.email.endsWith('@admin.com')) {
    role = 'admin'
  }
  
  return new Response(
    JSON.stringify({ user_metadata: { role } }),
    { headers: { "Content-Type": "application/json" } }
  )
})
```

---

## 🔐 Security Best Practices

✅ **Never expose `SUPABASE_SERVICE_ROLE_KEY` on the client**
✅ **Use `app_metadata` for roles (more secure than `user_metadata`)**
✅ **Implement Row Level Security (RLS) in Supabase**
✅ **Validate user permissions in business logic, not just guards**
✅ **Log authentication failures for security monitoring**

---

## 📚 Next Steps

1. **Frontend Integration**
   - Set up Supabase Auth in your Next.js app
   - Send JWT tokens in API requests
   - Handle token expiration and refresh

2. **Extend RBAC**
   - Add more roles (e.g., 'moderator', 'editor')
   - Create permission-based guards
   - Implement hierarchical roles

3. **Advanced Features**
   - API rate limiting per user
   - Audit logging for sensitive operations
   - Multi-factor authentication (MFA)

4. **Testing**
   - Write unit tests for guards
   - Write e2e tests for protected routes
   - Test role-based access scenarios

---

## 📖 Documentation

- **[Authentication Guide](./AUTHENTICATION.md)** - Complete documentation
- **[Auth Examples](./AUTH_EXAMPLES.md)** - Real-world code examples
- **[API Examples](./API_EXAMPLES.md)** - API usage examples

---

## 🆘 Troubleshooting

### Issue: "Missing Supabase configuration"

**Solution:** Ensure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set in `.env`

### Issue: "Invalid or expired token"

**Solution:** 
- Check if token is expired (default: 1 hour)
- Verify token format: `Authorization: Bearer <token>`
- Ensure user still exists in Supabase

### Issue: Role check fails

**Solution:**
- Verify role is set in user metadata
- Check `AuthService.getUserRole()` logic
- Ensure `RolesGuard` is applied with `@UseGuards()`

---

**🎊 Your authentication system is ready for production!**

For more details, see [AUTHENTICATION.md](./AUTHENTICATION.md)

