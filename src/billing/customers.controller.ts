import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CustomersService } from './customers.service';
import { SyncCustomerDto } from './dto/sync-customer.dto';
import { UpdateCustomerMetadataDto } from './dto/update-customer-metadata.dto';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { CurrentUser, Public, Roles } from '../auth/decorators';
import { User } from '@supabase/supabase-js';
import { RequestWithUser } from '../auth/interfaces/request-with-user.interface';
import { RolesGuard } from '../auth/guards/roles.guard';

const ADMIN_ROLES = ['admin', 'super_admin', 'owner'];

@Controller('billing/customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post('sync')
  async syncCustomer(
    @Body() dto: SyncCustomerDto,
    @CurrentUser() user: User,
    @Req() req: RequestWithUser,
  ) {
    const isAdmin = this.isAdmin(req?.userRole);
    const targetUserId = dto.user_id && isAdmin ? dto.user_id : user.id;

    const record = await this.customersService.ensureCustomer({
      userId: targetUserId,
      email: dto.email,
      name:
        dto.name ?? user.user_metadata?.full_name ?? user.email ?? undefined,
      metadata: dto.metadata,
    });

    return record;
  }

  @Public()
  @Post()
  async createCustomer(@Body() dto: CreateCustomerDto) {
    return this.customersService.ensureCustomer({
      userId: dto.user_id,
      email: dto.email,
      name: dto.name,
      metadata: dto.metadata,
    });
  }

  @Get('me')
  async getMyCustomer(@CurrentUser() user: User) {
    return this.customersService.findByUserId(user.id);
  }

  @Patch('me/metadata')
  async updateMyCustomerMetadata(
    @CurrentUser() user: User,
    @Body() dto: UpdateCustomerMetadataDto,
  ) {
    return this.customersService.updateCustomerMetadata(user.id, dto.metadata);
  }

  @Delete('me')
  async deleteMyCustomer(@CurrentUser() user: User) {
    await this.customersService.deleteCustomer(user.id, false);
    return { success: true };
  }

  @Get(':userId')
  @Roles('admin')
  @UseGuards(RolesGuard)
  async getCustomerForUser(@Param('userId') userId: string) {
    const record = await this.customersService.findByUserId(userId);
    if (!record) {
      return { user_id: userId, stripe_customer_id: null };
    }
    return record;
  }

  @Patch(':userId/metadata')
  @Roles('admin')
  @UseGuards(RolesGuard)
  async updateCustomerMetadataForUser(
    @Param('userId') userId: string,
    @Body() dto: UpdateCustomerMetadataDto,
  ) {
    return this.customersService.updateCustomerMetadata(userId, dto.metadata);
  }

  @Delete(':userId')
  @Roles('admin')
  @UseGuards(RolesGuard)
  async deleteCustomerForUser(@Param('userId') userId: string) {
    await this.customersService.deleteCustomer(userId, true);
    return { success: true };
  }

  private isAdmin(role?: string): boolean {
    if (!role) {
      return false;
    }
    return ADMIN_ROLES.includes(role.toLowerCase());
  }
}
