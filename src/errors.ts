export class DriftDeckError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DriftDeckError';
  }
}
