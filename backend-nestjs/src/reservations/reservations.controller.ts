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
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReservationAccessGuard } from '../auth/guards/reservation-access.guard';
import { ReservationsService } from './reservations.service';
import {
  CreateReservationDto,
  UpdateReservationDto,
} from '../dto/reservation.dto';
import { UserPermissionsService } from '../common/services/user-permissions.service';
import { IdempotencyService } from '../common/services/idempotency.service';

@Controller('reservations')
@UseGuards(JwtAuthGuard, ReservationAccessGuard) // Require both authentication and reservation access
export class ReservationsController {
  constructor(
    private readonly reservationsService: ReservationsService,
    private readonly userPermissionsService: UserPermissionsService,
    private readonly idempotencyService: IdempotencyService,
  ) {}

  @Post()
  async create(@Body() createDto: CreateReservationDto, @Req() req) {
    const key =
      (req.headers['idempotency-key'] as string) ||
      (req.headers['x-idempotency-key'] as string);
    return this.idempotencyService.execute(
      {
        key,
        scope: 'reservations:create',
        userId: req.user.id,
        payload: createDto,
      },
      () => this.reservationsService.create(createDto, req.user.id),
    );
  }

  @Get()
  async findAll(@Query('resourceId') resourceId?: string) {
    return await this.reservationsService.findAll(
      resourceId ? +resourceId : undefined,
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.reservationsService.findOne(+id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateReservationDto,
    @Req() req,
  ) {
    return await this.reservationsService.update(+id, updateDto, req.user.id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req) {
    await this.reservationsService.remove(+id, req.user.id);
    return { message: 'Reservation deleted successfully' };
  }
}
