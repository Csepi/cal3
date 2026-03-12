import { SetMetadata } from '@nestjs/common';

export const ALLOW_INCOMPLETE_ONBOARDING_KEY =
  'allowIncompleteOnboarding';

export const AllowIncompleteOnboarding = (): MethodDecorator &
  ClassDecorator =>
  SetMetadata(ALLOW_INCOMPLETE_ONBOARDING_KEY, true);
