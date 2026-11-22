import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

// seed รันผ่าน CLI จึงใช้ DIRECT_URL (session pooler 5432)
const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL! });
const prisma = new PrismaClient({ adapter });

const CATEGORY_NAMES = [
  "เสื้อผ้า",
  "หนังสือ",
  "อุปกรณ์การเรียน",
  "เครื่องใช้ไฟฟ้า",
  "ของเล่น",
  "ของใช้ในบ้าน",
];

const ORG_NAMES = [
  "โรงเรียนบ้านหนองบัว",
  "มูลนิธิเด็กยิ้มสดใส",
  "ชุมชนคลองสามัคคี",
  "โรงเรียนวัดป่าไผ่",
  "มูลนิธิแบ่งปันน้ำใจ",
  "ชุมชนบ้านดอนแก้ว",
  "โรงเรียนตำรวจตระเวนชายแดนบ้านห้วยทราย",
  "มูลนิธิบ้านอุ่นรัก",
];

// [ชื่อ, คำอธิบาย, index ของหมวดใน CATEGORY_NAMES]
const ITEM_DATA: Array<[string, string, number]> = [
  ["เสื้อยืดเด็ก ไซซ์ S", "เสื้อยืดผ้าฝ้าย สีพื้น ซักสะอาดแล้ว", 0],
  ["หนังสือนิทานภาพสำหรับเด็ก", "นิทานภาพสองภาษา ไทย-อังกฤษ", 1],
  ["สมุดปกอ่อน 60 แผ่น", "สมุดเส้นบรรทัด ยังไม่ได้ใช้งาน", 2],
  ["พัดลมตั้งโต๊ะ 16 นิ้ว", "ใช้งานได้ปกติ ปรับได้ 3 ระดับ", 3],
  ["ตัวต่อเลโก้ชุดเล็ก", "ชิ้นส่วนครบ บรรจุในกล่อง", 4],
  ["ชุดจานชามเมลามีน", "จาน ชาม แก้ว อย่างละ 6 ชิ้น", 5],
  ["กางเกงนักเรียนขาสั้น", "สีกากี ไซซ์ 28-30", 0],
  ["หนังสือเรียนคณิตศาสตร์ ป.4", "หลักสูตรแกนกลาง มีรอยดินสอเล็กน้อย", 1],
  ["ดินสอไม้ 2B (แพ็ก 12 แท่ง)", "ของใหม่ ยังไม่แกะกล่อง", 2],
  ["หม้อหุงข้าว 1.8 ลิตร", "ใช้งานได้ดี มีถ้วยตวงครบ", 3],
  ["ตุ๊กตาหมีผ้า", "ซักทำความสะอาดแล้ว ขนาด 30 ซม.", 4],
  ["ผ้าห่มนวม 5 ฟุต", "ผ้าห่มหนานุ่ม เหมาะสำหรับหน้าหนาว", 5],
  ["เสื้อกันหนาวผู้ใหญ่", "ผ้าฟลีซ ไซซ์ L", 0],
  ["พจนานุกรมไทย-อังกฤษ", "ฉบับนักเรียน ปกแข็ง", 1],
  ["กระเป๋านักเรียน", "เป้สะพายหลัง มีช่องใส่ขวดน้ำ", 2],
  ["กาต้มน้ำไฟฟ้า", "ความจุ 1.7 ลิตร ตัดไฟอัตโนมัติ", 3],
  ["รถของเล่นบังคับวิทยุ", "ต้องใช้ถ่าน AA 4 ก้อน", 4],
  ["ชุดผ้าปูที่นอน 6 ฟุต", "พร้อมปลอกหมอน 2 ใบ", 5],
  ["ชุดนักเรียนหญิง", "เสื้อพร้อมกระโปรงสีกรมท่า", 0],
  ["หนังสือวรรณกรรมเยาวชน", "รวมเรื่องสั้นสำหรับเด็กประถม", 1],
  ["ไม้บรรทัดและชุดเรขาคณิต", "ครบชุด ไม้บรรทัด ฉาก วงเวียน", 2],
  ["หลอดไฟ LED 9 วัตต์", "ขั้ว E27 แสงขาว", 3],
  ["เกมบันไดงู", "บอร์ดเกมพร้อมลูกเต๋าและตัวเดิน", 4],
  ["ถังน้ำพลาสติกพร้อมฝา", "ขนาด 20 ลิตร", 5],
  ["รองเท้าผ้าใบนักเรียน", "สีขาว เบอร์ 36", 0],
  ["หนังสือภาษาอังกฤษเบื้องต้น", "แบบฝึกหัดสำหรับผู้เริ่มต้น", 1],
  ["สีเทียน 24 สี", "ของใหม่ บรรจุกล่อง", 2],
  ["วิทยุ AM/FM แบบพกพา", "ใช้ได้ทั้งถ่านและไฟบ้าน", 3],
  ["ลูกบอลฟุตบอล", "เบอร์ 4 สำหรับเด็ก", 4],
  ["ไม้กวาดและที่ตักผง", "ชุดทำความสะอาดพื้นบ้าน", 5],
  ["หมวกไหมพรมเด็ก", "ถักมือ อบอุ่นใส่สบาย", 0],
  ["หนังสือการ์ตูนความรู้วิทยาศาสตร์", "เล่มชุดเรื่องร่างกายมนุษย์", 1],
  ["เครื่องคิดเลขวิทยาศาสตร์", "ใช้งานได้ปกติ มีฝาครอบ", 2],
  ["โคมไฟอ่านหนังสือ", "ปรับระดับความสว่างได้", 3],
  ["จิ๊กซอว์ 500 ชิ้น", "ภาพแผนที่ประเทศไทย ชิ้นส่วนครบ", 4],
  ["กล่องพลาสติกเก็บของ", "ขนาดกลาง มีล้อเลื่อน", 5],
  ["ถุงเท้านักเรียน (แพ็ก 6 คู่)", "สีขาว ของใหม่", 0],
  ["นิตยสารสารคดีเก่า", "รวมเล่มย้อนหลัง สภาพตามอายุ", 1],
  ["ไมโครเวฟ 20 ลิตร", "ปุ่มหมุนชำรุดบางส่วน", 3],
  ["ปืนฉีดน้ำของเล่น", "พลาสติกมีรอยร้าว", 4],
];

