import { applyDecorators, UseGuards, UsePipes } from '@nestjs/common';
import { PublicBookingGuard } from '../guards/public-booking.guard';
import { PublicBookingValidationPipe } from '../pipes/public-booking-validation.pipe';

export const ValidatePublicBooking = () =>
  applyDecorators(
    UseGuards(PublicBookingGuard),
    UsePipes(new PublicBookingValidationPipe()),
  );
