import { Controller, Get } from '@nestjs/common';
import { FeatureFlagsService } from './feature-flags.service';

/**
 * Feature Flags Controller
 *
 * Provides a public endpoint for retrieving feature flag status.
 * This allows the frontend to dynamically adjust UI based on enabled features.
 *
 * Endpoints:
 * - GET /api/feature-flags - Returns all feature flag states
 */
@Controller('feature-flags')
export class FeatureFlagsController {
  constructor(private readonly featureFlagsService: FeatureFlagsService) {}

  /**
   * Get all feature flags
   * This endpoint is public (no authentication required) to allow
   * the login page to check OAuth availability
   *
   * @returns Object containing all feature flag states
   */
  @Get()
  getFeatureFlags() {
    return this.featureFlagsService.getAllFeatureFlags();
  }
}
