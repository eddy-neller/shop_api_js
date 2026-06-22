export const TRANSACTIONAL = Symbol("TRANSACTIONAL");

export interface TransactionalPort {
  execute<T>(callback: () => Promise<T>): Promise<T>;
}
