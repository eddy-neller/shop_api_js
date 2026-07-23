import bcrypt from 'bcryptjs';
import type { ConfigPort } from '@/application/shared/port/config.port';
import type { PasswordHasherPort } from '@/application/shared/port/password-hasher.port';

export class BcryptPasswordHasher implements PasswordHasherPort {
  public constructor(private readonly config: ConfigPort) {}

  public async hash(plainPassword: string): Promise<string> {
    const saltRounds = this.config.getNumber('BCRYPT_SALT_ROUNDS');

    return bcrypt.hash(plainPassword, saltRounds);
  }

  public async verify(hash: string, plainPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hash);
  }
}
