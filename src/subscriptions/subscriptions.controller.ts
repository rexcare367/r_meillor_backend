import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { User } from '@supabase/supabase-js';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { PauseSubscriptionDto } from './dto/pause-subscription.dto';
import { ResumeSubscriptionDto } from './dto/resume-subscription.dto';
import { CancelSubscriptionDto } from './dto/cancel-subscription.dto';
import { QuerySubscriptionsDto } from './dto/query-subscriptions.dto';
import { CurrentUser, Roles } from '../auth/decorators';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

const ADMIN_ROLES = ['admin', 'super_admin', 'owner'];

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post()
  async createSubscription(
    @Body() createSubscriptionDto: CreateSubscriptionDto,
    @CurrentUser() user: User,
    @Req() req: RequestWithUser,
  ) {
    const isAdmin = this.isAdmin(req?.userRole);
    return this.subscriptionsService.create(
      user,
      createSubscriptionDto,
      isAdmin,
    );
  }

  @Get('me')
  async getMySubscriptions(@CurrentUser() user: User) {
    return this.subscriptionsService.findMine(user.id);
  }

  @Get('me/active')
  async getMyActiveSubscription(@CurrentUser() user: User) {
    return this.subscriptionsService.findMyActive(user.id);
  }

  @Get()
  @Roles('admin')
  @UseGuards(RolesGuard)
  async getAll(@Query() query: QuerySubscriptionsDto) {
    return this.subscriptionsService.findAll(query);
  }

  @Get('user/:userId')
  @Roles('admin')
  @UseGuards(RolesGuard)
  async getByUser(@Param('userId') userId: string) {
    return this.subscriptionsService.findByUserId(userId);
  }

  @Get(':id')
  async getSubscription(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Req() req: RequestWithUser,
  ) {
    const isAdmin = this.isAdmin(req?.userRole);
    return this.subscriptionsService.findOne(id, user.id, isAdmin);
  }

  @Patch(':id')
  async updateSubscription(
    @Param('id') id: string,
    @Body() updateSubscriptionDto: UpdateSubscriptionDto,
    @CurrentUser() user: User,
    @Req() req: RequestWithUser,
  ) {
    const isAdmin = this.isAdmin(req?.userRole);
    return this.subscriptionsService.update(
      id,
      user.id,
      updateSubscriptionDto,
      isAdmin,
    );
  }

  @Post(':id/pause')
  async pauseSubscription(
    @Param('id') id: string,
    @Body() pauseSubscriptionDto: PauseSubscriptionDto,
    @CurrentUser() user: User,
    @Req() req: RequestWithUser,
  ) {
    const isAdmin = this.isAdmin(req?.userRole);
    return this.subscriptionsService.pause(
      id,
      user.id,
      pauseSubscriptionDto,
      isAdmin,
    );
  }

  @Post(':id/resume')
  async resumeSubscription(
    @Param('id') id: string,
    @Body() resumeSubscriptionDto: ResumeSubscriptionDto,
    @CurrentUser() user: User,
    @Req() req: RequestWithUser,
  ) {
    const isAdmin = this.isAdmin(req?.userRole);
    return this.subscriptionsService.resume(
      id,
      user.id,
      resumeSubscriptionDto,
      isAdmin,
    );
  }

  @Post(':id/cancel')
  async cancelSubscription(
    @Param('id') id: string,
    @Body() cancelSubscriptionDto: CancelSubscriptionDto,
    @CurrentUser() user: User,
    @Req() req: RequestWithUser,
  ) {
    const isAdmin = this.isAdmin(req?.userRole);
    return this.subscriptionsService.cancel(
      id,
      user.id,
      cancelSubscriptionDto,
      isAdmin,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSubscription(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Req() req: RequestWithUser,
  ) {
    const isAdmin = this.isAdmin(req?.userRole);
    await this.subscriptionsService.remove(id, user.id, isAdmin);
  }

  private isAdmin(role?: string): boolean {
    if (!role) {
      return false;
    }
    return ADMIN_ROLES.includes(role.toLowerCase());
  }
}
