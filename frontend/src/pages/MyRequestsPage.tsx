import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../api/client";

const statusLabel = { PENDING: "รออนุมัติ", APPROVED: "นัดวันเข้ารับ", REJECTED: "ไม่อนุมัติ", SHIPPED: "อยู่ระหว่างจัดส่ง", DELIVERED: "ผู้รับได้รับพัสดุแล้ว" } as const;

// หน้านี้แสดงคำขอของ RECIPIENT และเป็นจุดที่ผู้รับยืนยัน DELIVERED ได้
// การยืนยันจะเรียก PATCH /api/requests/:id/confirm และ invalidate cache ให้ UI อัปเดต
export function MyRequestsPage() {
  const queryClient = useQueryClient();
  const requests = useQuery({ queryKey: ["my-requests"], queryFn: api.myRequests });
  const confirm = useMutation({ mutationFn: api.confirmRequest, onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["my-requests"] }) });
  if (requests.isLoading) return <main className="page"><div className="state-card">กำลังโหลดคำขอของคุณ</div></main>;
  if (requests.isError) return <main className="page"><div className="state-card error"><p>โหลดคำขอไม่สำเร็จ</p><small>{(requests.error as Error).message}</small><button className="primary" onClick={() => void requests.refetch()}>ลองใหม่</button></div></main>;
  return <main className="page"><section className="page-heading"><div><p className="eyebrow">ShareBox / My requests</p><h1>คำขอของฉัน</h1><p className="lede">ติดตามตั้งแต่คำขอถูกส่ง จนถึงวันที่ผู้รับได้รับพัสดุ</p></div><Link className="primary" to="/items">ค้นหาของเพิ่ม</Link></section><div className="request-list">{requests.data?.map((request) => <article className="request-row" key={request.id}><div className="request-main"><div className="item-topline"><span>{request.item.category.name}</span><span className={`status status-${request.status.toLowerCase()}`}>{statusLabel[request.status]}</span></div><h2>{request.item.name}</h2><p>จำนวน {request.quantity} ชิ้น · {request.reason}</p><div className="request-track"><span className={request.status !== "PENDING" ? "done" : "current"}>ส่งคำขอ</span><span className={["APPROVED", "SHIPPED", "DELIVERED"].includes(request.status) ? "done" : request.status === "APPROVED" ? "current" : ""}>นัดวันเข้ารับ</span><span className={["SHIPPED", "DELIVERED"].includes(request.status) ? "done" : request.status === "SHIPPED" ? "current" : ""}>อยู่ระหว่างจัดส่ง</span><span className={request.status === "DELIVERED" ? "done" : ""}>ได้รับพัสดุแล้ว</span></div></div>{request.status === "SHIPPED" && <button className="primary" disabled={confirm.isPending} onClick={() => void confirm.mutateAsync(request.id)}>ยืนยันว่าได้รับพัสดุแล้ว</button>}</article>)}{requests.data?.length === 0 && <div className="state-card"><h2>ยังไม่มีคำขอ</h2><p>เลือกสิ่งของจากคลังเพื่อเริ่มส่งคำขอ</p><Link className="secondary" to="/items">ไปที่รายการสิ่งของ</Link></div>}</div></main>;
}
