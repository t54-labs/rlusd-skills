export class CliCommandError extends Error {
  readonly command: string;
  readonly chain: string | undefined;
  readonly code: string;
  readonly retryable: boolean;
  readonly warnings: string[];
  readonly next: Array<{ command: string }>;

  constructor(input: {
    command: string;
    chain?: string;
    code: string;
    message: string;
    retryable?: boolean;
    warnings?: string[];
    next?: Array<{ command: string }>;
  }) {
    super(input.message);
    this.name = "CliCommandError";
    this.command = input.command;
    this.chain = input.chain;
    this.code = input.code;
    this.retryable = input.retryable ?? false;
    this.warnings = input.warnings ?? [];
    this.next = input.next ?? [];
  }
}
