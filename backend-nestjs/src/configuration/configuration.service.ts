import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ConfigurationSetting,
  ConfigurationValueType,
} from '../entities/configuration-setting.entity';
import {
  CONFIGURATION_CATEGORY_METADATA,
  CONFIGURATION_DEFINITIONS,
  type ConfigurationCategoryKey,
  type ConfigurationDefinition,
} from './configuration.constants';

import { logError } from '../common/errors/error-logger';
import { buildErrorContext } from '../common/errors/error-context';
export interface AdminConfigurationSetting {
  key: string;
  label: string;
  description?: string;
  valueType: ConfigurationValueType;
  value: string | boolean | null;
  hasValue: boolean;
  isSensitive: boolean;
  isEditable: boolean;
  isReadOnly: boolean;
  options?: string[] | null;
  metadata?: Record<string, unknown> | null;
  updatedAt?: string | null;
}

export interface AdminConfigurationGroup {
  key: ConfigurationCategoryKey;
  label: string;
  description?: string;
  settings: AdminConfigurationSetting[];
}

export interface OAuthCallbackSummary {
  provider: 'google' | 'microsoft';
  authCallback: string;
  calendarSyncCallback: string;
}

export interface ConfigurationOverview {
  categories: AdminConfigurationGroup[];
  derived: {
    oauthCallbacks: OAuthCallbackSummary[];
    backendBaseUrl: string;
    frontendBaseUrl: string;
  };
}

@Injectable()
export class ConfigurationService implements OnModuleInit {
  private readonly logger = new Logger(ConfigurationService.name);

  private readonly definitionMap = new Map<string, ConfigurationDefinition>(
    CONFIGURATION_DEFINITIONS.map((definition) => [definition.key, definition]),
  );

  private readonly originalEnvValues = new Map<string, string | undefined>();

  private cache = new Map<string, ConfigurationSetting>();

  constructor(
    @InjectRepository(ConfigurationSetting)
    private readonly configurationRepository: Repository<ConfigurationSetting>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.ensureDefaults();
  }

  async ensureDefaults(): Promise<void> {
    const existingSettings = await this.configurationRepository.find();
    for (const setting of existingSettings) {
      this.cache.set(setting.key, setting);
      this.registerOriginalEnvValue(setting.key);
      this.applyToProcessEnv(setting);
    }

    for (const definition of CONFIGURATION_DEFINITIONS) {
      this.registerOriginalEnvValue(definition.key);
      const existing = this.cache.get(definition.key);
      const envValue = this.originalEnvValues.get(definition.key);
      const defaultValue =
        envValue !== undefined && envValue !== null && envValue !== ''
          ? envValue
          : (definition.defaultValue ?? null);

      if (!existing) {
        const created = this.configurationRepository.create({
          key: definition.key,
          value: defaultValue,
          label: definition.label,
          description: definition.description,
          valueType: definition.valueType,
          category: definition.category,
          isSensitive: definition.isSensitive ?? false,
          isEditable: definition.isEditable ?? true,
          isReadOnly: definition.isReadOnly ?? false,
          options: definition.options,
          metadata: definition.metadata,
        });
        const saved = await this.configurationRepository.save(created);
        this.cache.set(saved.key, saved);
        this.applyToProcessEnv(saved);
        continue;
      }

      const updated = this.mergeDefinition(existing, definition, defaultValue);
      if (updated) {
        const saved = await this.configurationRepository.save(updated);
        this.cache.set(saved.key, saved);
        this.applyToProcessEnv(saved);
      }
    }
  }

  getOverview(): ConfigurationOverview {
    const groups: AdminConfigurationGroup[] = Object.entries(
      CONFIGURATION_CATEGORY_METADATA,
    ).map(([key, value]) => {
      const groupKey = key as ConfigurationCategoryKey;
      const definitions = CONFIGURATION_DEFINITIONS.filter(
        (definition) => definition.category === groupKey,
      );
      const settings = definitions.map((definition) =>
        this.buildAdminSetting(definition),
      );
      return {
        key: groupKey,
        label: value.label,
        description: value.description,
        settings,
      };
    });

    return {
      categories: groups,
      derived: {
        oauthCallbacks: this.getOAuthCallbackSummary(),
        backendBaseUrl: this.getBackendBaseUrl(),
        frontendBaseUrl: this.getFrontendBaseUrl(),
      },
    };
  }

  async updateSetting(
    key: string,
    value: string | boolean | null,
  ): Promise<AdminConfigurationSetting> {
    const definition = this.definitionMap.get(key);
    if (!definition) {
      throw new NotFoundException(`Configuration entry "${key}" not found.`);
    }
    if (definition.isEditable === false || definition.isReadOnly === true) {
      throw new BadRequestException(
        `Configuration entry "${key}" is read-only.`,
      );
    }

    const normalizedValue = this.normalizeValue(definition, value);

    let setting = await this.configurationRepository.findOne({
      where: { key },
    });
    if (!setting) {
      setting = this.configurationRepository.create({
        key,
        value: normalizedValue,
        label: definition.label,
        description: definition.description,
        valueType: definition.valueType,
        category: definition.category,
        isSensitive: definition.isSensitive ?? false,
        isEditable: definition.isEditable ?? true,
        isReadOnly: definition.isReadOnly ?? false,
        options: definition.options,
        metadata: definition.metadata,
      });
    } else {
      setting.value = normalizedValue;
    }

    const saved = await this.configurationRepository.save(setting);
    this.cache.set(saved.key, saved);
    this.applyToProcessEnv(saved);
    return this.buildAdminSetting(definition);
  }

