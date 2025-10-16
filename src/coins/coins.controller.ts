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
import { JwtAuthGuard } from '../auth/guards/jwt.auth.guard';

@Controller('coins')
export class CoinsController {
  constructor(private readonly coinsService: CoinsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query(new ValidationPipe({ transform: true })) queryDto: QueryCoinsDto,
  ) {
    return this.coinsService.findAll(queryDto);
  }

  @Get('statistics')
  @HttpCode(HttpStatus.OK)
  async getStatistics() {
    return this.coinsService.getStatistics();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string) {
    return this.coinsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createCoinDto: CreateCoinDto) {
    return this.coinsService.create(createCoinDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async update(@Param('id') id: string, @Body() updateCoinDto: UpdateCoinDto) {
    return this.coinsService.update(id, updateCoinDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.coinsService.remove(id);
  }
}

