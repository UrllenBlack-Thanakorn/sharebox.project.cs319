import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  // TODO [Migration]: ผู้แก้ schema ต้องตรวจ DATABASE_URL/DIRECT_URL และสร้าง migration
  // หลังตกลงกับ DB master เท่านั้น ห้ามรัน migrate หรือ seed บนฐานข้อมูลร่วมโดยพลการ
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  // CLI (migrate / studio) ใช้ DIRECT_URL (session pooler port 5432)
  datasource: {
    url: env("DIRECT_URL"),
  },
});