  getValue(key: string, fallback?: string | null): string | undefined {
    const cached = this.cache.get(key);
    if (cached) {
      const value = this.unwrapValue(cached.value);
      if (value !== null && value !== undefined) {
        return value;
      }
    }

    const original = this.originalEnvValues.get(key);
    if (original !== undefined && original !== null && original !== '') {
      return original;
    }

    const runtimeEnv = process.env[key];
    if (runtimeEnv !== undefined && runtimeEnv !== null && runtimeEnv !== '') {
      return runtimeEnv;
    }

    const definition = this.definitionMap.get(key);
    if (definition?.defaultValue) {
      return definition.defaultValue;
    }

    return fallback === undefined || fallback === null ? undefined : fallback;
  }

  getBoolean(key: string, fallback = false): boolean {
    const value = this.getValue(key);
    if (value === undefined || value === null || value === '') {
      return fallback;
    }
    const normalized = value.toString().trim().toLowerCase();
    return ['true', '1', 'yes', 'y', 'on'].includes(normalized);
  }

  getBackendBaseUrl(): string {
    const explicitBackend = this.getValue('BACKEND_URL');
    if (explicitBackend) {
      return this.normalizeBaseUrl(explicitBackend);
    }

    const baseUrl =
      this.getValue('BASE_URL') ?? process.env.BASE_URL ?? 'http://localhost';
    const backendPort =
      this.getValue('BACKEND_PORT') ??
      this.getValue('PORT') ??
      process.env.BACKEND_PORT ??
      process.env.PORT ??
      '8081';
    return this.ensurePort(baseUrl, backendPort);
  }

  getFrontendBaseUrl(): string {
    const explicitFrontend = this.getValue('FRONTEND_URL');
    if (explicitFrontend) {
      return this.normalizeBaseUrl(explicitFrontend);
    }

    const baseUrl =
      this.getValue('BASE_URL') ?? process.env.BASE_URL ?? 'http://localhost';
    const frontendPort =
      this.getValue('FRONTEND_PORT') ?? process.env.FRONTEND_PORT ?? '8080';
    return this.ensurePort(baseUrl, frontendPort);
  }

  getOAuthCallbackSummary(): OAuthCallbackSummary[] {
    const backendBase = this.getBackendBaseUrl();
    const googleCallback =
      this.getValue('GOOGLE_CALLBACK_URL') ??
      `${backendBase}/api/auth/google/callback`;
    const googleSyncCallback =
      this.getValue('GOOGLE_CALENDAR_SYNC_CALLBACK_URL') ??
      `${backendBase}/api/calendar-sync/callback/google`;

    const microsoftCallback =
      this.getValue('MICROSOFT_CALLBACK_URL') ??
      `${backendBase}/api/auth/microsoft/callback`;
    const microsoftSyncCallback =
      this.getValue('MICROSOFT_CALENDAR_SYNC_CALLBACK_URL') ??
      `${backendBase}/api/calendar-sync/callback/microsoft`;

    return [
      {
        provider: 'google',
        authCallback: this.normalizeCallbackUrl(googleCallback),
        calendarSyncCallback: this.normalizeCallbackUrl(googleSyncCallback),
      },
      {
        provider: 'microsoft',
        authCallback: this.normalizeCallbackUrl(microsoftCallback),
        calendarSyncCallback: this.normalizeCallbackUrl(microsoftSyncCallback),
      },
    ];
  }

  private mergeDefinition(
    setting: ConfigurationSetting,
    definition: ConfigurationDefinition,
    defaultValue: string | null,
  ): ConfigurationSetting | null {
    let changed = false;

    if (setting.label !== definition.label) {
      setting.label = definition.label;
      changed = true;
    }

    if (setting.description !== definition.description) {
      setting.description = definition.description;
      changed = true;
    }

    if (setting.valueType !== definition.valueType) {
      setting.valueType = definition.valueType;
      changed = true;
    }

    if (setting.category !== definition.category) {
      setting.category = definition.category;
      changed = true;
    }

    const shouldBeSensitive = definition.isSensitive ?? false;
    if (setting.isSensitive !== shouldBeSensitive) {
      setting.isSensitive = shouldBeSensitive;
      changed = true;
    }

    const shouldBeEditable = definition.isEditable ?? true;
    if (setting.isEditable !== shouldBeEditable) {
      setting.isEditable = shouldBeEditable;
      changed = true;
    }

    const shouldBeReadOnly = definition.isReadOnly ?? false;
    if (setting.isReadOnly !== shouldBeReadOnly) {
      setting.isReadOnly = shouldBeReadOnly;
      changed = true;
    }

    const optionsMatch =
      setting.options?.join('|') === definition.options?.join('|');
    if (!optionsMatch) {
      setting.options = definition.options;
      changed = true;
    }

    const metadataMatch =
      JSON.stringify(setting.metadata ?? null) ===
      JSON.stringify(definition.metadata ?? null);
    if (!metadataMatch) {
      setting.metadata = definition.metadata;
      changed = true;
    }

    if (
      (setting.value === null ||
        setting.value === '' ||
        setting.value === undefined) &&
      defaultValue !== null &&
      defaultValue !== undefined &&
      defaultValue !== ''
    ) {
      setting.value = defaultValue;
      changed = true;
    }

    return changed ? setting : null;
  }

