import { describe, expect, it } from 'vitest';
import { InvalidUuidException } from '@/domain/shared/exception/invalid-uuid.exception';
import { Uuid } from '@/domain/shared/value-object/uuid';

describe('Uuid', () => {
  it.each([
    '550e8400-e29b-11d4-a716-446655440000',
    '550e8400-e29b-21d4-a716-446655440000',
    '550e8400-e29b-31d4-a716-446655440000',
    '550e8400-e29b-41d4-a716-446655440000',
    '550e8400-e29b-51d4-a716-446655440000',
  ])('accepts a RFC 4122 UUID v1-v5 (%s)', (value) => {
    expect(Uuid.fromString(value).toString()).toBe(value);
  });

  it('rejects an invalid UUID version or variant', () => {
    expect(() => Uuid.fromString('550e8400-e29b-01d4-a716-446655440000')).toThrow(
      InvalidUuidException,
    );
    expect(() => Uuid.fromString('550e8400-e29b-41d4-c716-446655440000')).toThrow(
      InvalidUuidException,
    );
  });

  it('uses the supplied label in validation errors', () => {
    expect(() => Uuid.fromString('invalid', 'user id')).toThrow('Invalid user id: invalid');
  });

  it('compares UUIDs by value', () => {
    const value = '550e8400-e29b-41d4-a716-446655440000';

    expect(Uuid.fromString(value).equals(Uuid.fromString(value))).toBe(true);
    expect(Uuid.fromString(value).equals(Uuid.fromString('550e8400-e29b-41d4-a716-446655440001'))).toBe(
      false,
    );
  });
});
