import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  private supabaseAdmin: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseServiceKey = this.configService.get<string>(
      'SUPABASE_SERVICE_ROLE_KEY',
    );

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error(
        'Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY',
      );
    }

    this.supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  }

  /**
   * Verify JWT token from Supabase and return user data
   * Uses Supabase Admin client to verify the access token
   */
  async verifyToken(token: string): Promise<User> {
    console.log('token', token);
    const { data, error } = await this.supabaseAdmin.auth.getUser(token);
    console.log('data, error', data, error);
    if (error || !data.user) {
      throw new UnauthorizedException('Invalid or expired token');
    }
    return data.user;
  }

  /**
   * Get user metadata including custom claims (roles, permissions)
   */
  getUserMetadata(user: User): Record<string, any> {
    return user.user_metadata || {};
  }

  /**
   * Get user role from metadata or app_metadata
   */
  getUserRole(user: User): string {
    // Check app_metadata first (set by Supabase admin)
    const appMetadata = (user as any).app_metadata || {};
    if (appMetadata.role) {
      return appMetadata.role;
    }

    // Fallback to user_metadata
    const userMetadata = user.user_metadata || {};
    return userMetadata.role || 'user'; // default role
  }

  /**
   * Get Supabase client for database operations (admin level)
   */
  getSupabaseClient(): SupabaseClient {
    return this.supabaseAdmin;
  }
}
