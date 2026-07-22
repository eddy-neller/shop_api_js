import { describe, expect, it } from 'vitest';
import { InvalidUsernameException } from '@/domain/user/exception/identity/invalid-username.exception';
import { Username } from '@/domain/user/value-object/identity/username';

describe('Username', () => {
  it('accepts a valid username', () => {
    const username = Username.fromString('  john  ');

    expect(username.toString()).toBe('john');
  });

  it('rejects an empty username', () => {
    expect(() => Username.fromString('   ')).toThrow(InvalidUsernameException);
  });

  it('rejects a too short username', () => {
    expect(() => Username.fromString('a')).toThrow(InvalidUsernameException);
  });

  it('rejects a too long username', () => {
    expect(() => Username.fromString('a'.repeat(21))).toThrow(
      InvalidUsernameException,
    );
  });
});
