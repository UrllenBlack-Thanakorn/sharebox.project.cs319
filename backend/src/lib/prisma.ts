import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

// TODO [Database]: DATABASE_URL ใช้ runtime connection กับ transaction pooler (6543)
// ห้าม hard-code credential ลง repo; DIRECT_URL ใช้สำหรับ Prisma CLI/migration เท่านั้น
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });

export const prisma = new PrismaClient({ adapter });
