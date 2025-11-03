import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { AddFavoriteDto } from './dto/add-favorite.dto';
import { CurrentUser } from '../auth/decorators';
import { User } from '@supabase/supabase-js';

@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async addFavorite(
    @Body() addFavoriteDto: AddFavoriteDto,
    @CurrentUser() user: User,
  ) {
    return this.favoritesService.addFavorite(user.id, addFavoriteDto.coin_id);
  }

  @Delete(':coinId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeFavorite(
    @Param('coinId') coinId: string,
    @CurrentUser() user: User,
  ) {
    await this.favoritesService.removeFavorite(user.id, coinId);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async getUserFavorites(@CurrentUser() user: User) {
    return this.favoritesService.getUserFavoriteCoinsWithDetails(user.id);
  }

  @Get('ids')
  @HttpCode(HttpStatus.OK)
  async getUserFavoriteIds(@CurrentUser() user: User) {
    const coinIds = await this.favoritesService.getUserFavorites(user.id);
    return { coin_ids: coinIds };
  }
}
