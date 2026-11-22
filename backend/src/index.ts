import express from "express";
import cors from "cors";
import { prisma } from "./lib/prisma.js";
import { env } from "./config/env.js";
import categoriesRouter from "./routes/categories.js";
import authRouter from "./routes/auth.js";
import itemsRouter from "./routes/items.js";
import requestsRouter from "./routes/requests.js";
import adminRouter from "./routes/admin.js";
import { errorHandler, notFound } from "./middlewares/errorHandler.js";

// ส่วนนี้คือจุดเริ่มต้นของ Backend: สร้าง Express app, เปิด middleware กลาง,
// ผูก route ของแต่ละ feature และเปิด HTTP server ให้ Frontend เรียกใช้งาน
const app = express();

// TODO [CORS]: production ต้องกำหนด CLIENT_URL เป็นโดเมน Frontend จริงของ Vercel
// และไม่ควรเปิดเป็น wildcard เพราะ API มีข้อมูลผู้ใช้และเส้นทางที่ต้องยืนยันตัวตน
app.use(cors({ origin: env.clientUrl }));
app.use(express.json());

app.get("/api/health", async (_req, res) => {
  const items = await prisma.item.count();
  res.json({ data: { status: "ok", items } });
});

// TODO [API contract]: ทุก route ควรรักษารูปแบบ response เป็น { data } หรือ { error }
// เพื่อให้ frontend แก้จุดเดียวใน api/client.ts ได้ง่ายเมื่อเพิ่ม endpoint ใหม่
app.use("/api/categories", categoriesRouter);
app.use("/api/auth", authRouter);
app.use("/api/items", itemsRouter);
app.use("/api/requests", requestsRouter);
app.use("/api/admin", adminRouter);

app.use(notFound);
app.use(errorHandler);

// Vercel ใช้ default export นี้ ส่วนในเครื่องใช้ app.listen ด้านล่าง
export default app;

app.listen(env.port, () => {
  console.log(`ShareBox API running on http://localhost:${env.port}`);
});
