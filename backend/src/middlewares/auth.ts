/// <reference path="../types/express.d.ts" />
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { Role } from "../generated/prisma/client.js";
import { env } from "../config/env.js";
import { HttpError } from "./errorHandler.js";

type TokenPayload = { sub: string; role: Role; email: string };

// ส่วนนี้เป็นด่านกลางของทุก endpoint ที่ต้องรู้ว่าใครกำลังเรียก API
// requireAuth ยืนยันตัวตนจาก JWT ส่วน requireRole จำกัดบทบาทหลังจากยืนยันตัวตนแล้ว
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  // TODO [Security]: token เป็นหลักฐานตัวตนเบื้องต้น หากต้องรองรับการปิดบัญชีหรือเปลี่ยน role
  // ระหว่าง token ยังไม่หมดอายุ ให้โหลด user จาก DB และตรวจสถานะซ้ำที่จุดนี้
  const header = req.header("authorization");
  if (!header?.startsWith("Bearer ")) return next(new HttpError(401, "Authentication required"));
  try {
    const payload = jwt.verify(header.slice(7), env.jwtSecret) as TokenPayload;
    req.user = { id: Number(payload.sub), role: payload.role, email: payload.email };
    next();
  } catch {
    next(new HttpError(401, "Invalid or expired token"));
  }
}

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    // TODO [Authorization]: route ที่ใช้ requireRole ต้องวาง requireAuth ไว้ก่อนเสมอ
    // เพราะ role จะถูกเติมลง req.user โดย middleware ก่อนหน้านี้
    if (!req.user || !roles.includes(req.user.role)) return next(new HttpError(403, "Insufficient permissions"));
    next();
  };
}
