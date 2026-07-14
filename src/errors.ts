export class ConfigError extends Error {
  constructor(message: string) {
    super(`[ConfigError] ${message}`);
    this.name = "ConfigError";
    Object.setPrototypeOf(this, ConfigError.prototype);
  }
}

export class CycleError extends ConfigError {
  constructor(message: string) {
    super(`Cycle detected in role inheritance: ${message}`);
    this.name = "CycleError";
    Object.setPrototypeOf(this, CycleError.prototype);
  }
}

export class ForbiddenError extends Error {
  constructor(message: string = "Access denied") {
    super(message);
    this.name = "ForbiddenError";
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}
