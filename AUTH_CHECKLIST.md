# ✅ Authentication Setup Checklist

Use this checklist to complete your authentication setup and integrate with your Next.js frontend.

---

## 🎯 Backend Setup (Nest.js)

### Step 1: Environment Variables
- [ ] Open your `.env` file
- [ ] Add `SUPABASE_URL` (from Supabase Dashboard > Settings > API)
- [ ] Add `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Use **service_role**, not anon key!)
- [ ] Restart your dev server: `npm run start:dev`

### Step 2: Test Authentication
- [ ] Test public route: `curl http://localhost:3000/`
- [ ] Test protected route (should fail): `curl http://localhost:3000/protected`
- [ ] Verify you get `401 Unauthorized` for protected route

### Step 3: Set Up Test User
- [ ] Go to Supabase Dashboard > Authentication > Users
- [ ] Create a test user or use an existing one
- [ ] Copy the user's **Access Token** (JWT)
- [ ] Test protected route with token:
  ```bash
  curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/protected
  ```
- [ ] Verify you get `200 OK` with user data

### Step 4: Configure User Roles
- [ ] Go to Supabase Dashboard > Authentication > Users
- [ ] Select a test user
- [ ] Edit **App Metadata**
- [ ] Add role: `{ "role": "admin" }`
- [ ] Test role-based route (delete coin endpoint)

---

## 🎨 Frontend Setup (Next.js)

### Step 1: Install Supabase Packages
```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
```

### Step 2: Create Supabase Client
- [ ] Create `lib/supabase.ts`:
  ```typescript
  import { createBrowserClient } from '@supabase/auth-helpers-nextjs'
  
  export const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  ```

### Step 3: Environment Variables
- [ ] Add to `.env.local`:
  ```env
  NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
  NEXT_PUBLIC_API_URL=http://localhost:3000
  ```
- [ ] ⚠️ Use **anon key** on frontend (not service_role!)

### Step 4: Create Auth Context/Hook
- [ ] Create `hooks/useAuth.ts`:
  ```typescript
  import { useEffect, useState } from 'react'
  import { supabase } from '@/lib/supabase'
  import { User } from '@supabase/supabase-js'
  
  export function useAuth() {
    const [user, setUser] = useState<User | null>(null)
    const [token, setToken] = useState<string | null>(null)
  
    useEffect(() => {
      // Get initial session
      supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null)
        setToken(session?.access_token ?? null)
      })
  
      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          setUser(session?.user ?? null)
          setToken(session?.access_token ?? null)
        }
      )
  
      return () => subscription.unsubscribe()
    }, [])
  
    return { user, token, supabase }
  }
  ```

