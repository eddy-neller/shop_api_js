import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { IdGeneratorPort } from '@/application/user/port/id-generator.port';

@Injectable()
export class UuidGenerator implements IdGeneratorPort {
  public generate(): string {
    return randomUUID();
  }
}

