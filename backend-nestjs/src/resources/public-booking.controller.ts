import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { PublicBookingService } from './public-booking.service';
import { CreatePublicBookingDto } from '../dto/public-booking.dto';
import { ValidatePublicBooking } from '../common/decorators/validate-public-booking.decorator';
import { PublicBookingAvailabilityQueryDto } from '../common/pipes/public-booking-validation.pipe';

/**
 * PublicBookingController
 *
 * Handles public booking operations WITHOUT authentication.
 * These endpoints are accessible to anyone with a valid booking token.
 *
 * Security considerations:
 * - No sensitive data is exposed
 * - Token-based access control
 * - Rate limiting should be applied at nginx/gateway level
 * - CAPTCHA can be added to POST endpoint
 */
@Controller('public/booking')
export class PublicBookingController {
  constructor(private readonly publicBookingService: PublicBookingService) {}

  /**
   * Get resource information by public booking token
   * @example GET /api/public/booking/abc123-def456-ghi789
   */
  @Get(':token')
  @ValidatePublicBooking()
  async getResourceByToken(@Param('token') token: string) {
    return await this.publicBookingService.getResourceByToken(token);
  }

  /**
   * Get available time slots for a specific date
   * @example GET /api/public/booking/abc123-def456-ghi789/availability?date=2025-10-01
   */
  @Get(':token/availability')
  @ValidatePublicBooking()
  async getAvailability(
    @Param('token') token: string,
    @Query() query: PublicBookingAvailabilityQueryDto,
  ) {
    return await this.publicBookingService.getAvailability(token, query.date);
  }

  /**
   * Create a new public booking
   * @example POST /api/public/booking/abc123-def456-ghi789/reserve
   */
  @Post(':token/reserve')
  @ValidatePublicBooking()
  async createBooking(
    @Param('token') token: string,
    @Body() bookingDto: CreatePublicBookingDto,
  ) {
    return await this.publicBookingService.createPublicBooking(
      token,
      bookingDto,
    );
  }
}