### Step 5: Create API Client
- [ ] Create `lib/api.ts`:
  ```typescript
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
  
  export async function apiCall(
    endpoint: string,
    options: RequestInit = {},
    token?: string
  ) {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }
  
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
  
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    })
  
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`)
    }
  
    return response.json()
  }
  ```

### Step 6: Create Login Page
- [ ] Create `app/login/page.tsx`:
  ```typescript
  'use client'
  
  import { useState } from 'react'
  import { supabase } from '@/lib/supabase'
  import { useRouter } from 'next/navigation'
  
  export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const router = useRouter()
  
    async function handleLogin(e: React.FormEvent) {
      e.preventDefault()
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
  
      if (error) {
        alert(error.message)
      } else {
        router.push('/dashboard')
      }
    }
  
    return (
      <form onSubmit={handleLogin}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
        />
        <button type="submit">Login</button>
      </form>
    )
  }
  ```

### Step 7: Protect Routes with Middleware
- [ ] Create `middleware.ts`:
  ```typescript
  import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
  import { NextResponse } from 'next/server'
  import type { NextRequest } from 'next/server'
  
  export async function middleware(req: NextRequest) {
    const res = NextResponse.next()
    const supabase = createMiddlewareClient({ req, res })
    const { data: { session } } = await supabase.auth.getSession()
  
    // Protect /dashboard routes
    if (req.nextUrl.pathname.startsWith('/dashboard') && !session) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
  
    return res
  }
  
  export const config = {
    matcher: ['/dashboard/:path*']
  }
  ```

### Step 8: Create Protected Dashboard
- [ ] Create `app/dashboard/page.tsx`:
  ```typescript
  'use client'
  
  import { useAuth } from '@/hooks/useAuth'
  import { useEffect, useState } from 'react'
  import { apiCall } from '@/lib/api'
  
  export default function DashboardPage() {
    const { user, token } = useAuth()
    const [data, setData] = useState(null)
  
    useEffect(() => {
      if (token) {
        // Call protected endpoint
        apiCall('/protected', {}, token)
          .then(setData)
          .catch(console.error)
      }
    }, [token])
  
    return (
      <div>
        <h1>Dashboard</h1>
        <p>Welcome, {user?.email}</p>
        {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
      </div>
    )
  }
  ```

---

## 🧪 Integration Testing

### Step 1: Test Login Flow
- [ ] Go to `http://localhost:3000/login` (your Next.js app)
- [ ] Enter test user credentials
- [ ] Verify redirect to dashboard
- [ ] Check browser console for token

### Step 2: Test API Calls
- [ ] In dashboard, verify protected API call works
- [ ] Check Network tab - should see `Authorization: Bearer ...`
- [ ] Verify user data is displayed

### Step 3: Test Logout
- [ ] Add logout button:
  ```typescript
  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }
  ```
- [ ] Click logout
- [ ] Verify redirect to login
- [ ] Try accessing dashboard - should redirect to login

### Step 4: Test Role-Based Access
- [ ] Create admin-only page
- [ ] Call admin-only endpoint (e.g., delete coin)
- [ ] Verify non-admin users get 403 Forbidden
- [ ] Set user role to admin in Supabase
- [ ] Verify admin user can access

---

## 🔒 Security Checklist

- [ ] **Never** commit `.env` files to git
- [ ] Use `SUPABASE_SERVICE_ROLE_KEY` only in backend
- [ ] Use `SUPABASE_ANON_KEY` only in frontend
- [ ] Enable Row Level Security (RLS) in Supabase
- [ ] Implement token refresh on frontend
- [ ] Add rate limiting to sensitive endpoints
- [ ] Log authentication failures
- [ ] Use HTTPS in production
- [ ] Set up CORS properly

---

## 📝 Production Checklist

### Backend (Nest.js)
- [ ] Set environment variables in hosting platform
- [ ] Enable CORS for your frontend domain only
- [ ] Set up health check endpoint
- [ ] Configure logging
- [ ] Set up monitoring (e.g., Sentry)
- [ ] Deploy to Vercel/Railway/Render

### Frontend (Next.js)
- [ ] Update `NEXT_PUBLIC_API_URL` to production URL
- [ ] Enable Supabase email confirmation
- [ ] Set up password reset flow
- [ ] Add loading states
- [ ] Add error handling
- [ ] Set up analytics

### Database (Supabase)
- [ ] Enable Row Level Security (RLS)
- [ ] Create policies for each table
- [ ] Set up database backups
- [ ] Configure email templates
- [ ] Set up custom SMTP (optional)

---

## 🎊 You're Done!

When all checkboxes are ticked, you have:

✅ Secure authentication system  
✅ JWT-based auth with Supabase  
✅ Role-based access control  
✅ Protected frontend routes  
✅ Seamless frontend-backend integration  
✅ Production-ready setup  

---

## 📚 Resources

- [Backend Auth Guide](docs/AUTHENTICATION.md)
- [Auth Examples](docs/AUTH_EXAMPLES.md)
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Next.js Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)

---

**Need help?** Check the troubleshooting section in [AUTHENTICATION_IMPLEMENTATION.md](AUTHENTICATION_IMPLEMENTATION.md)

