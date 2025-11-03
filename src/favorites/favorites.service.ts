import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { Favorite } from './entities/favorite.entity';

@Injectable()
export class FavoritesService {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Add a coin to user's favorites
   */
  async addFavorite(userId: string, coinId: string): Promise<Favorite> {
    if (!this.isValidUUID(coinId)) {
      throw new BadRequestException('Invalid coin ID format');
    }

    const client = this.databaseService.getClient();

    // Check if coin exists
    const { data: coin, error: coinError } = await client
      .from('coins')
      .select('id')
      .eq('id', coinId)
      .single();

    if (coinError || !coin) {
      throw new NotFoundException(`Coin with ID "${coinId}" not found`);
    }

    // Check if already favorited
    const { data: existing } = await client
      .from('favorites')
      .select('*')
      .eq('user_id', userId)
      .eq('coin_id', coinId)
      .single();

    if (existing) {
      throw new ConflictException('Coin is already in favorites');
    }

    // Add to favorites
    const { data, error } = await client
      .from('favorites')
      .insert([{ user_id: userId, coin_id: coinId }])
      .select()
      .single();

    if (error) {
      throw new InternalServerErrorException(
        `Failed to add favorite: ${error.message}`,
      );
    }

    return data as Favorite;
  }

  /**
   * Remove a coin from user's favorites
   */
  async removeFavorite(userId: string, coinId: string): Promise<void> {
    if (!this.isValidUUID(coinId)) {
      throw new BadRequestException('Invalid coin ID format');
    }

    const client = this.databaseService.getClient();

    // Check if favorite exists
    const { data: existing } = await client
      .from('favorites')
      .select('*')
      .eq('user_id', userId)
      .eq('coin_id', coinId)
      .single();

    if (!existing) {
      throw new NotFoundException('Favorite not found');
    }

    // Remove from favorites
    const { error } = await client
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('coin_id', coinId);

    if (error) {
      throw new InternalServerErrorException(
        `Failed to remove favorite: ${error.message}`,
      );
    }
  }

  /**
   * Get all favorite coins for a user
   */
  async getUserFavorites(userId: string): Promise<string[]> {
    const client = this.databaseService.getClient();

    const { data, error } = await client
      .from('favorites')
      .select('coin_id')
      .eq('user_id', userId);

    if (error) {
      throw new InternalServerErrorException(
        `Failed to fetch favorites: ${error.message}`,
      );
    }

    return (data || []).map((fav) => fav.coin_id);
  }

  /**
   * Check if specific coins are favorited by user
   */
  async checkFavorites(
    userId: string,
    coinIds: string[],
  ): Promise<Map<string, boolean>> {
    const client = this.databaseService.getClient();

    const { data, error } = await client
      .from('favorites')
      .select('coin_id')
      .eq('user_id', userId)
      .in('coin_id', coinIds);

    if (error) {
      throw new InternalServerErrorException(
        `Failed to check favorites: ${error.message}`,
      );
    }

    const favoriteMap = new Map<string, boolean>();
    coinIds.forEach((id) => favoriteMap.set(id, false));
    (data || []).forEach((fav) => favoriteMap.set(fav.coin_id, true));

    return favoriteMap;
  }

  /**
   * Get user's favorite coins with full details
   */
  async getUserFavoriteCoinsWithDetails(userId: string) {
    const client = this.databaseService.getClient();

    const { data, error } = await client
      .from('favorites')
      .select(
        `
        id,
        created_at,
        coins (*)
      `,
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new InternalServerErrorException(
        `Failed to fetch favorite coins: ${error.message}`,
      );
    }

    return data;
  }

  private isValidUUID(uuid: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
}
