# 🎯 Authentication Examples

Real-world examples of using the authentication system in your controllers.

---

## 📦 Example 1: Blog API

### **Public Routes**

```typescript
import { Controller, Get, Param } from '@nestjs/common';
import { Public } from '../auth/decorators';

@Controller('blog')
export class BlogController {
  @Get()
  @Public() // Anyone can read blog posts
  async getAllPosts() {
    return this.blogService.findAll();
  }

  @Get(':id')
  @Public() // Anyone can read a single post
  async getPost(@Param('id') id: string) {
    return this.blogService.findOne(id);
  }
}
```

### **Protected Routes**

```typescript
import { Controller, Post, Body } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators';
import { User } from '@supabase/supabase-js';

@Controller('blog')
export class BlogController {
  @Post()
  async createPost(
    @Body() createPostDto: CreatePostDto,
    @CurrentUser() user: User,
  ) {
    // Only authenticated users can create posts
    return this.blogService.create({
      ...createPostDto,
      authorId: user.id,
      authorEmail: user.email,
    });
  }
}
```

### **Role-Based Routes**

```typescript
import { Controller, Delete, Patch, UseGuards } from '@nestjs/common';
import { CurrentUser, Roles } from '../auth/decorators';
import { RolesGuard } from '../auth/guards/roles.guard';
import { User } from '@supabase/supabase-js';

@Controller('blog')
export class BlogController {
  @Patch(':id')
  async updatePost(
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
    @CurrentUser() user: User,
  ) {
    // Users can only update their own posts
    const post = await this.blogService.findOne(id);
    
    if (post.authorId !== user.id) {
      throw new ForbiddenException('You can only edit your own posts');
    }
    
    return this.blogService.update(id, updatePostDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'moderator')
  async deletePost(@Param('id') id: string, @CurrentUser() user: User) {
    // Only admins and moderators can delete any post
    return this.blogService.remove(id);
  }
}
```

---

## 📦 Example 2: User Profile API

```typescript
import { Controller, Get, Patch, Body } from '@nestjs/common';
import { CurrentUser, Public } from '../auth/decorators';
import { User } from '@supabase/supabase-js';

@Controller('users')
export class UsersController {
  @Get('me')
  async getCurrentUser(@CurrentUser() user: User) {
    // Get current user's profile
    return {
      id: user.id,
      email: user.email,
      metadata: user.user_metadata,
      createdAt: user.created_at,
    };
  }

  @Patch('me')
  async updateProfile(
    @Body() updateDto: UpdateProfileDto,
    @CurrentUser() user: User,
  ) {
    // Update current user's profile
    return this.usersService.updateProfile(user.id, updateDto);
  }

  @Get(':id')
  @Public() // Public profiles
  async getPublicProfile(@Param('id') id: string) {
    // Get any user's public profile
    return this.usersService.getPublicProfile(id);
  }
}
```

---

## 📦 Example 3: Admin Dashboard

```typescript
import { Controller, Get, Post, Delete, UseGuards } from '@nestjs/common';
import { CurrentUser, Roles } from '../auth/decorators';
import { RolesGuard } from '../auth/guards/roles.guard';
import { User } from '@supabase/supabase-js';

@Controller('admin')
@UseGuards(RolesGuard)
@Roles('admin') // All routes in this controller require admin role
export class AdminController {
  @Get('users')
  async getAllUsers(@CurrentUser() admin: User) {
    // Only admins can see all users
    return this.usersService.findAll();
  }

  @Delete('users/:id')
  async deleteUser(@Param('id') id: string, @CurrentUser() admin: User) {
    // Only admins can delete users
    return this.usersService.remove(id);
  }

  @Post('users/:id/ban')
  async banUser(@Param('id') id: string, @CurrentUser() admin: User) {
    // Only admins can ban users
    return this.usersService.ban(id);
  }

  @Get('analytics')
  async getAnalytics(@CurrentUser() admin: User) {
    // Only admins can view analytics
    return this.analyticsService.getOverview();
  }
}
```

---

## 📦 Example 4: File Upload with Authentication

