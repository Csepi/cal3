import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReservationAccessGuard } from '../auth/guards/reservation-access.guard';
import { ReservationsService } from './reservations.service';
import {
  CreateReservationDto,
  UpdateReservationDto,
} from '../dto/reservation.dto';
import type { RequestWithUser } from '../common/types/request-with-user';
import { ListReservationsQueryDto } from './dto/list-reservations.query.dto';

@Controller('reservations')
@UseGuards(JwtAuthGuard, ReservationAccessGuard) // Require both authentication and reservation access
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  async create(
    @Body() createDto: CreateReservationDto,
    @Req() req: RequestWithUser,
  ) {
    return this.reservationsService.create(createDto, req.user.id);
  }

  @Get()
  async findAll(@Query() query: ListReservationsQueryDto) {
    return await this.reservationsService.findAll(query.resourceId);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.reservationsService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateReservationDto,
    @Req() req: RequestWithUser,
  ) {
    return await this.reservationsService.update(id, updateDto, req.user.id);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: RequestWithUser) {
    await this.reservationsService.remove(id, req.user.id);
    return { message: 'Reservation deleted successfully' };
  }
}
