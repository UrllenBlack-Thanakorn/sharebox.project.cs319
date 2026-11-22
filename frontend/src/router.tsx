import { useQueryClient } from "@tanstack/react-query";
import { createBrowserRouter, Link, Navigate, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "./stores/authStore";
import { AdminPage } from "./pages/AdminPage";
import { DonationStatusPage } from "./pages/DonationStatusPage";
import { ItemDetailPage } from "./pages/ItemDetailPage";
import { ItemsPage } from "./pages/ItemsPage";
import { LoginPage } from "./pages/LoginPage";
import { MyDonationsPage } from "./pages/MyDonationsPage";
import { MyRequestsPage } from "./pages/MyRequestsPage";
import { TrackingPage } from "./pages/TrackingPage";

const roleLabel = { DONOR: "ผู้บริจาค", RECIPIENT: "องค์กรผู้รับ", ADMIN: "เจ้าหน้าที่" } as const;

// Layout เป็นกรอบร่วมของทุกหน้า: navbar, ข้อมูลบัญชี, logout และตำแหน่ง Outlet
// เมนูที่เห็นจะแตกต่างตาม role แต่สิทธิ์จริงยังต้องตรวจซ้ำที่ Backend
// TODO [Routing/Auth]: ตอนนี้หน้าใช้ role-based navigation เพื่อซ่อนเมนูที่ไม่เกี่ยวข้อง
// แต่ production ควรมี ProtectedRoute ตรวจสิทธิ์ซ้ำที่ route/API ไม่พึ่งการซ่อนเมนูอย่างเดียว
function Layout() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const tabClass = ({ isActive }: { isActive: boolean }) => `nav-tab${isActive ? " active" : ""}`;

  // TODO [Logout]: clear ทั้ง token, Zustand session และ React Query cache เพื่อไม่ให้ข้อมูล role เดิมค้าง
  function handleLogout() { queryClient.clear(); logout(); navigate("/items", { replace: true }); }

  return <>
    <header className="topbar"><Link className="brand" to="/items" aria-label="ShareBox คลังของบริจาค"><span className="brand-mark">S</span><span>Share<span>Box</span></span></Link><div className="account-actions">{user ? <><div className="account-summary"><strong>{user.name}</strong><span>{user.role === "RECIPIENT" ? user.orgName || roleLabel[user.role] : roleLabel[user.role]}</span></div><button className="link-button" onClick={handleLogout}>ออกจากระบบ</button></> : <NavLink className="primary small" to="/login">เข้าสู่ระบบ</NavLink>}</div></header>
    <div className="nav-shell"><nav className="workspace-nav" aria-label="เมนูหลัก"><div className="nav-group"><span className="nav-section-label">เมนูหลัก</span><div className="nav-tabs"><NavLink className={tabClass} to="/items" end>คลังของบริจาค</NavLink></div></div>{user?.role === "DONOR" && <div className="nav-group"><span className="nav-section-label">การบริจาค</span><div className="nav-tabs"><NavLink className={tabClass} to="/my-donations">ของที่ฉันบริจาค</NavLink></div></div>}{user?.role === "RECIPIENT" && <div className="nav-group"><span className="nav-section-label">การรับของ</span><div className="nav-tabs"><NavLink className={tabClass} to="/my-requests">คำขอของฉัน</NavLink><NavLink className={tabClass} to="/tracking">ติดตามพัสดุ</NavLink></div></div>}{user?.role === "ADMIN" && <div className="nav-group"><span className="nav-section-label">งานเจ้าหน้าที่</span><div className="nav-tabs"><NavLink className={tabClass} to="/admin">จัดการระบบ</NavLink></div></div>}</nav></div>
    <Outlet />
  </>;
}

// TODO [Route map]: route รายการ, คำขอ และ tracking แยกกันเพื่อให้ตอบโจทย์แต่ละ role
// หากเพิ่มหน้าใหม่ ต้องเพิ่มทั้ง route, nav tab, permission และลิงก์กลับจากหน้ารายละเอียด
export const router = createBrowserRouter([{ element: <Layout />, children: [{ path: "/", element: <Navigate to="/items" replace /> }, { path: "/items", element: <ItemsPage /> }, { path: "/items/:id", element: <ItemDetailPage /> }, { path: "/my-donations", element: <MyDonationsPage /> }, { path: "/my-donations/:id", element: <DonationStatusPage /> }, { path: "/my-requests", element: <MyRequestsPage /> }, { path: "/tracking", element: <TrackingPage /> }, { path: "/admin", element: <AdminPage /> }, { path: "/login", element: <LoginPage /> }, { path: "*", element: <Navigate to="/items" replace /> }] }]);
