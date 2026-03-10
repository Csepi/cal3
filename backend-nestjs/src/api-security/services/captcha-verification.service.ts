import { Injectable, Logger } from '@nestjs/common';

interface CaptchaResponse {
  success?: boolean;
  score?: number;
}

@Injectable()
export class CaptchaVerificationService {
  private readonly logger = new Logger(CaptchaVerificationService.name);
  private readonly provider = (
    process.env.CAPTCHA_PROVIDER ?? 'none'
  ).toLowerCase();
  private readonly secret = process.env.CAPTCHA_SECRET?.trim() ?? '';
  private readonly verifyUrl =
    process.env.CAPTCHA_VERIFY_URL?.trim() ||
    (this.provider === 'turnstile'
      ? 'https://challenges.cloudflare.com/turnstile/v0/siteverify'
      : 'https://www.google.com/recaptcha/api/siteverify');
  private readonly minScore = Number.isFinite(
    Number(process.env.CAPTCHA_MIN_SCORE),
  )
    ? Number(process.env.CAPTCHA_MIN_SCORE)
    : 0.5;

  async verify(token: string | undefined, remoteIp?: string): Promise<boolean> {
    if (this.provider === 'none') {
      return true;
    }
    if (!this.secret) {
      this.logger.warn(
        'CAPTCHA provider configured but CAPTCHA_SECRET is missing.',
      );
      return false;
    }
    if (!token || token.trim().length === 0) {
      return false;
    }

    try {
      const body = new URLSearchParams();
      body.set('secret', this.secret);
      body.set('response', token.trim());
      if (remoteIp) {
        body.set('remoteip', remoteIp);
      }

      const response = await fetch(this.verifyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });
      if (!response.ok) {
        return false;
      }

      const payload = (await response.json()) as CaptchaResponse;
      if (payload.success !== true) {
        return false;
      }

      if (typeof payload.score === 'number' && payload.score < this.minScore) {
        return false;
      }

      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Captcha verification failed: ${message}`);
      return false;
    }
  }
}
