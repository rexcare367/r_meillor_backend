import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateCoinDto } from './dto/create-coin.dto';
import { UpdateCoinDto } from './dto/update-coin.dto';
import { QueryCoinsDto } from './dto/query-coins.dto';
import { Coin } from './entities/coin.entity';

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

@Injectable()
export class CoinsService {
  constructor(private readonly databaseService: DatabaseService) {}

  async findAll(queryDto: QueryCoinsDto): Promise<PaginatedResponse<Coin>> {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'created_at',
      sortOrder = 'desc',
      category,
      material,
      origin_country,
      condition,
      minYear,
      maxYear,
      minPrice,
      maxPrice,
      is_sold,
      is_featured,
      is_new,
      lsp_eligible,
    } = queryDto;

    const client = this.databaseService.getClient();
    let query = client.from('coins').select('*', { count: 'exact' });

    // Apply search filter (searches across multiple text fields)
    if (search) {
      query = query.or(
        `name.ilike.%${search}%,sub_name.ilike.%${search}%,category.ilike.%${search}%,reference.ilike.%${search}%,material.ilike.%${search}%,origin_country.ilike.%${search}%`,
      );
    }

    // Apply category filter
    if (category) {
      query = query.eq('category', category);
    }

    // Apply material filter
    if (material) {
      query = query.eq('material', material);
    }

    // Apply origin_country filter
    if (origin_country) {
      query = query.eq('origin_country', origin_country);
    }

    // Apply condition filter
    if (condition) {
      query = query.eq('condition', condition);
    }

    // Apply year range filters
    if (minYear) {
      query = query.gte('year', minYear);
    }
    if (maxYear) {
      query = query.lte('year', maxYear);
    }

    // Apply price range filters
    if (minPrice) {
      query = query.gte('price_eur', minPrice);
    }
    if (maxPrice) {
      query = query.lte('price_eur', maxPrice);
    }

    // Apply boolean filters
    if (is_sold !== undefined) {
      query = query.eq('is_sold', is_sold === 'true');
    }
    if (is_featured !== undefined) {
      query = query.eq('is_featured', is_featured === 'true');
    }
    if (is_new !== undefined) {
      query = query.eq('is_new', is_new === 'true');
    }
    if (lsp_eligible !== undefined) {
      query = query.eq('lsp_eligible', lsp_eligible === 'true');
    }

    // Apply sorting
    const ascending = sortOrder === 'asc';
    query = query.order(sortBy, { ascending });

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      throw new InternalServerErrorException(
        `Failed to fetch coins: ${error.message}`,
      );
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      data: data as Coin[],
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  async findOne(id: string): Promise<Coin> {
    if (!this.isValidUUID(id)) {
      throw new BadRequestException('Invalid UUID format');
    }

    const client = this.databaseService.getClient();
    const { data, error } = await client
      .from('coins')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Coin with ID "${id}" not found`);
    }

    return data as Coin;
  }

  async create(createCoinDto: CreateCoinDto): Promise<Coin> {
    const client = this.databaseService.getClient();
    const { data, error } = await client
      .from('coins')
      .insert([createCoinDto])
      .select()
      .single();

    if (error) {
      throw new InternalServerErrorException(
        `Failed to create coin: ${error.message}`,
      );
    }

    return data as Coin;
  }

  async update(id: string, updateCoinDto: UpdateCoinDto): Promise<Coin> {
    if (!this.isValidUUID(id)) {
      throw new BadRequestException('Invalid UUID format');
    }

    // First check if coin exists
    await this.findOne(id);

    const client = this.databaseService.getClient();
    const { data, error } = await client
      .from('coins')
      .update({
        ...updateCoinDto,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new InternalServerErrorException(
        `Failed to update coin: ${error.message}`,
      );
    }

    return data as Coin;
  }

  async remove(id: string): Promise<void> {
    if (!this.isValidUUID(id)) {
      throw new BadRequestException('Invalid UUID format');
    }

    // First check if coin exists
    await this.findOne(id);

    const client = this.databaseService.getClient();
    const { error } = await client.from('coins').delete().eq('id', id);

    if (error) {
      throw new InternalServerErrorException(
        `Failed to delete coin: ${error.message}`,
      );
    }
  }

  async getStatistics() {
    const client = this.databaseService.getClient();

    const [totalCoins, soldCoins, featuredCoins, newCoins] = await Promise.all(
      [
        client.from('coins').select('*', { count: 'exact', head: true }),
        client
          .from('coins')
          .select('*', { count: 'exact', head: true })
          .eq('is_sold', true),
        client
          .from('coins')
          .select('*', { count: 'exact', head: true })
          .eq('is_featured', true),
        client
          .from('coins')
          .select('*', { count: 'exact', head: true })
          .eq('is_new', true),
      ],
    );

    return {
      total: totalCoins.count || 0,
      sold: soldCoins.count || 0,
      featured: featuredCoins.count || 0,
      new: newCoins.count || 0,
    };
  }

  private isValidUUID(uuid: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
}

