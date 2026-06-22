import { describe, expect, it } from 'vitest';
import { InvalidEmailException } from '@/domain/user/exception/invalid-email.exception';
import { Email } from '@/domain/user/value-object/email';

describe('Email', () => {
  it('normalizes a valid email', () => {
    const email = Email.fromString(' JOHN@Example.COM ');

    expect(email.toString()).toBe('john@example.com');
  });

  it('rejects invalid email', () => {
    expect(() => Email.fromString('invalid')).toThrow(InvalidEmailException);
  });
});

