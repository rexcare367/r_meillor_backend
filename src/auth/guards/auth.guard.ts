import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from '../auth.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * AuthGuard - Verifies Supabase access tokens
 *
 * Workflow:
 * 1. Extract Authorization header from request
 * 2. Verify token using Supabase Admin API (auth.getUser)
 * 3. Attach verified user to request object
 * 4. Allow public routes to optionally include user if authenticated
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Extract Authorization header
    const authHeader = request.headers.authorization;

    // If public route and no auth header, allow access without user
    if (isPublic && !authHeader) {
      return true;
    }

    // If not public route and no auth header, deny access
    if (!isPublic && !authHeader) {
      throw new UnauthorizedException('Missing authorization header');
    }

    // Extract token from "Bearer <token>"
    const token = authHeader?.split(' ')[1];

    if (!token) {
      if (isPublic) {
        return true;
      }
      throw new UnauthorizedException('Invalid authorization format');
    }

    try {
      // Verify token with Supabase Admin API
      const user = await this.authService.verifyToken(token);
      const role = this.authService.getUserRole(user);

      // Attach user and role to request object for use in controllers
      request.user = user;
      request.userRole = role;

      return true;
    } catch {
      // If public route and token is invalid, allow access without user
      if (isPublic) {
        return true;
      }
      // If protected route and token is invalid, deny access
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
