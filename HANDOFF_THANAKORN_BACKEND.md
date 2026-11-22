# ShareBox — Handoff งาน Backend / Frontend

เอกสารนี้สรุปงานใน branch `thanakorn-backend` สำหรับส่งต่อให้ DB master และทีมที่ทำต่อ

## 1. สถานะงาน

- Branch งาน: `thanakorn-backend`
- Backend และ Frontend แยกโฟลเดอร์แล้ว
- Backend ใช้ Express + TypeScript + Prisma + PostgreSQL
- Frontend ใช้ React + TypeScript + Vite + React Router v7 + TanStack Query + Zustand
- เชื่อมต่อ Database online ผ่าน `.env`
- ไม่ได้รัน migration หรือ seed เพิ่ม
- `backend` typecheck ผ่าน
- `frontend` build ผ่าน

## 2. โครงสร้างโปรเจกต์

```text
ShareBox-Project-CS319/
├── backend/
│   ├── prisma/
│   ├── src/
│   │   ├── config/
│   │   ├── lib/
│   │   ├── middlewares/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── types/
│   │   └── utils/
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── pages/
│   │   ├── stores/
│   │   └── router.tsx
│   ├── .env.example
│   └── package.json
└── HANDOFF_THANAKORN_BACKEND.md
```

## 3. สิ่งที่ทำแล้ว — Backend

