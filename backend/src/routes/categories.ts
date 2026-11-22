import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

// GET /api/categories
router.get("/", asyncHandler(async (_req, res) => {
  const data = await prisma.category.findMany({ orderBy: { id: "asc" } });
  res.json({ data });
}));

export default router;
