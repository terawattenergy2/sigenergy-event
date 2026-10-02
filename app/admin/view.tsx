"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { LINE_OA_URL } from "@/lib/contact";
import Wheel from "@/components/wheel";
import { PRIZES, TOTAL_WINNERS, prizeLabel, prizeValue, type PrizeId } from "@/lib/prizes";
import {
  Maximize,
  Minimize,
  RotateCw,
  Download,
  LogOut,
  Users,
  Ticket,
  MessageCircle,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
type Participant = {
  id: string;
  code: string;
  name: string;
  company: string;
  position: string;
  created_at: string;
  prize_id: string | null;
  lineLinked: boolean;
};
type Overview = {
  state: {
    registrations_closed: boolean;
    finalized: boolean;
    reveal_until: string | null;
  };
  participants: Participant[];
  prizes: ((typeof PRIZES)[number] & { awarded: number })[];
  pendingMessages: number;
  lineReady: boolean;
};
type Winner = {
  code: string;
  name: string;
  company: string;
  position: string;
  prize_id: string;
};
export default function Admin() {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [prizeId, setPrizeId] = useState<PrizeId>("sigenstor");
  const [rotation, setRotation] = useState(0);
  const [codes, setCodes] = useState<string[]>([]);
  const [winner, setWinner] = useState<Winner | null>(null);
  const [stage, setStage] = useState(false);
  const [confirm, setConfirm] = useState<"close" | "finalize" | "reset-draws" | "reset-all" | null>(null);
  const [now, setNow] = useState(Date.now());
  const [recover, setRecover] = useState(false);
  const [resetText, setResetText] = useState("");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const stageRef = useRef<HTMLDivElement>(null);
  async function request(path: string, body?: unknown) {
    const r = await fetch("/api/admin/" + path, {
      method: body === undefined ? "GET" : "POST",
      headers: body === undefined ? {} : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const d = await r.json();
    if (!r.ok) {
      if (r.status === 401) setData(null);
      throw new Error(d.error ?? "คำขอไม่สำเร็จ");
    }
    return d;
  }
  async function refresh(silent = false, preserveWheel = false) {
    if (!silent) setLoading(true);
    try {
      const d = await request("overview");
      setData(d);
      if (!spinning && !winner && !preserveWheel)
        setCodes(
          d.participants
            .filter((p: Participant) => !p.prize_id)
            .map((p: Participant) => p.code),
        );
    } catch (e) {
      if (!silent)
        setError(e instanceof Error ? e.message : "โหลดข้อมูลไม่ได้");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    refresh();
    try {
      const p = JSON.parse(sessionStorage.getItem("te_pending_draw") ?? "null");
      if (p?.prizeId) {
        setPrizeId(p.prizeId);
        setRecover(true);
      }
    } catch {}
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearInterval(timer);
      timers.current.forEach(clearTimeout);
    };
  }, []);
  useEffect(() => {
    if (!data || spinning) return;
    const interval = setInterval(() => refresh(true), 15000);
    return () => clearInterval(interval);
  }, [!!data, spinning]);
  async function login(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await request("login", { username, password });
      setPassword("");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "เข้าสู่ระบบไม่ได้");
    } finally {
      setBusy(false);
    }
  }
  async function eventAction() {
    if (!confirm) return;
    setBusy(true);
    setError("");
    try {
      await request("event", { action: confirm, confirm: true, confirmation: resetText });
      if (confirm.startsWith("reset")) {
        sessionStorage.removeItem("te_pending_draw");
        setRecover(false); setWinner(null); setRotation(0);
        setCodes(confirm === "reset-all" ? [] : data!.participants.map(p => p.code));
        setResetText("");
      }
      setConfirm(null);
      await refresh();
      setMessage(
        confirm === "close"
          ? "ปิดรับลงทะเบียนแล้ว เริ่มจับรางวัลได้"
          : confirm === "reset-draws" ? "ล้างผลรางวัลแล้ว พร้อมสุ่มใหม่ด้วยรายชื่อเดิม"
          : confirm === "reset-all" ? "ล้างข้อมูลทั้งหมดแล้ว เปิดรับลงทะเบียนใหม่"
          : "จบการจับรางวัลแล้ว บันทึกผลของทุกคนเรียบร้อย",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "บันทึกไม่ได้");
    } finally {
      setBusy(false);
    }
  }
  async function spin() {
    if (!data || busy || spinning) return;
    setBusy(true);
    setError("");
    setMessage("");
    setWinner(null);
    try {
      let pending: { prizeId: PrizeId; requestKey: string } | null = null;
      try {
        pending = JSON.parse(
          sessionStorage.getItem("te_pending_draw") ?? "null",
        );
      } catch {}
      pending ??= { prizeId, requestKey: crypto.randomUUID() };
      sessionStorage.setItem("te_pending_draw", JSON.stringify(pending));
      setRecover(true);
      const result = await request("draw", pending);
      const win = result.winner as Winner;
      const list = data.participants
        .filter((p) => !p.prize_id)
        .map((p) => p.code);
      if (!list.includes(win.code)) list.push(win.code);
      setCodes(list);
      setPrizeId(pending.prizeId);
      const index = list.indexOf(win.code);
      const end = (360 - ((index + 0.5) * 360) / list.length + 360) % 360;
      const finalRotation = Math.floor(rotation / 360) * 360 + 360 * 7 + end;
      setSpinning(true);
      setBusy(false);
      requestAnimationFrame(() =>
        requestAnimationFrame(() => setRotation(finalRotation)),
      );
      timers.current.push(
        setTimeout(async () => {
          setSpinning(false);
          setWinner(win);
          sessionStorage.removeItem("te_pending_draw");
          setRecover(false);
          await refresh(true, true);
        }, 7200),
      );
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "สุ่มไม่ได้ กรุณากดลองอีกครั้งเพื่อกู้ผลรอบเดิม",
      );
      setBusy(false);
    }
  }
  async function fullscreen() {
    setStage(true);
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      setMessage("เปิดโหมดจอใหญ่แล้ว กด F11 เพื่อเต็มจอได้");
    }
  }
  const prize = PRIZES.find((p) => p.id === prizeId)!;
  const remaining =
    (data?.prizes.find((p) => p.id === prizeId)?.quantity ?? 0) -
    (data?.prizes.find((p) => p.id === prizeId)?.awarded ?? 0);
  const serverBusy =
    !!data?.state.reveal_until &&
    new Date(data.state.reveal_until).getTime() > now;
  if (loading && !data)
    return (
      <main className="login-page">
        <p>กำลังตรวจสอบบัญชีผู้จัดงาน…</p>
      </main>
    );
  if (!data)
    return (
      <main className="login-page">
        <section className="login-card">
          <a href="/" className="brand">
            <span className="brand-mark">TE</span>
            <span className="partner">sigenergy</span>
          </a>
          <span className="admin-lock">
            <ShieldCheck size={27} />
          </span>
          <h1>สำหรับผู้จัดงาน</h1>
          <p className="muted">
            บัญชีเดียวควบคุมการจับรางวัล
            <br />
            การเข้าสู่ระบบใหม่จะออกจากระบบเครื่องเดิม
          </p>
          <form onSubmit={login}>
            <label htmlFor="username">ชื่อบัญชี</label>
            <Input
              id="username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <label htmlFor="password">รหัสผ่าน</label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <Button className="primary-button" disabled={busy}>
              {busy ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบผู้จัดงาน"}
            </Button>
          </form>
          <a className="back-link" href="/">
            กลับหน้าลงทะเบียน
          </a>
        </section>
      </main>
    );
  return (
    <main className="admin-site">
      <header className="admin-header">
        <a href="/" className="brand">
          <span className="brand-mark">TE</span>
          <span className="partner">EVENT CONTROL</span>
        </a>
        <div>
          <Button
            variant="outline"
            onClick={() => refresh()}
            disabled={busy || spinning}
          >
            <RefreshCw size={17} />
            รีเฟรช
          </Button>
          <Button
            variant="ghost"
            onClick={async () => {
              try {
                await request("logout", {});
                setData(null);
                setError("");
              } catch (e) {
                setError(String(e));
              }
            }}
            disabled={busy || spinning}
          >
            <LogOut size={17} />
            ออกจากระบบ
          </Button>
        </div>
      </header>
      <section className="admin-overview">
        <div>
          <span className="eyebrow">LIVE DRAW / TE × SIGENERGY</span>
          <h1>ศูนย์ควบคุมการจับรางวัล</h1>
        </div>
        <span
          className={"event-status " + (data.state.finalized ? "finished" : "")}
        >
          {data.state.finalized
            ? "จบการจับรางวัล"
            : data.state.registrations_closed
              ? "ปิดรับลงทะเบียนแล้ว"
              : "กำลังรับลงทะเบียน"}
        </span>
      </section>
      <div className="stats">
        <div>
          <Users />
          <span>ผู้ลงทะเบียน</span>
          <strong>
            {data.participants.length}
            <small> / 150</small>
          </strong>
        </div>
        <div>
          <Ticket />
          <span>ผู้ได้รับรางวัล</span>
          <strong>
            {data.participants.filter((p) => p.prize_id).length}
            <small> / {TOTAL_WINNERS}</small>
          </strong>
        </div>
        <div>
          <MessageCircle />
          <span>สิทธิ์ที่ยังไม่ถูกรางวัล</span>
          <strong>
            {data.participants.filter((p) => !p.prize_id).length}
          </strong>
        </div>
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="message" role="status">
          {message}
        </p>
      )}
      <div
        ref={stageRef}
        className={"draw-stage " + (stage ? "presentation" : "")}
      >
        <div className="stage-top">
          <div>
            <span className="eyebrow">LUCKY DRAW</span>
            <h2>
              {prizeLabel(prize)}
            </h2>
            <p>
              {prizeValue(prize)} · เหลือ{" "}
              {remaining} รางวัล
            </p>
          </div>
          <Button
            variant="outline"
            className="fullscreen-control"
            onClick={async () => {
              if (stage) {
                setStage(false);
                if (document.fullscreenElement) await document.exitFullscreen();
              } else await fullscreen();
            }}
          >
            {stage ? <Minimize size={18} /> : <Maximize size={18} />}{" "}
            {stage ? "ออกจากจอใหญ่" : "แสดงจอใหญ่"}
          </Button>
        </div>
        <div className="stage-body">
          <div className="wheel-column">
            <Wheel codes={codes} rotation={rotation} spinning={spinning} />
            <p className="wheel-caption">
              {spinning
                ? "กำลังหมุนวงล้อ…"
                : `${codes.length} สิทธิ์ในวงล้อ · ผู้ชนะไม่ซ้ำกัน`}
            </p>
          </div>
          <div className="draw-controls">
            <label>เลือกรางวัล</label>
            <Select
              value={prizeId}
              onValueChange={(v) => {
                setPrizeId(v as PrizeId);
                setWinner(null);
              }}
              disabled={spinning || busy || recover}
            >
              <SelectTrigger aria-label="เลือกรางวัล">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {data.prizes.map((p) => (
                  <SelectItem value={p.id} key={p.id}>
                    {prizeLabel(p)} · {p.quantity - p.awarded}/
                    {p.quantity}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              className="spin-button"
              onClick={spin}
              disabled={
                busy ||
                spinning ||
                (!recover &&
                  (serverBusy ||
                    !data.state.registrations_closed ||
                    data.state.finalized ||
                    remaining <= 0 ||
                    !codes.length))
              }
            >
              <RotateCw size={25} />
              {spinning
                ? "กำลังหมุน…"
                : busy
                  ? "กำลังบันทึกผล…"
                  : recover
                    ? "กู้ผลการสุ่มรอบเดิม"
                    : "หมุนวงล้อ"}
            </Button>
            {!data.state.registrations_closed && (
              <p className="control-note">
                ปิดรับลงทะเบียนก่อนเริ่มจับรางวัล เพื่อให้ทุกคนมีสิทธิ์เท่ากัน
              </p>
            )}
            {serverBusy && !spinning && (
              <p className="control-note">รอวงล้อรอบก่อนหน้าแสดงผลให้จบ</p>
            )}
            {winner ? (
              <div className="winner-card" role="status">
                <span>CONGRATULATIONS</span>
                <strong className="winner-code">{winner.code}</strong>
                <h3>{winner.name}</h3>
                <p>{winner.company}</p>
                <small>{winner.position}</small>
                <div>
                  {prizeLabel(PRIZES.find(p => p.id === winner.prize_id)!)}
                </div>
              </div>
            ) : (
              <div className="winner-empty">
                <Ticket size={35} />
                <strong>รอผู้โชคดีคนถัดไป</strong>
                <p>
                  ผลรางวัลถูกบันทึกโดยระบบ
                  <br />
                  ก่อนวงล้อแสดงผู้ชนะ
                </p>
              </div>
            )}
          </div>
        </div>
        <div className="stage-footer">
          <span>{PRIZES.length} ประเภทรางวัล · {TOTAL_WINNERS} ผู้ชนะ</span>
          <span>TE × SIGENERGY</span>
        </div>
      </div>
      <section className="management">
        <div className="management-actions">
          {!data.state.registrations_closed && (
            <Button
              variant="outline"
              onClick={() => setConfirm("close")}
              disabled={busy || spinning}
            >
              ปิดรับลงทะเบียน
            </Button>
          )}
          {data.state.registrations_closed && !data.state.finalized && (
            <Button
              variant="outline"
              onClick={() => setConfirm("finalize")}
              disabled={busy || spinning || serverBusy}
            >
              จบการจับรางวัลและยืนยันผล
            </Button>
          )}
          <a className="secondary-link" href="/api/admin/export">
            <Download size={17} />
            ดาวน์โหลดรายชื่อและผล CSV
          </a>
          <a className="secondary-link" href="/api/event-qr" target="_blank">
            <Download size={17} />
            QR ลงทะเบียนหน้างาน
          </a>
        </div>
        <div className="line-admin">
          <MessageCircle size={22} />
          <div><strong>ส่งหลักฐานผลรางวัลทาง LINE ด้วยตนเอง</strong>
          <p>ผู้ร่วมงานตรวจผลและดาวน์โหลดรูปจากเว็บ แล้วส่งให้บริษัทในแชต</p></div>
          <a className="secondary-link" href={LINE_OA_URL} target="_blank" rel="noopener noreferrer">เปิด LINE บริษัท</a>
        </div>
        <div className="management-actions">
          <Button variant="outline" disabled={busy || spinning || serverBusy} onClick={() => {setResetText(""); setConfirm("reset-draws");}}>ล้างผลรางวัล / สุ่มใหม่</Button>
          <Button variant="destructive" disabled={busy || spinning || serverBusy} onClick={() => {setResetText(""); setConfirm("reset-all");}}>ล้างข้อมูลทั้งหมด</Button>
        </div>
        <div className="list-heading">
          <h2>รายชื่อและผลรางวัล</h2>
          <span>{data.participants.length} ผู้ร่วมงาน</span>
        </div>
        {!data.participants.length ? (
          <p className="empty-state">
            ยังไม่มีผู้ลงทะเบียน รายชื่อจะปรากฏเมื่อส่งฟอร์มสำเร็จ
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>รหัส</TableHead>
                <TableHead>ชื่อผู้ร่วมงาน</TableHead>
                <TableHead>บริษัท / ตำแหน่ง</TableHead>
                <TableHead>ผลรางวัล</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.participants.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <strong className="entry-code">{p.code}</strong>
                  </TableCell>
                  <TableCell>{p.name}</TableCell>
                  <TableCell>
                    {p.company}
                    <small className="row-meta">{p.position}</small>
                  </TableCell>
                  <TableCell>
                    {p.prize_id ? (
                      <span className="result-win">
                        {prizeLabel(PRIZES.find(x => x.id === p.prize_id)!)}
                      </span>
                    ) : data.state.finalized ? (
                      "ไม่ได้รับรางวัล"
                    ) : (
                      "รอจับรางวัล"
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>
      <Dialog
        open={!!confirm}
        onOpenChange={(open) => {
          if (!open && !busy) setConfirm(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirm === "close"
                ? "ปิดรับลงทะเบียน?"
                : confirm === "reset-draws" ? "ล้างผลรางวัลเพื่อสุ่มใหม่?"
                : confirm === "reset-all" ? "ล้างผู้ลงทะเบียนและผลรางวัลทั้งหมด?"
                : "ยืนยันจบการจับรางวัล?"}
            </DialogTitle>
            <DialogDescription>
              {confirm === "close"
                ? "ผู้ร่วมงานใหม่จะลงทะเบียนไม่ได้ และระบบจะใช้รายชื่อที่บันทึกแล้วสำหรับจับรางวัล"
                : confirm === "reset-draws" ? "ลบผลรางวัลเดิมทั้งหมด เก็บผู้ลงทะเบียนและรหัส voucher ไว้ แล้วเริ่มสุ่มได้ใหม่ ผลเดิมและภาพผลที่ส่งไปแล้วจะใช้ยืนยันไม่ได้ ควรดาวน์โหลด CSV ก่อนล้างผล"
                : confirm === "reset-all" ? "ลบผู้ลงทะเบียนและผลรางวัลทั้งหมด เปิดรับลงทะเบียนใหม่ และเริ่มรหัส TE-001 อีกครั้ง ลิงก์ voucher เดิมจะใช้ไม่ได้ การลบนี้ย้อนกลับไม่ได้ ควรดาวน์โหลด CSV ก่อน"
                : "หลังยืนยันจะสุ่มเพิ่มไม่ได้ ผู้ที่ยังไม่ได้รับรางวัลจะมีผลเป็น “ไม่ได้รับรางวัล” แม้รางวัลบางประเภทจะยังแจกไม่ครบ"}
            </DialogDescription>
          </DialogHeader>
          {confirm?.startsWith("reset") && <div><label htmlFor="reset-confirm">พิมพ์ {confirm === "reset-all" ? "DELETE ALL" : "RESET DRAW"} เพื่อยืนยัน</label><Input id="reset-confirm" value={resetText} onChange={e => setResetText(e.target.value)} autoComplete="off" /></div>}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirm(null)}
              disabled={busy}
            >
              กลับ
            </Button>
            <Button onClick={eventAction} disabled={busy || (!!confirm?.startsWith("reset") && resetText !== (confirm === "reset-all" ? "DELETE ALL" : "RESET DRAW"))}>
              {busy ? "กำลังบันทึก…" : "ยืนยัน"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
