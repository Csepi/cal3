import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { NotificationChannelProvider, NotificationChannelContext, NotificationChannelSkipError } from './notification-channel.interface';

@Injectable()
export class EmailChannelProvider implements NotificationChannelProvider {
  readonly channel = 'email' as const;

  private readonly logger = new Logger(EmailChannelProvider.name);
  private transporter: nodemailer.Transporter | null = null;
  private configuredProvider: string | null = null;

  constructor(private readonly configService: ConfigService) {}

  async canSend(): Promise<boolean> {
    await this.ensureTransporter();
    return this.transporter !== null;
  }

  async send({ message }: NotificationChannelContext): Promise<void> {
    await this.ensureTransporter();

    if (!this.transporter) {
      throw new NotificationChannelSkipError('Email provider not configured');
    }

    if (!message.user || !message.user.email) {
      throw new NotificationChannelSkipError('Recipient email not available');
    }

    const subject = message.title
      ? message.title
      : `Notification (${message.eventType})`;

    const textBody = message.body;
    const htmlBody = `<p>${message.body.replace(/\n/g, '<br/>')}</p>`;

    try {
      await this.transporter.sendMail({
        from: this.resolveFromAddress(),
        to: message.user.email,
        subject,
        text: textBody,
        html: htmlBody,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${message.user.email}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  private async ensureTransporter(): Promise<void> {
    const provider = this.configService.get<string>('EMAIL_PROVIDER') || 'smtp';

    if (this.transporter && this.configuredProvider === provider) {
      return;
    }

    if (provider !== 'smtp') {
      this.logger.warn(
        `Email provider ${provider} not implemented yet. Falling back to skip behaviour.`,
      );
      this.transporter = null;
      this.configuredProvider = provider;
      return;
    }

    const host = this.configService.get<string>('SMTP_HOST');
    const port = Number(this.configService.get<string>('SMTP_PORT') || '587');
    const secure =
      (this.configService.get<string>('SMTP_SECURE') || 'false') === 'true';
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASSWORD');

    if (!host || !user || !pass) {
      this.logger.warn('SMTP configuration incomplete; email channel disabled.');
      this.transporter = null;
      this.configuredProvider = provider;
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });

    this.configuredProvider = provider;
  }

  private resolveFromAddress(): string {
    const user = this.configService.get<string>('SMTP_USER');
    if (!user) {
      return 'no-reply@cal3.local';
    }

    return user;
  }
}
