import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class EmailTemplateService {
  private readonly templatesRoot = path.join(
    __dirname,
    '..',
    'templates',
    'emails',
  );

  resolveTemplateName(eventType: string): string {
    const normalized = eventType.toLowerCase();
    if (normalized.includes('booking')) {
      return 'booking-confirmation';
    }
    if (normalized.includes('password')) {
      return 'password-reset';
    }
    return 'event-reminder';
  }

  renderTemplate(
    templateName: string,
    language: string,
    variables: Record<string, unknown>,
  ): string {
    const templateSource =
      this.readTemplate(language, templateName) ??
      this.readTemplate('en', templateName) ??
      '<p>{{body}}</p>';

    return templateSource.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_match, key) => {
      const value = variables[key];
      return value === undefined || value === null ? '' : String(value);
    });
  }

  private readTemplate(language: string, templateName: string): string | null {
    const filePath = path.join(
      this.templatesRoot,
      language,
      `${templateName}.hbs`,
    );

    if (!fs.existsSync(filePath)) {
      return null;
    }

    try {
      return fs.readFileSync(filePath, 'utf8');
    } catch {
      return null;
    }
  }
}