// รูปของแต่ละชิ้น เรียงตาม ITEM_DATA; null = ยังไม่มีลิงก์ที่ใช้ได้ จะใช้รูปสุ่มจาก picsum แทน
const ITEM_IMAGE_URLS: Array<string | null> = [
  "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=600&h=400&fit=crop", // 0 เสื้อยืดเด็ก ไซซ์ S
  "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&h=400&fit=crop", // 1 หนังสือนิทานภาพสำหรับเด็ก
  "https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=600&h=400&fit=crop", // 2 สมุดปกอ่อน 60 แผ่น
  null, // 3 พัดลมตั้งโต๊ะ 16 นิ้ว (ลิงก์ที่ได้มาเป็น 404)
  null, // 4 ตัวต่อเลโก้ชุดเล็ก (ลิงก์ที่ได้มาเป็น 404)
  null, // 5 ชุดจานชามเมลามีน (ลิงก์ที่ได้มาเป็น 404)
  "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=600&h=400&fit=crop", // 6 กางเกงนักเรียนขาสั้น
  "https://images.unsplash.com/photo-1596495578065-6e0763fa1178?w=600&h=400&fit=crop", // 7 หนังสือเรียนคณิตศาสตร์ ป.4
  "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=600&h=400&fit=crop", // 8 ดินสอไม้ 2B (แพ็ก 12 แท่ง)
  "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&h=400&fit=crop", // 9 หม้อหุงข้าว 1.8 ลิตร
  "https://images.unsplash.com/photo-1559715541-5daf8a0296d0?w=600&h=400&fit=crop", // 10 ตุ๊กตาหมีผ้า
  "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&h=400&fit=crop", // 11 ผ้าห่มนวม 5 ฟุต
  "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&h=400&fit=crop", // 12 เสื้อกันหนาวผู้ใหญ่
  "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&h=400&fit=crop", // 13 พจนานุกรมไทย-อังกฤษ
  "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=400&fit=crop", // 14 กระเป๋านักเรียน
  null, // 15 กาต้มน้ำไฟฟ้า (ลิงก์ที่ได้มาเป็น 404)
  null, // 16 รถของเล่นบังคับวิทยุ (ลิงก์ที่ได้มาเป็น 404)
  "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&h=400&fit=crop", // 17 ชุดผ้าปูที่นอน 6 ฟุต
  "https://images.unsplash.com/photo-1604671801908-6f0c6a092c05?w=600&h=400&fit=crop", // 18 ชุดนักเรียนหญิง
  "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=600&h=400&fit=crop", // 19 หนังสือวรรณกรรมเยาวชน
  "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&h=400&fit=crop", // 20 ไม้บรรทัดและชุดเรขาคณิต
  "https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=600&h=400&fit=crop", // 21 หลอดไฟ LED 9 วัตต์
  "https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=600&h=400&fit=crop", // 22 เกมบันไดงู
  null, // 23 ถังน้ำพลาสติกพร้อมฝา (ลิงก์ที่ได้มาเป็น 404)
  "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&h=400&fit=crop", // 24 รองเท้าผ้าใบนักเรียน
  "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&h=400&fit=crop", // 25 หนังสือภาษาอังกฤษเบื้องต้น
  "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&h=400&fit=crop", // 26 สีเทียน 24 สี
  "https://images.unsplash.com/photo-1507207611509-ec012433ff52?w=600&h=400&fit=crop", // 27 วิทยุ AM/FM แบบพกพา
  null, // 28 ลูกบอลฟุตบอล (ลิงก์ที่ได้มาเป็น 404)
  "https://images.unsplash.com/photo-1563453392212-326f5e854473?w=600&h=400&fit=crop", // 29 ไม้กวาดและที่ตักผง
  "https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?w=600&h=400&fit=crop", // 30 หมวกไหมพรมเด็ก
  "https://images.unsplash.com/photo-1588666309990-d68f08e3d4a6?w=600&h=400&fit=crop", // 31 หนังสือการ์ตูนความรู้วิทยาศาสตร์
  "https://images.unsplash.com/photo-1564939558297-fc396f18e5c7?w=600&h=400&fit=crop", // 32 เครื่องคิดเลขวิทยาศาสตร์
  null, // 33 โคมไฟอ่านหนังสือ (ลิงก์ที่ได้มาเป็น 404)
  "https://images.unsplash.com/photo-1494059980473-813e73ee784b?w=600&h=400&fit=crop", // 34 จิ๊กซอว์ 500 ชิ้น
  null, // 35 กล่องพลาสติกเก็บของ (ลิงก์ที่ได้มาเป็น 404)
  "https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=600&h=400&fit=crop", // 36 ถุงเท้านักเรียน (แพ็ก 6 คู่)
  null, // 37 นิตยสารสารคดีเก่า (ลิงก์ที่ได้มาเป็น 404)
  null, // 38 ไมโครเวฟ 20 ลิตร (ลิงก์ที่ได้มาเป็น 404)
  "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=600&h=400&fit=crop", // 39 ปืนฉีดน้ำของเล่น
];

