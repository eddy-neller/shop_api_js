export const CONFIG = Symbol("CONFIG");

export interface ConfigPort {
  getString(name: string, defaultValue: string): string;
  getNumber(name: string, defaultValue: number): number;
}
