import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../api/client";

const conditionLabel = { NEW: "ของใหม่", GOOD: "สภาพดี", USED: "มือสอง" } as const;

// หน้านี้คือคลังสาธารณะ ใช้ค้นหา/กรองหมวดหมู่และเปิดดูรายละเอียดของบริจาค
// ข้อมูลทั้งหมดมาจาก GET /api/items ผ่าน TanStack Query ไม่ใช่ข้อมูล mock ในหน้าเว็บ
export function ItemsPage() {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const categories = useQuery({ queryKey: ["categories"], queryFn: api.categories });
  const items = useQuery({ queryKey: ["items", search, categoryId], queryFn: () => api.items(search, categoryId) });
  const hasFilters = search.length > 0 || categoryId.length > 0;

  function clearFilters() {
    setSearch("");
    setCategoryId("");
  }

  return (
    <main className="page">
      <section className="page-heading">
        <div>
          <p className="eyebrow">ShareBox / Items</p>
          <h1>สิ่งของที่พร้อมส่งต่อ</h1>
          <p className="lede">ค้นหาของบริจาคจากคลังกลาง และเลือกสิ่งที่เหมาะกับความต้องการของคุณ</p>
        </div>
        <div className="result-count"><strong>{items.data?.length ?? 0}</strong><span>รายการพร้อมส่งต่อ</span></div>
      </section>

      <section className="filter-bar" aria-label="ตัวกรองรายการสิ่งของ">
        <label className="search-field"><span aria-hidden="true">⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ค้นหาชื่อหรือรายละเอียดสิ่งของ" /></label>
        <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} aria-label="เลือกหมวดหมู่">
          <option value="">ทุกหมวดหมู่</option>
          {categories.data?.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
        {hasFilters && <button className="clear-button" onClick={clearFilters}>ล้างตัวกรอง</button>}
      </section>
      <nav className="category-tabs" aria-label="หมวดหมู่สิ่งของ"><button className={!categoryId ? "active" : ""} onClick={() => setCategoryId("")}>ทั้งหมด</button>{categories.data?.map((category) => <button className={categoryId === String(category.id) ? "active" : ""} key={category.id} onClick={() => setCategoryId(String(category.id))}>{category.name}</button>)}</nav>

      {items.isLoading && <div className="item-grid" aria-label="กำลังโหลด"><SkeletonCards /></div>}
      {items.isError && <div className="state-card"><p>โหลดรายการไม่สำเร็จ</p><small>{(items.error as Error).message}</small><button className="primary" onClick={() => void items.refetch()}>ลองใหม่</button></div>}
      {!items.isLoading && !items.isError && items.data?.length === 0 && <div className="state-card"><div className="empty-icon">⌕</div><h2>ยังไม่พบสิ่งของ</h2><p>{hasFilters ? "ลองเปลี่ยนคำค้นหาหรือหมวดหมู่ดูอีกครั้ง" : "ขณะนี้ยังไม่มีสิ่งของที่พร้อมส่งต่อ"}</p>{hasFilters && <button className="secondary" onClick={clearFilters}>ดูทั้งหมด</button>}</div>}
      {!items.isLoading && !items.isError && (items.data?.length ?? 0) > 0 && <div className="item-grid">{items.data?.map((item) => <Link className="item-card" to={`/items/${item.id}`} key={item.id}><div className="item-image">{item.imageUrl ? <img src={item.imageUrl} alt="" loading="lazy" /> : <span className="item-placeholder">ShareBox</span>}</div><div className="item-content"><div className="item-topline"><span>{item.category.name}</span><span className="condition">{conditionLabel[item.condition]}</span></div><h2>{item.name}</h2><p>{item.description}</p><div className="item-footer"><span>เหลือ {item.quantity} ชิ้น</span><span className="view-link">ดูรายละเอียด <b>↗</b></span></div></div></Link>)}</div>}
    </main>
  );
}

function SkeletonCards() {
  return <>{[1, 2, 3, 4, 5, 6].map((key) => <div className="skeleton-card" key={key}><div className="skeleton image" /><div className="skeleton line short" /><div className="skeleton line" /><div className="skeleton line medium" /></div>)}</>;
}
