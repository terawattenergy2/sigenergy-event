"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Ticket,
  Building2,
  UserRound,
  BriefcaseBusiness,
  LoaderCircle,
  ShieldCheck,
  ScanLine,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { PRIZES } from "@/lib/prizes";
export default function Registration() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [previous, setPrevious] = useState("");
  useEffect(() => {
    setPrevious(localStorage.getItem("te_entry_token") ?? "");
  }, []);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!consent) {
      setError("กรุณายินยอมให้ใช้ข้อมูลสำหรับกิจกรรมนี้");
      return;
    }
    setBusy(true);
    setError("");
    try {
      let requestKey = localStorage.getItem("te_registration_key");
      if (!requestKey) {
        requestKey = crypto.randomUUID();
        localStorage.setItem("te_registration_key", requestKey);
      }
      const r = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, company, position, consent, requestKey }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      localStorage.setItem("te_entry_token", d.token);
      router.replace("/voucher/" + encodeURIComponent(d.token));
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "ยังบันทึกข้อมูลไม่ได้ กรุณาลองอีกครั้ง",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="site">
      <header className="site-header">
        <a className="brand" href="/">
          <span className="brand-mark">TE</span>
          <span className="brand-divider" />
          <span className="partner">sigenergy</span>
        </a>
        <span className="header-caption">EVENT PRIVILEGES</span>
      </header>
      <div className="registration-layout">
        <section className="campaign">
          <div className="eyebrow">
            <span /> EXCLUSIVE EVENT REWARDS
          </div>
          <h1>
            รับสิทธิ์ของคุณ
            <br />
            <span>เปิดโอกาสพลังงานใหม่</span>
          </h1>
          <p className="lead">
            ลงทะเบียนร่วมงาน รับ voucher เฉพาะบุคคล
            <br />
            และลุ้นส่วนลดพิเศษจาก Sigenergy
          </p>
          <div className="product-scene">
            <img
              src="/assets/voucher-background.jpg"
              alt="ภาพคอนเซ็ปต์ระบบ inverter และกักเก็บพลังงาน"
            />
            <div className="scene-copy">
              <span>SOLAR · STORAGE · SMART ENERGY</span>
              <strong>
                พลังงานที่เป็นไปได้
                <br />
                มากกว่าที่เคย
              </strong>
            </div>
            <small>ภาพประกอบแนวคิดระบบพลังงาน</small>
          </div>
          <div className="prize-list">
            {PRIZES.map((p) => (
              <div className="prize-card" key={p.id}>
                <div className="prize-percent">
                  {p.discount}
                  <span>%</span>
                </div>
                <div>
                  <strong>{p.label}</strong>
                  <p>ส่วนลดสูงสุด {p.cap.toLocaleString("th-TH")} บาท</p>
                </div>
                <span className="prize-count">{p.quantity} รางวัล</span>
              </div>
            ))}
          </div>
          <p className="campaign-note">
            3 ประเภทรางวัล · ผู้ชนะ 13 คน · รับผู้ร่วมงานสูงสุด 150 คน
          </p>
        </section>
        <section className="form-card">
          <div className="form-top">
            <span className="form-icon">
              <Ticket size={25} />
            </span>
            <span className="step-tag">01 / ลงทะเบียน</span>
          </div>
          <h2>ลงทะเบียนรับ voucher</h2>
          <p className="muted">
            กรอกข้อมูลของคุณให้ครบ เพื่อรับสิทธิ์ร่วมลุ้นรางวัล
          </p>
          {previous && (
            <a
              className="existing-voucher"
              href={"/voucher/" + encodeURIComponent(previous)}
            >
              คุณมี voucher แล้ว · เปิด voucher ของฉัน
            </a>
          )}
          <form onSubmit={submit}>
            <label htmlFor="company">
              ชื่อบริษัท <em>*</em>
            </label>
            <div className="field">
              <Building2 size={19} />
              <Input
                id="company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="ชื่อบริษัทของคุณ"
                autoComplete="organization"
                maxLength={120}
                required
              />
            </div>
            <label htmlFor="position">
              ตำแหน่ง <em>*</em>
            </label>
            <div className="field">
              <BriefcaseBusiness size={19} />
              <Input
                id="position"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="ตำแหน่งงาน"
                autoComplete="organization-title"
                maxLength={120}
                required
              />
            </div>
            <label htmlFor="name">
              ชื่อผู้ร่วมงาน <em>*</em>
            </label>
            <div className="field">
              <UserRound size={19} />
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ชื่อที่ใช้รับสิทธิ์ร่วมลุ้นรางวัล"
                autoComplete="name"
                maxLength={120}
                required
              />
            </div>
            <div className="consent">
              <Checkbox
                id="consent"
                checked={consent}
                onCheckedChange={(v) => setConsent(v === true)}
              />
              <label htmlFor="consent">
                ยินยอมให้ {process.env.NEXT_PUBLIC_COMPANY_NAME ?? "TE"}{" "}
                เก็บชื่อ บริษัท และตำแหน่ง
                เพื่อจัดกิจกรรม จับรางวัล และแจ้งผลรางวัล
              </label>
            </div>
            <p className="privacy">
              ข้อมูลจะใช้สำหรับกิจกรรมนี้ ผู้จัดงานเป็นผู้ดูแลข้อมูล
              <br />
              {process.env.NEXT_PUBLIC_CONTACT_TEXT ??
                "ติดต่อผู้จัดงานเพื่อสอบถามหรือขอแก้ไขข้อมูล"}
            </p>
            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
            <Button type="submit" className="primary-button" disabled={busy}>
              {busy ? (
                <LoaderCircle className="spin" size={19} />
              ) : (
                <Ticket size={19} />
              )}{" "}
              {busy ? "กำลังบันทึกข้อมูล…" : "รับ voucher ของฉัน"}
            </Button>
          </form>
          <div className="after-register">
            <ScanLine size={24} />
            <div>
              <strong>รับรูป voucher แล้วแอด LINE OA</strong>
              <p>ตรวจผลบนเว็บ แล้วส่งรูปผลรางวัลให้บริษัทในแชต</p>
            </div>
          </div>
          <p className="secure-note">
            <ShieldCheck size={15} /> รหัส TE-001 ถึง TE-150 ·
            หนึ่งสิทธิ์ต่อข้อมูลผู้ร่วมงาน
          </p>
        </section>
      </div>
      <footer>
        <span>TE × SIGENERGY</span>
        <a href="/admin">สำหรับผู้จัดงาน</a>
      </footer>
    </main>
  );
}
