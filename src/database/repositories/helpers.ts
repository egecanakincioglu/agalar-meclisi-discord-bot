export function now(): string {
  return new Date().toISOString();
}

export function toBoolean(value: number): boolean {
  return value === 1;
}

export function toInteger(value: boolean): number {
  return value ? 1 : 0;
}
