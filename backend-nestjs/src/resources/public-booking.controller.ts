import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { PublicBookingService } from './public-booking.service';
import {
  CreatePublicBookingDto,
  AvailabilityQueryDto,
} from '../dto/public-booking.dto';

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
  async getResourceByToken(@Param('token') token: string) {
    return await this.publicBookingService.getResourceByToken(token);
  }

  /**
   * Get available time slots for a specific date
   * @example GET /api/public/booking/abc123-def456-ghi789/availability?date=2025-10-01
   */
  @Get(':token/availability')
  async getAvailability(
    @Param('token') token: string,
    @Query('date') date: string,
  ) {
    if (!date) {
      return { error: 'Date parameter is required (format: YYYY-MM-DD)' };
    }

    return await this.publicBookingService.getAvailability(token, date);
  }

  /**
   * Create a new public booking
   * @example POST /api/public/booking/abc123-def456-ghi789/reserve
   */
  @Post(':token/reserve')
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
