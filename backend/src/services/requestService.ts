import { prisma } from "../lib/prisma.js";
import { HttpError } from "../middlewares/errorHandler.js";
import type { RequestStatus } from "../generated/prisma/client.js";

// ส่วนนี้ดูแลคำขอรับของและวงจรสถานะพัสดุ ตั้งแต่ผู้รับขอของจนถึงยืนยันได้รับของ
// การแยกเป็น service ทำให้ route ไม่ต้องรู้รายละเอียด transaction และการตรวจ ownership
export class RequestService {
  // TODO [Tracking]: จำกัดข้อมูล donor/recipient ตามเจ้าของรายการและ ADMIN
  // ห้ามส่ง passwordHash หรือข้อมูลส่วนตัวเกินกว่าหน้าติดตามพัสดุต้องใช้
  mine(recipientId: number) { return prisma.request.findMany({ where: { recipientId }, include: { item: { include: { category: true } } }, orderBy: { createdAt: "desc" } }); }

  async create(itemId: number, recipientId: number, quantity: number, reason: string) {
    const item = await prisma.item.findFirst({ where: { id: itemId, status: "AVAILABLE" } });
    if (!item) throw new HttpError(404, "Available item not found");
    if (quantity <= 0 || quantity > item.quantity) throw new HttpError(400, "Requested quantity is invalid");
    return prisma.request.create({ data: { itemId, recipientId, quantity, reason }, include: { item: true } });
  }

  async remove(id: number, recipientId: number) {
    const request = await prisma.request.findUnique({ where: { id } });
    if (!request) throw new HttpError(404, "Request not found");
    if (request.recipientId !== recipientId) throw new HttpError(403, "Not your request");
    if (request.status !== "PENDING") throw new HttpError(409, "Only pending requests can be deleted");
    await prisma.request.delete({ where: { id } });
  }

  async confirm(id: number, recipientId: number) {
    const request = await prisma.request.findUnique({ where: { id } });
    if (!request) throw new HttpError(404, "Request not found");
    if (request.recipientId !== recipientId) throw new HttpError(403, "Not your request");
    if (request.status !== "SHIPPED") throw new HttpError(409, "Request is not ready for confirmation");
    return prisma.request.update({ where: { id }, data: { status: "DELIVERED" } });
  }

  adminList(status?: RequestStatus) { return prisma.request.findMany({ where: status ? { status } : {}, include: { item: { include: { donor: { select: { id: true, name: true, email: true, phone: true } } } }, recipient: { select: { id: true, name: true, email: true, orgName: true, phone: true } } }, orderBy: { createdAt: "desc" } }); }

  // TODO [Status flow]: ลำดับหลักคือ PENDING -> APPROVED -> SHIPPED -> DELIVERED
  // ADMIN เป็นผู้เริ่ม SHIPPED และผู้รับเป็นผู้ยืนยัน DELIVERED
  async adminStatus(id: number, status: RequestStatus) {
    return prisma.$transaction(async tx => {
      const request = await tx.request.findUnique({ where: { id }, include: { item: true } });
      if (!request) throw new HttpError(404, "Request not found");
      // TODO [Atomic stock]: การอนุมัติและตัดจำนวนของต้องอยู่ transaction เดียวกัน
      // เพื่อป้องกันผู้รับหลายคนกดพร้อมกันแล้ว quantity ติดลบหรือถูกตัดซ้ำ
      if (status === "APPROVED") {
        if (request.status !== "PENDING" || request.item.quantity < request.quantity) throw new HttpError(409, "Request cannot be approved");
        await tx.item.update({ where: { id: request.itemId }, data: { quantity: { decrement: request.quantity } } });
      }
      if (status === "SHIPPED" && request.status !== "APPROVED") throw new HttpError(409, "Request must be approved first");
      return tx.request.update({ where: { id }, data: { status } });
    });
  }
}
