import { SetMetadata } from '@nestjs/common';

export const SKIP_IDEMPOTENCY_KEY = 'idempotency:skip';

export const SkipIdempotency = () => SetMetadata(SKIP_IDEMPOTENCY_KEY, true);
