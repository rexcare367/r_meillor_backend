import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { CoinsService } from './coins.service';
import { CreateCoinDto } from './dto/create-coin.dto';
import { UpdateCoinDto } from './dto/update-coin.dto';
import { QueryCoinsDto } from './dto/query-coins.dto';
import { CurrentUser, Public, Roles } from '../auth/decorators';
import { RolesGuard } from '../auth/guards/roles.guard';
import { User } from '@supabase/supabase-js';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

@Controller('coins')
export class CoinsController {
  constructor(
    private readonly coinsService: CoinsService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  @Get()
  @Public() // Public route - no authentication required
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query(new ValidationPipe({ transform: true })) queryDto: QueryCoinsDto,
    @CurrentUser() user?: User,
  ) {
    // Check if user has premium subscription
    let isPremium = false;
    if (user) {
      const activeSubscription = await this.subscriptionsService.findMyActive(
        user.id,
      );
      isPremium = !!activeSubscription;
    }

    // Apply different limits based on authentication status
    if (user) {
      // Authenticated users: default to 20 if not specified
      if (!queryDto.limit || queryDto.limit === 10) {
        queryDto.limit = 20;
      }
      // They can request up to 100 (validated by DTO)
    } else {
      // Unauthenticated users: cap at 5 regardless of what they request
      queryDto.limit = Math.min(queryDto.limit || 5, 5);
    }
    // Pass user ID and premium status to service
    return this.coinsService.findAll(queryDto, user?.id, isPremium);
  }

  @Get('statistics')
  @Public() // Public route - no authentication required
  @HttpCode(HttpStatus.OK)
  async getStatistics() {
    return this.coinsService.getStatistics();
  }

  @Get(':id')
  @Public() // Public route - no authentication required
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string, @CurrentUser() user?: User) {
    // Check if user has premium subscription
    let isPremium = false;
    if (user) {
      const activeSubscription = await this.subscriptionsService.findMyActive(
        user.id,
      );
      isPremium = !!activeSubscription;
    }
    // Pass user ID and premium status to service
    return this.coinsService.findOne(id, user?.id, isPremium);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createCoinDto: CreateCoinDto,
    @CurrentUser() user: User,
  ) {
    // User is automatically authenticated via global AuthGuard
    console.log('Authenticated user:', user.email);
    return this.coinsService.create(createCoinDto);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body() updateCoinDto: UpdateCoinDto,
    @CurrentUser() user: User,
  ) {
    // User is automatically authenticated via global AuthGuard
    console.log('Authenticated user:', user.email);
    return this.coinsService.update(id, updateCoinDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin') // Only admins can delete coins
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @CurrentUser() user: User) {
    // User must be admin to access this route
    console.log('Admin user deleting coin:', user.email);
    await this.coinsService.remove(id);
  }
}
