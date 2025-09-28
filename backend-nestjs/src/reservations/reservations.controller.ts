import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto, UpdateReservationDto } from '../dto/reservation.dto';

@Controller('reservations')
@UseGuards(JwtAuthGuard)
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  async create(@Body() createDto: CreateReservationDto, @Req() req) {
    return await this.reservationsService.create(createDto, req.user.id);
  }

  @Get()
  async findAll(@Query('resourceId') resourceId?: string) {
    return await this.reservationsService.findAll(resourceId ? +resourceId : undefined);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.reservationsService.findOne(+id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateReservationDto) {
    return await this.reservationsService.update(+id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.reservationsService.remove(+id);
    return { message: 'Reservation deleted successfully' };
  }
}