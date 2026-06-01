export class GraphApiError extends Error {
  readonly status: number;
  readonly graphCode?: number;
  readonly errorSubcode?: number;
  readonly errorUserTitle?: string;
  readonly errorUserMsg?: string;
  readonly fbtraceId?: string;
  /** Short JSON snippet from `error_data` when serializable (debugging / Meta blame hints). */
  readonly errorDataSummary?: string;
  readonly rawBody: string;

  constructor(
    message: string,
    opts: {
      status: number;
      graphCode?: number;
      errorSubcode?: number;
      errorUserTitle?: string;
      errorUserMsg?: string;
      errorDataSummary?: string;
      fbtraceId?: string;
      rawBody: string;
    }
  ) {
    super(message);
    this.name = "GraphApiError";
    this.status = opts.status;
    this.graphCode = opts.graphCode;
    this.errorSubcode = opts.errorSubcode;
    this.errorUserTitle = opts.errorUserTitle;
    this.errorUserMsg = opts.errorUserMsg;
    this.fbtraceId = opts.fbtraceId;
    this.errorDataSummary = opts.errorDataSummary;
    this.rawBody = opts.rawBody;
  }
}
