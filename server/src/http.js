/** An error with an HTTP status code that is safe to show to the user. */
export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const badRequest = (message, details) => new HttpError(400, message, details);
export const forbidden = (message) => new HttpError(403, message);
export const notFound = (message) => new HttpError(404, message);
export const conflict = (message) => new HttpError(409, message);

/** Parses a route id like "12" into a positive integer, or throws 404. */
export function parseId(value, label = 'Item') {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw notFound(`${label} not found.`);
  return id;
}
