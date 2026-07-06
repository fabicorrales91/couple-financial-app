import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { HttpError } from "../lib/http-error";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "Datos invalidos",
      details: err.flatten().fieldErrors,
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return res.status(409).json({ error: "Ya existe un registro con ese valor unico" });
    }
    if (err.code === "P2003") {
      return res.status(400).json({ error: "Referencia invalida (por ejemplo, categoria inexistente)" });
    }
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Recurso no encontrado" });
    }
  }

  console.error(err);
  return res.status(500).json({ error: "Error interno del servidor" });
}
