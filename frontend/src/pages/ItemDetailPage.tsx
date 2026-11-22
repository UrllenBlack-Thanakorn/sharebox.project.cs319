import { FormEvent, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import { useAuthStore } from "../stores/authStore";

// หน้านี้แสดงของรายชิ้น และให้ RECIPIENT ส่งคำขอรับของผ่าน POST /api/requests
// DONOR/ผู้ที่ยังไม่ login ดูรายละเอียดได้ แต่ไม่ควรเห็นฟอร์มขอรับของ
export function ItemDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const item = useQuery({ queryKey: ["item", id], queryFn: () => api.item(id) });
  const [quantity, setQuantity] = useState("1");
  const [reason, setReason] = useState("");
  const request = useMutation({ mutationFn: api.createRequest, onSuccess: () => navigate("/my-requests") });
  if (item.isLoading) return <main className="page"><div className="state-card">กำลังโหลดรายละเอียด</div></main>;
  if (item.isError || !item.data) return <main className="page"><div className="state-card error">ไม่พบสิ่งของนี้</div></main>;
  const data = item.data;
  function submit(event: FormEvent) { event.preventDefault(); void request.mutateAsync({ itemId: data.id, quantity: Number(quantity), reason: reason.trim() }); }
  return <main className="page detail"><Link className="back-link" to="/items">← กลับไปรายการสิ่งของ</Link><section className="detail-card"><div className="detail-image">{data.imageUrl ? <img src={data.imageUrl} alt=""/> : <span className="item-placeholder">ShareBox</span>}</div><div><p className="eyebrow">{data.category.name}</p><h1>{data.name}</h1><p>{data.description}</p><div className="detail-meta"><span>สภาพ {data.condition}</span><strong>คงเหลือ {data.quantity} ชิ้น</strong></div>{user?.role === "RECIPIENT" ? <form className="request-form" onSubmit={submit}><h2>ขอรับสิ่งของ</h2><label>จำนวนที่ต้องการ<input type="number" min="1" max={data.quantity} value={quantity} onChange={(event) => setQuantity(event.target.value)} required /></label><label>เหตุผลในการขอรับ<textarea rows={3} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="บอกความต้องการขององค์กร" required /></label>{request.isError && <p className="error">{(request.error as Error).message}</p>}<button className="primary" disabled={request.isPending}>{request.isPending ? "กำลังส่งคำขอ" : "ส่งคำขอรับของ"}</button></form> : !user ? <div className="login-hint"><p>เข้าสู่ระบบด้วยบทบาทองค์กรผู้รับเพื่อขอรับสิ่งของ</p><Link className="secondary" to="/login">เข้าสู่ระบบ</Link></div> : null}</div></section></main>;
}
