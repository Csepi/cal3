import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { randomBytes, randomUUID } from 'crypto';

interface GeneratedAgentKey {
  token: string;
  tokenId: string;
  hashed: string;
  lastFour: string;
}

@Injectable()
export class AgentKeysService {
  private readonly BCRYPT_ROUNDS = 12;

  async generateKey(): Promise<GeneratedAgentKey> {
    const tokenId = randomUUID();
    const randomSegment = randomBytes(24).toString('base64url');
    const token = `ag_sk_${tokenId}_${randomSegment}`;
    const hashed = await bcrypt.hash(token, this.BCRYPT_ROUNDS);
    const lastFour = token.slice(-4);

    return {
      token,
      tokenId,
      hashed,
      lastFour,
    };
  }

  async verifyKey(token: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(token, hashed);
  }
}
