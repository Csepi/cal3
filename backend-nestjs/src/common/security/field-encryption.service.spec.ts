import { FieldEncryptionService } from './field-encryption.service';

describe('FieldEncryptionService', () => {
  const previous = process.env.FIELD_ENCRYPTION_KEYS_JSON;
  const previousActive = process.env.FIELD_ENCRYPTION_ACTIVE_KEY_VERSION;

  afterEach(() => {
    process.env.FIELD_ENCRYPTION_KEYS_JSON = previous;
    process.env.FIELD_ENCRYPTION_ACTIVE_KEY_VERSION = previousActive;
  });

  it('encrypts and decrypts values with configured key', () => {
    process.env.FIELD_ENCRYPTION_ACTIVE_KEY_VERSION = 'v1';
    process.env.FIELD_ENCRYPTION_KEYS_JSON = JSON.stringify({
      v1: Buffer.alloc(32, 9).toString('base64'),
    });

    const service = new FieldEncryptionService();
    const encrypted = service.encrypt('secret-value');
    const decrypted = service.decrypt(encrypted.ciphertext);

    expect(encrypted.keyVersion).toBe('v1');
    expect(decrypted.plaintext).toBe('secret-value');
  });
});
