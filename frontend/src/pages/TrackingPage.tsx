import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../api/client";

const labels = { PENDING: "รออนุมัติ", APPROVED: "นัดวันเข้ารับ", REJECTED: "ไม่อนุมัติ", SHIPPED: "อยู่ระหว่างจัดส่ง", DELIVERED: "ผู้รับได้รับพัสดุแล้ว" } as const;
const stages = ["PENDING", "APPROVED", "SHIPPED", "DELIVERED"] as const;

// หน้านี้เน้น timeline ของพัสดุสำหรับ RECIPIENT โดยใช้ข้อมูลชุดเดียวกับคำขอของฉัน
// หากเพิ่มวันนัด/ผู้ขนส่ง/เลขติดตาม ต้องขยายทั้ง type, API response และ timeline พร้อมกัน
export function TrackingPage() {
  const queryClient = useQueryClient();
  const requests = useQuery({ queryKey: ["my-requests"], queryFn: api.myRequests });
  const confirm = useMutation({ mutationFn: api.confirmRequest, onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["my-requests"] }) });
  if (requests.isLoading) return <main className="page"><div className="state-card">กำลังโหลดสถานะพัสดุ</div></main>;
  if (requests.isError) return <main className="page"><div className="state-card error"><p>โหลดสถานะไม่สำเร็จ</p><small>{(requests.error as Error).message}</small><button className="primary" onClick={() => void requests.refetch()}>ลองใหม่</button></div></main>;
  return <main className="page"><section className="page-heading"><div><p className="eyebrow">ShareBox / Tracking</p><h1>ติดตามสถานะพัสดุ</h1><p className="lede">ติดตามตั้งแต่รออนุมัติ นัดวันเข้ารับ จัดส่ง จนถึงได้รับพัสดุ</p></div><Link className="secondary" to="/items">ค้นหาของเพิ่ม</Link></section><div className="tracking-list">{requests.data?.map((request) => { const current = request.status === "REJECTED" ? -1 : stages.indexOf(request.status as typeof stages[number]); return <article className="tracking-card" key={request.id}><div className="tracking-card-head"><div><span className="tracking-category">{request.item.category.name}</span><h2>{request.item.name}</h2></div><span className={`status status-${request.status.toLowerCase()}`}>{labels[request.status]}</span></div><div className="tracking-timeline">{stages.map((stage, index) => <div className={`tracking-step ${request.status === "REJECTED" ? "rejected" : index < current ? "done" : index === current ? "current" : ""}`} key={stage}><span className="tracking-dot"/><span>{stage === "PENDING" ? "ส่งคำขอ" : stage === "APPROVED" ? "นัดวันเข้ารับ" : stage === "SHIPPED" ? "อยู่ระหว่างจัดส่ง" : "ผู้รับได้รับพัสดุแล้ว"}</span></div>)}</div>{request.status === "SHIPPED" && <button className="primary" disabled={confirm.isPending} onClick={() => void confirm.mutateAsync(request.id)}>{confirm.isPending ? "กำลังบันทึก" : "ยืนยันว่าได้รับพัสดุแล้ว"}</button>}{request.status === "REJECTED" && <p className="tracking-note">คำขอนี้ไม่ได้รับการอนุมัติ</p>}</article>; })}{requests.data?.length === 0 && <div className="state-card"><h2>ยังไม่มีพัสดุให้ติดตาม</h2><p>ยื่นคำขอรับของจากรายการสิ่งของก่อน</p><Link className="primary" to="/items">ไปที่รายการสิ่งของ</Link></div>}</div></main>;
}