```typescript
import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../auth/decorators';
import { User } from '@supabase/supabase-js';

@Controller('files')
export class FilesController {
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: User,
  ) {
    // Only authenticated users can upload files
    return this.filesService.upload(file, user.id);
  }

  @Post('upload-public')
  @Public()
  @UseInterceptors(FileInterceptor('file'))
  async uploadPublicFile(@UploadedFile() file: Express.Multer.File) {
    // Anyone can upload to public bucket
    return this.filesService.uploadPublic(file);
  }
}
```

---

## 📦 Example 5: E-commerce API

```typescript
import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { CurrentUser, Public, Roles } from '../auth/decorators';
import { RolesGuard } from '../auth/guards/roles.guard';
import { User } from '@supabase/supabase-js';

@Controller('products')
export class ProductsController {
  @Get()
  @Public() // Anyone can browse products
  async getAllProducts() {
    return this.productsService.findAll();
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('seller', 'admin') // Only sellers and admins can add products
  async createProduct(
    @Body() createProductDto: CreateProductDto,
    @CurrentUser() user: User,
  ) {
    return this.productsService.create({
      ...createProductDto,
      sellerId: user.id,
    });
  }
}

@Controller('orders')
export class OrdersController {
  @Get('my-orders')
  async getMyOrders(@CurrentUser() user: User) {
    // Get current user's orders
    return this.ordersService.findByUser(user.id);
  }

  @Post()
  async createOrder(
    @Body() createOrderDto: CreateOrderDto,
    @CurrentUser() user: User,
  ) {
    // Create order for authenticated user
    return this.ordersService.create({
      ...createOrderDto,
      userId: user.id,
      userEmail: user.email,
    });
  }

  @Get('all')
  @UseGuards(RolesGuard)
  @Roles('admin', 'support') // Only admin and support can see all orders
  async getAllOrders(@CurrentUser() admin: User) {
    return this.ordersService.findAll();
  }
}
```

---

## 📦 Example 6: Social Media API

```typescript
import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { CurrentUser, Public } from '../auth/decorators';
import { User } from '@supabase/supabase-js';

@Controller('posts')
export class PostsController {
  @Get()
  @Public() // Feed is public
  async getFeed() {
    return this.postsService.getFeed();
  }

  @Post()
  async createPost(
    @Body() createPostDto: CreatePostDto,
    @CurrentUser() user: User,
  ) {
    return this.postsService.create({
      ...createPostDto,
      userId: user.id,
    });
  }

  @Post(':id/like')
  async likePost(@Param('id') id: string, @CurrentUser() user: User) {
    return this.postsService.like(id, user.id);
  }

  @Delete(':id/like')
  async unlikePost(@Param('id') id: string, @CurrentUser() user: User) {
    return this.postsService.unlike(id, user.id);
  }

  @Post(':id/comment')
  async commentOnPost(
    @Param('id') id: string,
    @Body() commentDto: CreateCommentDto,
    @CurrentUser() user: User,
  ) {
    return this.postsService.addComment(id, {
      ...commentDto,
      userId: user.id,
      userName: user.user_metadata?.name || user.email,
    });
  }
}
```

---

## 📦 Example 7: Custom Permissions

For more granular control, you can create a custom permissions guard:

```typescript
// permissions.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';
export const Permissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

// permissions.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Get user permissions from metadata
    const userPermissions = user.user_metadata?.permissions || [];

    return requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
    );
  }
}

// Usage in controller
@Controller('sensitive')
export class SensitiveController {
  @Post()
  @UseGuards(PermissionsGuard)
  @Permissions('create:sensitive-data', 'write:database')
  async createSensitiveData(@CurrentUser() user: User) {
    // User must have both permissions
  }
}
```

---

## 🎯 Key Takeaways

1. **Public routes**: Use `@Public()` for routes that don't need authentication
2. **Protected routes**: All routes are protected by default via global `AuthGuard`
3. **User data**: Access authenticated user via `@CurrentUser()`
4. **Role-based**: Use `@UseGuards(RolesGuard)` + `@Roles()` for role checks
5. **Custom logic**: Check ownership or custom permissions in controller methods

---

**Need more examples?** Check out the [AUTHENTICATION.md](./AUTHENTICATION.md) guide!

