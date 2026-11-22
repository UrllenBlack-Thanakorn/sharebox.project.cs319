import { prisma } from "../lib/prisma.js";
import { HttpError } from "../middlewares/errorHandler.js";
import type { ItemStatus } from "../generated/prisma/client.js";

// ส่วนนี้รวม business logic ของ “ของบริจาค” ไว้ที่เดียว
// Route ทำหน้าที่รับ request/ตรวจสิทธิ์ ส่วน service ทำงานกับฐานข้อมูลและกติกาของระบบ
export class ItemService {
  // TODO [Business rule]: คลังสาธารณะต้องแสดงเฉพาะ AVAILABLE และ quantity > 0
  // ถ้า admin ต้องเห็นของหมดหรือถูกปฏิเสธ ให้สร้าง method แยก ไม่แก้เงื่อนไข public list นี้
  list(search?: string, categoryId?: number) {
    return prisma.item.findMany({
      where: { status: "AVAILABLE", quantity: { gt: 0 }, ...(search ? { OR: [{ name: { contains: search, mode: "insensitive" } }, { description: { contains: search, mode: "insensitive" } }] } : {}), ...(categoryId ? { categoryId } : {}) },
      include: { category: true }, orderBy: { createdAt: "desc" },
    });
  }

  async get(id: number) {
    const item = await prisma.item.findFirst({ where: { id, status: "AVAILABLE" }, include: { category: true, donor: { select: { id: true, name: true } } } });
    if (!item) throw new HttpError(404, "Item not found");
    return item;
  }

  mine(donorId: number) { return prisma.item.findMany({ where: { donorId }, include: { category: true, requests: { include: { recipient: { select: { id: true, name: true, orgName: true } } }, orderBy: { createdAt: "desc" } } }, orderBy: { createdAt: "desc" } }); }

  // TODO [Image]: เมื่อ DB master เพิ่ม imageData/imageMime ให้เปลี่ยน endpoint เป็น multipart/form-data
  // และเลือก storage ตามข้อตกลงทีม โดยยังเก็บ imageUrl เพื่อรองรับข้อมูลเดิม
  create(input: { name: string; description: string; imageUrl?: string; condition: "NEW" | "GOOD" | "USED"; quantity: number; categoryId: number }, userId: number, admin = false) {
    if (input.quantity < 0) throw new HttpError(400, "Quantity must be non-negative");
    return prisma.item.create({ data: { ...input, donorId: admin ? undefined : userId, status: admin ? "AVAILABLE" : "PENDING_REVIEW" }, include: { category: true } });
  }

  async update(id: number, input: Partial<{ name: string; description: string; imageUrl: string; condition: "NEW" | "GOOD" | "USED"; quantity: number; categoryId: number }>, userId: number, admin: boolean) {
    const item = await prisma.item.findUnique({ where: { id } });
    if (!item) throw new HttpError(404, "Item not found");
    if (!admin && (item.donorId !== userId || item.status !== "PENDING_REVIEW")) throw new HttpError(403, "Item cannot be edited");
    return prisma.item.update({ where: { id }, data: input, include: { category: true } });
  }

  async remove(id: number, userId: number, admin: boolean) {
    const item = await prisma.item.findUnique({ where: { id } });
    if (!item) throw new HttpError(404, "Item not found");
    if (!admin && (item.donorId !== userId || item.status !== "PENDING_REVIEW")) throw new HttpError(403, "Item cannot be deleted");
    await prisma.item.delete({ where: { id } });
  }

  review(id: number, status: Extract<ItemStatus, "AVAILABLE" | "REJECTED">) { return prisma.item.update({ where: { id }, data: { status }, include: { category: true } }); }
}
