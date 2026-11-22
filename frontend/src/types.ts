// ไฟล์นี้เป็นสัญญาข้อมูลระหว่าง Frontend กับ Backend ทำให้ TypeScript ตรวจชื่อ field/status
// ก่อนนำข้อมูลไปแสดงผล หาก Backend เปลี่ยน response ต้องแก้ไฟล์นี้พร้อมกัน
// TODO [API contract]: types เหล่านี้ต้องแก้พร้อม backend response เสมอ
// โดยเฉพาะ status และ field นัดรับ/แจ้งเตือน เพื่อป้องกัน UI แสดงสถานะผิดจากฐานข้อมูล
export type Role = "DONOR" | "RECIPIENT" | "ADMIN";
export type ItemRequest = { id: number; quantity: number; status: "PENDING" | "APPROVED" | "REJECTED" | "SHIPPED" | "DELIVERED"; recipient: { id: number; name: string; orgName?: string | null } };
export type Item = { id: number; name: string; description: string; imageUrl?: string | null; condition: "NEW" | "GOOD" | "USED"; quantity: number; status: "PENDING_REVIEW" | "AVAILABLE" | "REJECTED"; category: { id: number; name: string }; createdAt: string; requests?: ItemRequest[] };
export type SystemUser = { id: number; name: string; email: string; role: Role; orgName?: string | null; phone?: string | null; createdAt: string };
export type AdminRequest = { id: number; quantity: number; reason?: string; status: "PENDING" | "APPROVED" | "REJECTED" | "SHIPPED" | "DELIVERED"; createdAt: string; item: { id?: number; name: string; description?: string; donor?: { id: number; name: string; email: string; phone?: string | null } | null }; recipient: { id?: number; name: string; email?: string; orgName?: string | null; phone?: string | null } };
export type Category = { id: number; name: string };
export type User = { id: number; name: string; email: string; role: Role; orgName?: string | null };
export type ApiResponse<T> = { data: T };
export type DonationRequest = { id: number; quantity: number; reason: string; status: "PENDING" | "APPROVED" | "REJECTED" | "SHIPPED" | "DELIVERED"; createdAt: string; item: Item };
