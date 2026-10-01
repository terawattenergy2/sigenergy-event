import sharp, { type OverlayOptions } from "sharp";
import QRCode from "qrcode";
import { join } from "node:path";
import { readFile } from "node:fs/promises";
import { prizeFor, resultStatus, type Entry } from "./prizes";
import { issueEntryToken } from "./security";
process.env.FONTCONFIG_FILE ??= join(process.cwd(), "public/fonts/fonts.conf");
const W = 1536,
  H = 1024;
function short(text: string, max = 36) {
  const chars = Array.from(text);
  return chars.length > max ? chars.slice(0, max).join("") + "…" : text;
}
function escape(text: string) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
async function label(text: string, size: number, color: string, width: number) {
  return sharp({
    text: {
      text: `<span foreground="${color}">${escape(text)}</span>`,
      font: `Noto Sans Thai ${size}`,
      fontfile: join(process.cwd(), "public/fonts/NotoSansThai.ttf"),
      width,
      rgba: true,
      wrap: "word-char",
      spacing: 4,
    },
  })
    .png()
    .toBuffer();
}
export async function renderVoucher(
  entry: Entry,
  kind: "entry" | "result" = "entry",
) {
  const prize = kind === "result" ? prizeFor(entry.prize_id) : undefined;
  const status = kind === "entry" ? "pending" : resultStatus(entry);
  const title = prize
    ? "ยินดีด้วย คุณได้รับรางวัล"
    : status === "not_selected"
      ? "ขอบคุณที่ร่วมกิจกรรม"
      : "สิทธิ์ร่วมลุ้นรางวัล";
  const qr = await QRCode.toBuffer("TEV1:" + issueEntryToken(entry.id), {
    width: 300,
    margin: 3,
    errorCorrectionLevel: "M",
    color: { dark: "#0a2850", light: "#ffffff" },
  });
  const bg = await readFile(
    join(process.cwd(), "public/assets/voucher-background.jpg"),
  );
  const overlays: OverlayOptions[] = [
    {
      input: Buffer.from(
        `<svg width="${W}" height="${H}"><defs><linearGradient id="g"><stop stop-color="#051735" stop-opacity=".45"/><stop offset=".8" stop-color="#051735" stop-opacity=".05"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#g)"/></svg>`,
      ),
      left: 0,
      top: 0,
    },
  ];
  async function add(
    text: string,
    size: number,
    color: string,
    left: number,
    top: number,
    width: number,
  ) {
    const input = await label(text, size, color, width);
    overlays.push({ input, left, top });
  }
  await add("TE / SIGENERGY EVENT", 27, "#83cfff", 65, 57, 800);
  await add(title, 48, "#ffffff", 65, 122, 830);
  await add(entry.code, 100, "#68c7ff", 62, 208, 800);
  await add(short(entry.name, 32), 32, "#ffffff", 65, 359, 780);
  await add(short(entry.company, 44), 25, "#c8e3ff", 65, 418, 780);
  await add(short(entry.position, 44), 23, "#c8e3ff", 65, 465, 780);
  if (prize) {
    await add(
      `${prize.label}  ส่วนลด ${prize.discount}%`,
      37,
      "#ffffff",
      65,
      532,
      850,
    );
    await add(
      `สูงสุดไม่เกิน ${prize.cap.toLocaleString("en-US")} บาท`,
      26,
      "#8ddcff",
      65,
      593,
      800,
    );
  } else {
    await add(
      status === "not_selected"
        ? "รอบนี้คุณไม่ได้รับรางวัล"
        : "ลงทะเบียนแล้ว · รอการจับรางวัลจากผู้จัดงาน",
      26,
      "#8ddcff",
      65,
      539,
      830,
    );
  }
  overlays.push({ input: qr, left: 65, top: 666 });
  await add("เก็บภาพนี้ไว้เป็นหลักฐาน", 25, "#ffffff", 402, 691, 490);
  await add(
    prize
      ? "ติดต่อผู้จัดงานเพื่อยืนยันการใช้ส่วนลด"
      : status === "not_selected"
        ? "ติดตามกิจกรรมครั้งต่อไปผ่าน LINE OA"
        : "เก็บลิงก์เว็บไว้ตรวจผล แล้วส่งรูปผลทาง LINE",
    23,
    "#c8e3ff",
    402,
    745,
    490,
  );
  await add(
    "QR สำหรับตรวจสิทธิ์ ส่งหลักฐานให้บริษัทเท่านั้น",
    19,
    "#8aafd2",
    402,
    838,
    460,
  );
  await add(
    "ส่วนลดใช้ตามเงื่อนไขที่ผู้จัดงานกำหนด",
    18,
    "#a2bfd9",
    402,
    915,
    480,
  );
  return sharp(bg)
    .resize(W, H, { fit: "cover" })
    .composite(overlays)
    .png({ compressionLevel: 8 })
    .toBuffer();
}