### Authentication

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`
- JWT อายุ 1 วัน
- bcrypt hash password
- `requireAuth` และ `requireRole`

### Items

- `GET /api/items`
- `GET /api/items/:id`
- `GET /api/items/mine`
- `POST /api/items`
- `PUT /api/items/:id`
- `DELETE /api/items/:id`
- รองรับค้นหาและกรองด้วย `search`, `categoryId`
- Donor เพิ่มของจะเริ่มที่ `PENDING_REVIEW`
- Admin เพิ่มของจะเป็น `AVAILABLE`
- Donor แก้ไข/ยกเลิกได้เฉพาะรายการ `PENDING_REVIEW`

### Categories

- `GET /api/categories`
- Frontend ใช้ทั้ง dropdown และ category tabs

### Requests

- `GET /api/requests/mine`
- `POST /api/requests`
- `DELETE /api/requests/:id`
- `PATCH /api/requests/:id/confirm`
- ตรวจจำนวนของและป้องกันการขอซ้ำ
- การอนุมัติใช้ Prisma transaction และตัด stock ใน transaction เดียวกัน

### Admin

- `GET /api/admin/users`
- `GET /api/admin/items`
- `PATCH /api/admin/items/:id/review`
- `GET /api/admin/requests`
- `PATCH /api/admin/requests/:id/status`
- Admin เปลี่ยนสถานะเป็น `APPROVED`, `REJECTED` หรือ `SHIPPED`
- `DELIVERED` ให้ผู้รับกดยืนยันเอง

### สถานะการส่งมอบที่ใช้อยู่

```text
PENDING   = รออนุมัติ
APPROVED  = นัดวันเข้ารับ
SHIPPED   = อยู่ระหว่างจัดส่ง
DELIVERED = ผู้รับได้รับพัสดุแล้ว
```

## 4. สิ่งที่ทำแล้ว — Frontend

### Navigation และ Role layout

- แถบบน: Logo, ชื่อผู้ใช้/องค์กร, Role และปุ่มออกจากระบบ
- แถบล่าง: แยกกลุ่ม `เมนูหลัก`, `การบริจาค`, `การรับของ`, `งานเจ้าหน้าที่`
- Tab ที่ active มีเส้นแสดงสถานะ
- Logout ล้าง Zustand, localStorage และ TanStack Query cache
- หลัง logout กลับไป `/items`

### Public pages

- `/items` คลังของบริจาค
- ค้นหาและกรองหมวดหมู่
- Category tabs
- Skeleton loading
- Empty state และ error state
- `/items/:id` รายละเอียดของบริจาค

### Donor pages

- `/my-donations`
- เพิ่มรายการบริจาค
- แก้ไข/ยกเลิก flow ตามสถานะ Backend
- Status tabs
- ใส่ URL รูปภาพได้ทันที
- มี file picker และ preview รูปภาพเตรียมไว้แล้ว
- `/my-donations/:id` ดูสถานะรายชิ้น
- Donor เห็นผู้รับที่จอง จำนวน และสถานะการส่งมอบ

### Recipient pages

- `/my-requests`
- `/tracking`
- ขอรับของจากหน้า item detail
- ระบุจำนวนและเหตุผลในการขอรับ
- ติดตาม timeline
- กดยืนยันว่าได้รับพัสดุแล้วเมื่อสถานะ `SHIPPED`

### Admin pages

- `/admin`
- กรองคำขอตามสถานะ
- ดูตารางพัสดุ
- ปุ่ม `ดูรายละเอียด`, `อนุมัติ`, `ปฏิเสธ`, `เริ่มจัดส่ง`
- ทุกปุ่ม action เปิด popup ให้ตรวจสอบข้อมูลก่อน
- ต้องติ๊กยืนยันว่าได้ตรวจสอบข้อมูลก่อนอนุมัติ/ปฏิเสธ
- Popup แสดงผู้บริจาค ผู้ขอรับ จำนวน วันจอง และสถานะ
- ตารางผู้ใช้ในระบบ
- ตารางพัสดุ refresh ทุก 15 วินาที

## 5. งานที่ต้องให้ DB master ทำต่อ

ยังไม่มีการแก้ schema ใน branch นี้สำหรับข้อมูลนัดรับและรูปภาพแบบ Database storage

### ข้อมูลนัดรับ/จัดส่ง

แนะนำเพิ่มใน `Request`:

```prisma
pickupScheduledAt DateTime?
pickupAt          DateTime?
pickupLocation    String?
pickupNote        String?
```

เพื่อรองรับ:

- วัน/เวลานัดเข้ารับ
- วัน/เวลาที่เข้ารับจริง
- สถานที่รับ
- หมายเหตุของ Admin

### รูปภาพแบบเก็บใน Database

แนะนำเพิ่มใน `Item`:

```prisma
imageData Bytes?
imageMime String?
```

และเพิ่ม API สำหรับ `multipart/form-data` โดยจำกัดขนาดไฟล์ประมาณ 5 MB

### Notification

เมื่อผู้รับจองของ ต้องแจ้ง Donor ควรเพิ่ม model ประมาณนี้:

```prisma
model Notification {
  id        Int      @id @default(autoincrement())
  userId    Int
  requestId Int?
  type      String
  message   String
  readAt    DateTime?
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
  request   Request? @relation(fields: [requestId], references: [id])
}
```

หลัง DB master เพิ่ม schema แล้ว ต้องทำต่อ:

1. สร้าง migration ตามขั้นตอนของทีม
2. Generate Prisma Client
3. เพิ่ม controller/service สำหรับวันนัด รูปภาพ และ notification
4. ต่อ popup ให้บันทึกวันนัดและหมายเหตุจริง
5. ต่อ file picker ให้ส่ง `multipart/form-data`
6. เพิ่ม notification badge และ `GET /api/notifications`

## 6. งานที่ทีม Backend/API ควรทำต่อ

- เพิ่ม validation แบบ Zod ให้ครบทุก body และ params
- เพิ่ม error mapping สำหรับ Prisma error ให้ครบทุก status code
- ตรวจ business rule การเปลี่ยนสถานะไม่ให้ข้ามขั้น
- เพิ่ม `requireRole` และ protected route ให้ครบทุกหน้า
- เพิ่ม Admin action สำหรับ reject พร้อมเหตุผล
- เพิ่ม notification เมื่อมีการสร้าง request
- เพิ่ม notification เมื่อ Admin อนุมัติหรือเริ่มจัดส่ง
- เพิ่ม test สำหรับ auth, item, request และ transaction

## 7. งานที่ทีม Frontend ควรทำต่อ

- เพิ่ม ProtectedRoute สำหรับ DONOR, RECIPIENT และ ADMIN
- เพิ่มหน้า Signup และเลือก Role
- เพิ่มหน้าแก้ไขรายการบริจาค
- เพิ่มหน้า Admin สำหรับจัดการ items และ requests แบบเต็ม
- ต่อ popup วันนัดกับ field จาก DB
- ต่อ file upload หลัง DB master เพิ่ม `imageData`
- เพิ่ม notification panel และ badge
- ทดสอบ responsive ที่ 375, 768 และ 1280 px

## 8. วิธีรันในเครื่อง

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

ห้ามรัน `migrate` หรือ `seed` เอง ให้ประสาน DB master ก่อน

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

เปิดเว็บที่ `http://localhost:5173/items`

## 9. การส่งต่อให้ DB master

ให้ DB master:

1. checkout branch `thanakorn-backend`
2. อ่านไฟล์นี้ก่อนแก้ schema
3. เพิ่ม schema สำหรับ pickup, image และ notification
4. ทำ migration ตามกระบวนการของทีม
5. merge branch นี้เข้า `main` หลังตรวจสอบแล้ว

คำสั่งตัวอย่าง:

```bash
git fetch origin
git checkout thanakorn-backend
git checkout main
git merge thanakorn-backend
```

## 10. Verification checklist

- [x] Backend typecheck ผ่าน
- [x] Frontend build ผ่าน
- [x] API อ่านข้อมูลจาก Database online ได้
- [x] Donor เพิ่มรายการได้
- [x] Recipient ขอรับของได้
- [x] Admin ดู user และติดตาม request ได้
- [x] Admin ต้องเปิดรายละเอียดก่อนอนุมัติ/ปฏิเสธ
- [x] Recipient ยืนยันรับพัสดุได้
- [ ] บันทึกวันนัดและวันรับจริงลง Database
- [ ] บันทึกรูปภาพเป็น `Bytes` ใน Database
- [ ] Notification แบบถาวร
- [ ] ProtectedRoute และ Signup แบบสมบูรณ์