const CONDITIONS = ["NEW", "GOOD", "USED"] as const;
const REQUEST_STATUSES = ["PENDING", "APPROVED", "REJECTED", "SHIPPED", "DELIVERED"] as const;

type RequestStatusValue = (typeof REQUEST_STATUSES)[number];

const PICKUP_LOCATIONS = [
  "จุดรับของ ShareBox อาคาร A ชั้น 1",
  "หน้าป้อมยามประตู 2",
  "ห้องธุรการของโรงเรียน",
  "ศูนย์ชุมชนประจำหมู่บ้าน",
];

const DAY_MS = 24 * 60 * 60 * 1000;

function daysFromNow(days: number, hour = 10): Date {
  const d = new Date(Date.now() + days * DAY_MS);
  d.setHours(hour, 0, 0, 0);
  return d;
}

function itemStatus(index: number): "AVAILABLE" | "PENDING_REVIEW" | "REJECTED" {
  if (index < 34) return "AVAILABLE";
  if (index < 38) return "PENDING_REVIEW";
  return "REJECTED";
}

// ข้อมูลนัดรับตามสถานะ: APPROVED = มีวันนัด (อนาคต), SHIPPED/DELIVERED = มีวันนัดและวันรับจริง (อดีต)
function pickupFor(status: RequestStatusValue, i: number) {
  const location = PICKUP_LOCATIONS[i % PICKUP_LOCATIONS.length];
  if (status === "APPROVED") {
    return {
      pickupScheduledAt: daysFromNow(2 + (i % 5)),
      pickupAt: null,
      pickupLocation: location,
      pickupNote: "กรุณานำบัตรประจำตัวองค์กรมาแสดงตอนเข้ารับ",
    };
  }
  if (status === "SHIPPED" || status === "DELIVERED") {
    const scheduled = daysFromNow(-7 - (i % 5));
    return {
      pickupScheduledAt: scheduled,
      pickupAt: new Date(scheduled.getTime() + 2 * 60 * 60 * 1000), // มารับจริงหลังนัด 2 ชม.
      pickupLocation: location,
      pickupNote: status === "SHIPPED" ? "ส่งพัสดุทางไปรษณีย์แล้ว" : "ผู้รับยืนยันการรับพัสดุแล้ว",
    };
  }
  return { pickupScheduledAt: null, pickupAt: null, pickupLocation: null, pickupNote: null };
}

