"use client";
import { useEffect, useState } from "react";
import {
  Check,
  Download,
  MessageCircle,
  RefreshCw,
  LoaderCircle,
} from "lucide-react";
import { LINE_OA_URL } from "@/lib/contact";
import { Button } from "@/components/ui/button";
type Entry = {
  code: string;
  name: string;
  company: string;
  position: string;
  lineLinked: boolean;
  status: "pending" | "winner" | "not_selected";
  prize: { label: string; discount: number; cap: number } | null;
};
export default function VoucherView({ token }: { token: string }) {
  const [entry, setEntry] = useState<Entry | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  async function load() {
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/voucher/" + encodeURIComponent(token));
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setEntry(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : "โหลด voucher ไม่ได้");
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    load();
  }, [token]);
  const base = "/api/voucher/" + encodeURIComponent(token) + "/image";
  const line = LINE_OA_URL;
  const validLine = !!line && /^https:\/\/(lin\.ee|line\.me)\//.test(line);
  async function download(kind: "entry" | "result") {
    setError("");
    try {
      const r = await fetch(base + "?kind=" + kind);
      if (!r.ok) throw new Error("ดาวน์โหลดรูปไม่ได้ กรุณาลองใหม่");
      const url = URL.createObjectURL(await r.blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = (entry?.code ?? "voucher") + "-" + kind + ".png";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "ดาวน์โหลดไม่ได้");
    }
  }
  return (
    <main className="site voucher-page">
      <header className="site-header">
        <a className="brand" href="/">
          <span className="brand-mark">TE</span>
          <span className="brand-divider" />
          <span className="partner">sigenergy</span>
        </a>
        <span className="header-caption">YOUR PERSONAL VOUCHER</span>
      </header>
      <section className="voucher-content">
        <div className="voucher-heading">
          <span className="success-icon">
            <Check size={22} />
          </span>
          <div>
            <h1>ลงทะเบียนเรียบร้อย</h1>
            <p>เก็บรูป voucher และลิงก์หน้านี้ไว้เพื่อตรวจผลรางวัล</p>
          </div>
        </div>
        {busy && !entry && (
          <p>
            <LoaderCircle className="spin" /> กำลังโหลด voucher…
          </p>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {entry && (
          <>
            <div className="voucher-picture">
              <img
                src={base + "?kind=entry"}
                alt={
                  "voucher สิทธิ์ร่วมลุ้นรางวัล " +
                  entry.code +
                  " ของ " +
                  entry.name
                }
                onError={() => setImageFailed(true)}
              />
            </div>
            {imageFailed && (
              <p className="error">
                ยังแสดงรูปไม่ได้ กรุณารีเฟรชหรือติดต่อผู้จัดงาน
              </p>
            )}
            <div className="voucher-actions">
              <Button
                className="primary-button"
                onClick={() => download("entry")}
              >
                <Download size={19} />
                บันทึกรูป voucher
              </Button>
              {validLine ? (
                <a
                  className="line-button"
                  href={line}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle size={20} />
                  แอด LINE OA
                </a>
              ) : (
                <div className="line-not-configured">
                  ผู้จัดงานยังไม่เปิดลิงก์ LINE OA
                </div>
              )}
            </div>
            <div className="line-instructions">
              <span className="number-badge">1</span>
              <div>
                <strong>แอด LINE OA ของบริษัท</strong>
                <p>เพิ่มเพื่อนไว้เพื่อติดต่อผู้จัดงาน</p>
              </div>
              <span className="number-badge">2</span>
              <div>
                <strong>ตรวจผลและส่งรูปให้บริษัท</strong>
                <p>
                  หลังจับรางวัล กด “ตรวจผล” แล้วดาวน์โหลดรูปผลรางวัล
                  ส่งรูปให้บริษัทในแชต LINE เพื่อยืนยันสิทธิ์
                </p>
              </div>
            </div>
            <div className="status-panel">
              <div>
                <span className="eyebrow">สถานะสิทธิ์ {entry.code}</span>
                <h3>
                  {entry.status === "winner"
                    ? `ได้รับส่วนลด ${entry.prize?.label} ${entry.prize?.discount}%`
                    : entry.status === "not_selected"
                      ? "รอบนี้ไม่ได้รับรางวัล"
                      : "รอการจับรางวัลจากผู้จัดงาน"}
                </h3>
                <p>
                  ตรวจผลบนเว็บ แล้วส่งรูปผลรางวัลให้ผู้จัดงานทาง LINE ด้วยตนเอง
                </p>
              </div>
              <Button variant="outline" onClick={load} disabled={busy}>
                <RefreshCw size={17} />
                ตรวจผล
              </Button>
            </div>
            {entry.status !== "pending" && (
              <Button variant="outline" onClick={() => download("result")}>
                <Download size={17} />
                ดาวน์โหลดรูปผลรางวัล
              </Button>
            )}
            <p className="privacy">
              QR และข้อความยืนยันสิทธิ์เป็นของคุณ
              กรุณาอย่าเผยแพร่หรือส่งต่อให้ผู้อื่น
              <br />
              voucher ร่วมลุ้นรางวัลยังไม่ใช่การยืนยันว่าได้รับส่วนลด
              เงื่อนไขการใช้ส่วนลดกำหนดโดยผู้จัดงาน
            </p>
          </>
        )}
      </section>
    </main>
  );
}
