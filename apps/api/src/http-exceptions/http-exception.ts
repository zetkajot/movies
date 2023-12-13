export abstract class HttpException {
  public abstract readonly status: number;
  public abstract readonly name: string;
  constructor(
    public readonly message?: string,
  ) {}

  public toJSON() {
    return {
      error: `${this.status} - ${this.name}`,
      message: this.message ?? this.name,
    };
  }
}