  private buildAdminSetting(
    definition: ConfigurationDefinition,
  ): AdminConfigurationSetting {
    const stored = this.cache.get(definition.key);
    const effective = this.getValue(definition.key);

    let value: string | boolean | null = null;
    if (definition.valueType === 'boolean') {
      value = this.getBoolean(definition.key);
    } else if (definition.valueType === 'enum') {
      value = effective ?? null;
    } else if (definition.valueType === 'secret') {
      value = null; // never expose secrets
    } else {
      value = effective ?? null;
    }

    const hasValue =
      effective !== undefined &&
      effective !== null &&
      effective.toString().trim() !== '';

    return {
      key: definition.key,
      label: definition.label,
      description: definition.description,
      valueType: definition.valueType,
      value,
      hasValue,
      isSensitive: definition.isSensitive ?? false,
      isEditable: definition.isEditable ?? true,
      isReadOnly: definition.isReadOnly ?? false,
      options: definition.options ?? null,
      metadata: definition.metadata ?? null,
      updatedAt: stored?.updatedAt?.toISOString() ?? null,
    };
  }

  private normalizeValue(
    definition: ConfigurationDefinition,
    rawValue: string | boolean | null,
  ): string | null {
    if (rawValue === null || rawValue === undefined) {
      return null;
    }

    if (definition.valueType === 'boolean') {
      if (typeof rawValue === 'boolean') {
        return rawValue ? 'true' : 'false';
      }
      const normalized = rawValue.toString().trim().toLowerCase();
      if (['true', '1', 'yes', 'y', 'on'].includes(normalized)) {
        return 'true';
      }
      if (['false', '0', 'no', 'n', 'off'].includes(normalized)) {
        return 'false';
      }
      throw new BadRequestException(
        `Invalid boolean value provided for "${definition.label}".`,
      );
    }

    if (definition.valueType === 'enum') {
      const stringValue = rawValue.toString();
      if (!definition.options?.includes(stringValue)) {
        throw new BadRequestException(
          `Invalid option "${stringValue}" for "${definition.label}".`,
        );
      }
      return stringValue;
    }

    if (definition.valueType === 'json') {
      if (typeof rawValue === 'string') {
        try {
          JSON.parse(rawValue);
          return rawValue;
        } catch (error) {
          logError(
            error,
            buildErrorContext({ action: 'configuration.service' }),
          );
          throw new BadRequestException(
            `Invalid JSON payload for "${definition.label}".`,
          );
        }
      }
      return JSON.stringify(rawValue);
    }

    const stringValue = rawValue.toString();
    return stringValue.trim() === '' ? null : stringValue;
  }

  private unwrapValue(value: string | null): string | null {
    if (value === null || value === undefined) {
      return null;
    }
    const trimmed = value.toString().trim();
    return trimmed === '' ? null : trimmed;
  }

  private normalizeBaseUrl(url: string): string {
    try {
      const parsed = new URL(url);
      return parsed.origin;
    } catch (error) {
      logError(error, buildErrorContext({ action: 'configuration.service' }));
      return url.replace(/\/+$/, '');
    }
  }

  private ensurePort(url: string, port: string): string {
    if (!port) {
      return this.normalizeBaseUrl(url);
    }

    try {
      const parsed = new URL(url);
      if (!parsed.port) {
        parsed.port = port;
      }
      return parsed.origin;
    } catch {
      const trimmed = url.replace(/\/+$/, '');
      const hasPort = /:[0-9]+$/.test(trimmed);
      return hasPort ? trimmed : `${trimmed}:${port}`;
    }
  }

  private normalizeCallbackUrl(url: string): string {
    try {
      const parsed = new URL(url);
      return `${parsed.origin}${parsed.pathname}`.replace(/\/+$/, '');
    } catch {
      return url.replace(/\/+$/, '');
    }
  }

  private registerOriginalEnvValue(key: string): void {
    if (!this.originalEnvValues.has(key)) {
      this.originalEnvValues.set(key, process.env[key]);
    }
  }

  private applyToProcessEnv(setting: ConfigurationSetting): void {
    const value = this.unwrapValue(setting.value);
    if (value === null) {
      const original = this.originalEnvValues.get(setting.key);
      if (original === undefined) {
        delete process.env[setting.key];
      } else {
        process.env[setting.key] = original;
      }
      return;
    }

    process.env[setting.key] = value;
    if (setting.key === 'NODE_ENV') {
      this.logger.log(`NODE_ENV set to "${value}" via configuration service.`);
    }
  }
}
