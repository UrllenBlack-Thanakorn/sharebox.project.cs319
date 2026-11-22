import { create } from "zustand";
import type { User } from "../types";
type AuthState = { user: User | null; token: string | null; setSession: (token: string, user: User) => void; logout: () => void };
// Store นี้เก็บ session ที่หลายหน้าใช้ร่วมกัน เช่น role, ชื่อ และ token สำหรับเรียก API
// TODO [Session]: ตอนเปิดแอปควรเรียก /auth/me เพื่อตรวจ token และ role กับฐานข้อมูลจริง
// การอ่าน localStorage ตอนนี้ช่วยให้ UX ต่อเนื่อง แต่ไม่ควรเป็นแหล่งยืนยันสิทธิ์เพียงอย่างเดียว
const savedUser = localStorage.getItem("sharebox-user");
export const useAuthStore = create<AuthState>((set) => ({ user: savedUser ? JSON.parse(savedUser) as User : null, token: localStorage.getItem("sharebox-token"), setSession: (token, user) => { localStorage.setItem("sharebox-token", token); localStorage.setItem("sharebox-user", JSON.stringify(user)); set({ token, user }); }, logout: () => { localStorage.removeItem("sharebox-token"); localStorage.removeItem("sharebox-user"); set({ token: null, user: null }); } }));
