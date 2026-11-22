import { Router } from "express";
import { z } from "zod";
import { ItemService } from "../services/itemService.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router(); const service = new ItemService();
// ส่วนนี้คือ HTTP contract ของ feature รายการบริจาค: อ่านคลัง, ดูของรายชิ้น,
// ดูของของ donor, สร้าง/แก้ไข/ลบรายการ และส่งต่อไปให้ ItemService ทำ business logic
const itemSchema = z.object({ name: z.string().min(1), description: z.string().min(1), imageUrl: z.string().url().optional().or(z.literal("")), condition: z.enum(["NEW", "GOOD", "USED"]), quantity: z.number().int().nonnegative(), categoryId: z.number().int().positive() });
const id = (value: string) => { const parsed = Number(value); if (!Number.isInteger(parsed)) throw new Error("Invalid id"); return parsed; };

// TODO [Routing]: /mine ต้องอยู่ก่อน /:id ไม่เช่นนั้นคำว่า mine จะถูกตีความเป็น id
// และทุก endpoint ที่แก้ไขข้อมูลต้องมีทั้ง authentication และ role/ownership check
router.get("/mine", requireAuth, requireRole("DONOR"), asyncHandler(async (req, res) => res.json({ data: await service.mine(req.user!.id) })));
router.get("/", asyncHandler(async (req, res) => res.json({ data: await service.list(typeof req.query.search === "string" ? req.query.search : undefined, typeof req.query.categoryId === "string" ? Number(req.query.categoryId) : undefined) })));
router.get("/:id", asyncHandler(async (req, res) => res.json({ data: await service.get(id(String(req.params.id))) })));
router.post("/", requireAuth, requireRole("DONOR", "ADMIN"), asyncHandler(async (req, res) => res.status(201).json({ data: await service.create(itemSchema.parse(req.body), req.user!.id, req.user!.role === "ADMIN") })));
router.put("/:id", requireAuth, asyncHandler(async (req, res) => res.json({ data: await service.update(id(String(req.params.id)), itemSchema.partial().parse(req.body), req.user!.id, req.user!.role === "ADMIN") })));
router.delete("/:id", requireAuth, asyncHandler(async (req, res) => { await service.remove(id(String(req.params.id)), req.user!.id, req.user!.role === "ADMIN"); res.status(204).send(); }));
export default router;
