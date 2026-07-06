export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "HttpError";
  }

  static badRequest(message: string) {
    return new HttpError(400, message);
  }

  static unauthorized(message = "No autenticado") {
    return new HttpError(401, message);
  }

  static forbidden(message = "No autorizado para esta operacion") {
    return new HttpError(403, message);
  }

  static notFound(message = "Recurso no encontrado") {
    return new HttpError(404, message);
  }

  static conflict(message: string) {
    return new HttpError(409, message);
  }
}
