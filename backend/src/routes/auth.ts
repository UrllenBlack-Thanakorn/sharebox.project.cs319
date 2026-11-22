import { Router } from "express";
import { z } from "zod";
import { AuthService } from "../services/authService.js";
import { requireAuth } from "../middlewares/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
const service = new AuthService();
const signupSchema = z.object({ name: z.string().min(1), email: z.string().email(), password: z.string().min(6), role: z.enum(["DONOR", "RECIPIENT"]), orgName: z.string().optional(), phone: z.string().optional() });
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

router.post("/signup", asyncHandler(async (req, res) => res.status(201).json({ data: await service.signup(signupSchema.parse(req.body)) })));
router.post("/login", asyncHandler(async (req, res) => { const input = loginSchema.parse(req.body); res.json({ data: await service.login(input.email, input.password) }); }));
router.get("/me", requireAuth, asyncHandler(async (req, res) => res.json({ data: await service.me(req.user!.id) })));
export default router;
