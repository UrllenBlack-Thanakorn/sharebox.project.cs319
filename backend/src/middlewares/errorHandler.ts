import type { NextFunction, Request, Response } from "express";
import { Prisma } from "../generated/prisma/client.js";
import { ZodError } from "zod";

export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "HttpError";
  }
}

// ส่วนนี้แปลง error จาก service, validation และ Prisma ให้เป็น response รูปแบบเดียว
// Frontend จึงแสดงข้อความผิดพลาดได้โดยไม่ต้องรู้ implementation ภายในของ Backend
export function notFound(req: Request, _res: Response, next: NextFunction): void {
  next(new HttpError(404, `Not found: ${req.method} ${req.originalUrl}`));
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  // TODO [Error contract]: คง mapping 400/401/403/404/409/500 นี้ไว้ให้ frontend แสดงข้อความได้
  // อย่าส่ง stack trace หรือรายละเอียดฐานข้อมูลออกไปใน production
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: { message: err.message } });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({ error: { message: err.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join(", ") } });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      res.status(409).json({ error: { message: "Duplicate value (unique constraint)" } });
      return;
    }
    if (err.code === "P2025") {
      res.status(404).json({ error: { message: "Record not found" } });
      return;
    }
  }

  console.error(err);
  res.status(500).json({ error: { message: "Internal server error" } });
}
