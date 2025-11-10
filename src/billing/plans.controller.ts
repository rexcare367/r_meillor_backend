import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PlansService } from './plans.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { Public, Roles } from '../auth/decorators';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('billing/plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Public()
  @Get()
  async findAll(@Query('onlyActive') onlyActive?: string) {
    const options = {
      onlyActive: onlyActive === 'true' || onlyActive === undefined,
    };
    return this.plansService.findAll(options);
  }

  @Public()
  @Get('all')
  async findAllPlans() {
    return this.plansService.findAll({ onlyActive: false });
  }

  @Public()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.plansService.findOne(id);
  }

  @Post()
  @Roles('admin')
  @UseGuards(RolesGuard)
  async create(@Body() createPlanDto: CreatePlanDto) {
    return this.plansService.create(createPlanDto);
  }

  @Public()
  @Post('sync')
  async syncPlans() {
    return this.plansService.syncAllFromStripe();
  }

  @Patch(':id')
  @Roles('admin')
  @UseGuards(RolesGuard)
  async update(@Param('id') id: string, @Body() updatePlanDto: UpdatePlanDto) {
    return this.plansService.update(id, updatePlanDto);
  }

  @Delete(':id')
  @Roles('admin')
  @UseGuards(RolesGuard)
  async remove(@Param('id') id: string) {
    await this.plansService.remove(id);
    return { success: true };
  }
}
