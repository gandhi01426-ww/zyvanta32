import type { IncomingHttpHeaders, IncomingMessage, ServerResponse } from "node:http";

export type VercelRequest = IncomingMessage & {
  // Vercel parses request body/query values dynamically before invoking handlers.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: any;
  headers: IncomingHttpHeaders;
};

export type VercelResponse = ServerResponse & {
  status(statusCode: number): VercelResponse;
  json(body: unknown): VercelResponse;
};