async function main(): Promise<void> {
  // ลบข้อมูลเก่า (ลูก → แม่) เพื่อให้รัน seed ซ้ำได้
  // Notification อ้างถึงทั้ง User และ Request จึงต้องลบก่อนสุด
  await prisma.notification.deleteMany();
  await prisma.request.deleteMany();
  await prisma.item.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 10);

  const categories = await prisma.category.createManyAndReturn({
    data: CATEGORY_NAMES.map((name) => ({ name })),
  });
  // createManyAndReturn ไม่รับประกันลำดับ จึงจับคู่ด้วยชื่อ
  const categoryIdByName = new Map(categories.map((c) => [c.name, c.id]));

  await prisma.user.create({
    data: { name: "ผู้ดูแลระบบ", email: "admin@sharebox.test", passwordHash, role: "ADMIN" as const },
  });

  const donors = await prisma.user.createManyAndReturn({
    data: Array.from({ length: 10 }, (_, i) => ({
      name: `ผู้บริจาค ${i + 1}`,
      email: `donor${i + 1}@sharebox.test`,
      passwordHash,
      role: "DONOR" as const,
      phone: `08${String(10000000 + i).padStart(8, "0")}`,
    })),
  });
  donors.sort((a, b) => a.id - b.id);

  const recipients = await prisma.user.createManyAndReturn({
    data: ORG_NAMES.map((orgName, i) => ({
      name: `ผู้ประสานงาน ${orgName}`,
      email: `org${i + 1}@sharebox.test`,
      passwordHash,
      role: "RECIPIENT" as const,
      orgName,
      phone: `09${String(20000000 + i).padStart(8, "0")}`,
    })),
  });
  recipients.sort((a, b) => a.id - b.id);

  const items = await prisma.item.createManyAndReturn({
    data: ITEM_DATA.map(([name, description, catIndex], i) => ({
      name,
      description,
      imageUrl: ITEM_IMAGE_URLS[i] ?? `https://picsum.photos/seed/sharebox-${i + 1}/600/400`,
      condition: CONDITIONS[i % CONDITIONS.length],
      quantity: ((i * 7) % 50) + 1, // 1–50
      status: itemStatus(i),
      categoryId: categoryIdByName.get(CATEGORY_NAMES[catIndex])!,
      donorId: donors[i % donors.length].id,
    })),
  });
  items.sort((a, b) => a.id - b.id);

  const requests = await prisma.request.createManyAndReturn({
    data: items.slice(0, 20).map((item, i) => {
      const status = REQUEST_STATUSES[i % REQUEST_STATUSES.length];
      return {
        quantity: 1,
        reason: `${recipients[i % recipients.length].orgName} ต้องการ${item.name}เพื่อนำไปใช้ประโยชน์`,
        status,
        itemId: item.id,
        recipientId: recipients[i % recipients.length].id,
        ...pickupFor(status, i),
      };
    }),
  });
  requests.sort((a, b) => a.id - b.id);

  // Notification ตัวอย่าง:
  // - ทุก request → แจ้ง Donor ว่ามีคนขอรับ (REQUEST_CREATED)
  // - APPROVED/SHIPPED/DELIVERED → แจ้งผู้รับว่าอนุมัติแล้ว (REQUEST_APPROVED)
  // - SHIPPED/DELIVERED → แจ้งผู้รับว่าเริ่มจัดส่ง (REQUEST_SHIPPED)
  // readAt: request ที่จบแล้ว (REJECTED/DELIVERED) ถือว่าอ่านแล้ว ที่เหลือยังไม่อ่าน → ใช้ทดสอบ badge
  const itemById = new Map(items.map((it) => [it.id, it]));
  const notificationData = requests.flatMap((req) => {
    const item = itemById.get(req.itemId)!;
    const readAt = req.status === "REJECTED" || req.status === "DELIVERED" ? daysFromNow(-1) : null;
    const rows: Array<{
      userId: number;
      requestId: number;
      type: "REQUEST_CREATED" | "REQUEST_APPROVED" | "REQUEST_SHIPPED";
      message: string;
      readAt: Date | null;
    }> = [];

    if (item.donorId !== null) {
      rows.push({
        userId: item.donorId,
        requestId: req.id,
        type: "REQUEST_CREATED",
        message: `มีองค์กรขอรับ "${item.name}" จำนวน ${req.quantity} ชิ้น`,
        readAt,
      });
    }
    if (req.status === "APPROVED" || req.status === "SHIPPED" || req.status === "DELIVERED") {
      rows.push({
        userId: req.recipientId,
        requestId: req.id,
        type: "REQUEST_APPROVED",
        message: `คำขอ "${item.name}" ได้รับการอนุมัติแล้ว`,
        readAt,
      });
    }
    if (req.status === "SHIPPED" || req.status === "DELIVERED") {
      rows.push({
        userId: req.recipientId,
        requestId: req.id,
        type: "REQUEST_SHIPPED",
        message: `"${item.name}" อยู่ระหว่างจัดส่ง`,
        readAt,
      });
    }
    return rows;
  });

  const notifications = await prisma.notification.createMany({ data: notificationData });
  const unread = await prisma.notification.count({ where: { readAt: null } });
  const withPickup = await prisma.request.count({ where: { pickupScheduledAt: { not: null } } });

  const userCount = await prisma.user.count();
  console.log(
    `Seed เสร็จ: categories ${categories.length}, users ${userCount}, items ${items.length}, requests ${requests.length} (มีนัดรับ ${withPickup}), notifications ${notifications.count} (ยังไม่อ่าน ${unread})`,
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e: unknown) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
