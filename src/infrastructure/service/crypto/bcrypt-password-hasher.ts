import { Injectable } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import type { PasswordHasherPort } from '@/application/user/port/password-hasher.port';

@Injectable()
export class BcryptPasswordHasher implements PasswordHasherPort {
  public async hash(plainPassword: string): Promise<string> {
    const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS ?? 12);

    return bcrypt.hash(plainPassword, saltRounds);
  }

  public async verify(hash: string, plainPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hash);
  }
}
