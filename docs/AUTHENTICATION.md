# 🔐 Authentication System

This backend uses **Supabase** for authentication with a clean, scalable architecture that supports JWT verification, role-based access control (RBAC), and public routes.

---

## 📚 **Table of Contents**

1. [Architecture Overview](#architecture-overview)
2. [Setup](#setup)
3. [Usage Examples](#usage-examples)
4. [Decorators](#decorators)
5. [Guards](#guards)
6. [Role-Based Access Control](#role-based-access-control)
7. [Testing Authentication](#testing-authentication)

---

## 🏗️ Architecture Overview

### **Flow Diagram**

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT (Next.js)                         │
├─────────────────────────────────────────────────────────────┤
│  1. User authenticates with Supabase Auth                   │
│  2. Receives JWT token                                      │
│  3. Sends requests with Authorization: Bearer <token>       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 BACKEND (Nest.js + AuthGuard)               │
├─────────────────────────────────────────────────────────────┤
│  1. Global AuthGuard intercepts all requests                │
│  2. Checks for @Public() decorator (skip auth)              │
│  3. Verifies JWT via Supabase Admin SDK                     │
│  4. Attaches user to req.user                               │
│  5. RolesGuard checks roles (if @Roles() used)              │
└─────────────────────────────────────────────────────────────┘
```

### **Key Components**

- **AuthModule**: Main authentication module
- **AuthService**: Verifies JWT tokens with Supabase
- **AuthGuard**: Global guard that protects all routes by default
- **RolesGuard**: Optional guard for role-based access
- **Decorators**: `@Public()`, `@CurrentUser()`, `@Roles()`

---

## ⚙️ Setup

### **1. Environment Variables**

Add these to your `.env` file:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

⚠️ **Important**: Use the **Service Role Key** (not the anon key) for backend operations.

### **2. Installation**

The `@supabase/supabase-js` package is already installed. If you need to reinstall:

```bash
npm install @supabase/supabase-js
```

### **3. Module Setup**

The `AuthModule` is already imported in `app.module.ts` with a **global AuthGuard**:

```typescript
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule, // ✅ Authentication enabled
    CoinsModule,
  ],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard, // ✅ All routes protected by default
    },
  ],
})
export class AppModule {}
```

---

## 🚀 Usage Examples

### **1. Public Route (No Authentication)**

Use the `@Public()` decorator for routes that don't require authentication:

```typescript
import { Controller, Get } from '@nestjs/common';
import { Public } from './auth/decorators';

@Controller('coins')
export class CoinsController {
  @Get()
  @Public() // ✅ Anyone can access
  async findAll() {
    return this.coinsService.findAll();
  }
}
```

### **2. Protected Route (Requires Authentication)**

By default, **all routes are protected**. Just use `@CurrentUser()` to access the authenticated user:

```typescript
import { Controller, Post, Body } from '@nestjs/common';
import { CurrentUser } from './auth/decorators';
import { User } from '@supabase/supabase-js';

@Controller('coins')
export class CoinsController {
  @Post()
  async create(
    @Body() createDto: CreateCoinDto,
    @CurrentUser() user: User, // ✅ Authenticated user
  ) {
    console.log('Authenticated user:', user.email);
    return this.coinsService.create(createDto);
  }
}
```

### **3. Role-Based Route (Admin Only)**

Use `@Roles()` with `RolesGuard` for role-based access:

```typescript
import { Controller, Delete, UseGuards } from '@nestjs/common';
import { CurrentUser, Roles } from './auth/decorators';
import { RolesGuard } from './auth/guards/roles.guard';
import { User } from '@supabase/supabase-js';

@Controller('coins')
export class CoinsController {
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin') // ✅ Only admins can delete
  async remove(@Param('id') id: string, @CurrentUser() user: User) {
    console.log('Admin deleting coin:', user.email);
    await this.coinsService.remove(id);
  }
}
```

---

## 🎨 Decorators

### **@Public()**

Marks a route as public (no authentication required).

```typescript
@Get()
@Public()
getPublicData() {
  return { message: 'This is public' };
}
```

### **@CurrentUser()**

Extracts the authenticated user from the request.

```typescript
@Get('me')
getProfile(@CurrentUser() user: User) {
  return {
    id: user.id,
    email: user.email,
  };
}
```

### **@Roles(...roles)**

Specifies required roles for accessing a route.

```typescript
@Post('admin-only')
@UseGuards(RolesGuard)
@Roles('admin', 'superadmin')
createSensitiveData(@CurrentUser() user: User) {
  // Only admin or superadmin can access
}
```

---

## 🛡️ Guards

### **AuthGuard** (Applied Globally)

- **Purpose**: Verifies JWT tokens from Supabase
- **Scope**: Applied globally to all routes
- **Skip**: Use `@Public()` to bypass

### **RolesGuard** (Applied Per-Route)

- **Purpose**: Checks user roles
- **Scope**: Applied only to routes with `@Roles()` decorator
- **Usage**: Must be used with `@UseGuards(RolesGuard)`

---

## 👥 Role-Based Access Control (RBAC)

### **How Roles Work**

Roles are stored in the Supabase user's metadata:

1. **app_metadata** (set by Supabase admin/functions)
2. **user_metadata** (set by user or backend)

### **Setting User Roles in Supabase**

#### **Option 1: Via Supabase Dashboard**

1. Go to **Authentication > Users**
2. Select a user
3. Edit **User Metadata** or **App Metadata**
4. Add: `{ "role": "admin" }`

#### **Option 2: Via Supabase Function (Recommended)**

Create a database trigger or Auth hook:

```sql
-- Create a function to set default role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, role)
  VALUES (NEW.id, 'user'); -- Default role
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger after user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

#### **Option 3: Via Backend (AuthService)**

You can extend `AuthService` to manage roles:

```typescript
async updateUserRole(userId: string, role: string) {
  const { data, error } = await this.supabase.auth.admin.updateUserById(
    userId,
    {
      user_metadata: { role },
    },
  );

  if (error) throw error;
  return data;
}
```

### **Custom Role Logic**

The `AuthService.getUserRole()` method determines roles:

```typescript
getUserRole(user: User): string {
  // Priority: app_metadata > user_metadata > default
  const appMetadata = (user as any).app_metadata || {};
  if (appMetadata.role) return appMetadata.role;

  const userMetadata = user.user_metadata || {};
  return userMetadata.role || 'user'; // Default: 'user'
}
```

### **Example: Multiple Roles**

```typescript
@Delete('sensitive-data')
@UseGuards(RolesGuard)
@Roles('admin', 'superadmin', 'manager') // Multiple roles allowed
async deleteSensitiveData(@CurrentUser() user: User) {
  // Only these roles can access
}
```

---

## 🧪 Testing Authentication

### **1. Test Public Route**

```bash
curl http://localhost:3000/
```

**Expected**: `Hello World!`

### **2. Test Protected Route (No Token)**

```bash
curl http://localhost:3000/protected
```

**Expected**: `401 Unauthorized`

### **3. Test Protected Route (With Token)**

First, get a token from your Next.js frontend after logging in, then:

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3000/protected
```

**Expected**:
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

### **4. Test Role-Based Route**

```bash
curl -X DELETE \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  http://localhost:3000/coins/123
```

**Expected (Admin)**: `204 No Content`  
**Expected (Non-Admin)**: `403 Forbidden`

---

## 🔧 Troubleshooting

### **"No token provided" Error**

- Ensure the frontend sends the token in the `Authorization` header
- Format: `Authorization: Bearer <token>`

### **"Invalid token" Error**

- Token may be expired (Supabase tokens expire after 1 hour by default)
- User may have been deleted
- Check if `SUPABASE_SERVICE_ROLE_KEY` is correct

### **Role Check Fails**

- Ensure the user has a role in `user_metadata` or `app_metadata`
- Check `AuthService.getUserRole()` logic
- Verify role is set in Supabase dashboard

---

## 📝 Best Practices

✅ **Use `@Public()` sparingly** – Most routes should be protected  
✅ **Store roles in `app_metadata`** – More secure than `user_metadata`  
✅ **Use RLS (Row Level Security)** in Supabase for additional protection  
✅ **Implement refresh tokens** – Automatically refresh expired tokens on the frontend  
✅ **Log authentication failures** – Monitor suspicious activity  

---

## 🚀 Next Steps

1. **Implement Frontend Authentication**
   - Use `@supabase/auth-helpers-nextjs`
   - Send JWT in `Authorization` header

2. **Extend RBAC**
   - Add permissions system
   - Create `@Permissions()` decorator

3. **Add API Rate Limiting**
   - Use `@nestjs/throttler`
   - Limit requests per user

4. **Implement Refresh Tokens**
   - Handle token expiration gracefully
   - Auto-refresh on frontend

---

## 📚 Additional Resources

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [NestJS Guards](https://docs.nestjs.com/guards)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

---

**Built with ❤️ using Nest.js + Supabase**

