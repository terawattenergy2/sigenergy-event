# TE × Sigenergy — Event Voucher & Lucky Draw

เว็บ Next.js + Yarn สำหรับให้ผู้ร่วมงานสแกน QR ลงทะเบียน รับรูป voucher และตรวจผลบนเว็บ พร้อมวงล้อบนจอใหญ่ที่ควบคุมด้วยบัญชีผู้จัดงานเพียงบัญชีเดียว

## สิ่งที่ทำได้

- กรอกชื่อ บริษัท ตำแหน่ง และยินยอมให้ใช้ข้อมูลกิจกรรม บันทึกในฐานข้อมูลฝั่งเซิร์ฟเวอร์
- ออกเลข **TE-001–TE-150** ตามลำดับ ไม่ซ้ำ รับสูงสุด 150 คน
- ดาวน์โหลด voucher PNG โทนฟ้า ภาพคอนเซ็ปต์ inverter / storage และ QR ยืนยันสิทธิ์ส่วนบุคคล
- เพิ่มเพื่อน LINE บริษัทผ่าน https://lin.ee/X112gOl
- ผู้ร่วมงานตรวจผลบนเว็บ ดาวน์โหลดรูปผลรางวัล แล้วส่งรูปให้บริษัททาง LINE ด้วยตนเอง
- มีบัญชีผู้จัดงานหนึ่งบัญชี การ login ใหม่ยกเลิก session เดิม รวมทั้งป้องกันการหมุนพร้อมกันจากหลายแท็บ
- ปิดรับลงทะเบียนก่อนสุ่ม ใช้การสุ่มฝั่งเซิร์ฟเวอร์ด้วย `crypto.randomInt` บันทึกผลใน transaction ก่อนวงล้อแสดงผล
- คนเดิมชนะได้ครั้งเดียว ป้องกันเกินโควตาและป้องกันการ retry แล้วสุ่มผู้ชนะใหม่
- เก็บรายชื่อ ผล วันเวลาจับรางวัล  ใน PostgreSQL
- โหมดเต็มจอสำหรับโปรเจกเตอร์ และดาวน์โหลดรายชื่อ/ผล CSV

| รางวัล | ส่วนลด | ส่วนลดสูงสุด | ผู้ชนะ |
|---|---:|---:|---:|
| SigenStor | 5% | 20,000 บาท | 1 |
| SigenStor NEO | 3% | 10,000 บาท | 2 |
| Sigenergy + JA Solar | 3% | 5,000 บาท | 10 |

รวม 6 ประเภท / 30 ผู้ชนะ ผู้ลงทะเบียนทุกคนมีสิทธิ์ถูกสุ่ม การเพิ่มเพื่อน LINE เป็นช่องทางติดต่อบริษัท เว็บไม่ตรวจหรือผูกบัญชี LINE

## ทดลองบนเครื่องได้ทันที

ต้องมี Node.js 22 และ Yarn 1.22.22

```sh
yarn install --frozen-lockfile
yarn demo:setup
yarn dev
```

เปิด `http://127.0.0.1:3000` และ `http://127.0.0.1:3000/admin`
บัญชีทดลองบนเครื่อง: `admin` / `TE-Local-Demo-2026!`

`demo:setup` สร้าง PostgreSQL แบบ embedded ด้วย PGlite และไฟล์ `.env.local` สำหรับเครื่องนี้ บันทึกจริงลง `work/local-db` และอยู่ต่อเมื่อปิดเปิดเซิร์ฟเวอร์ ห้ามใช้บัญชีทดลองหรือฐานข้อมูลแบบนี้บน Vercel ระบบปฏิเสธฐานข้อมูล local ใน production

ถ้ามี `.env.local` อยู่แล้ว `demo:setup` จะแจ้งว่าตั้งค่าไว้แล้วและจบสำเร็จโดยไม่เขียนทับค่าเดิม ถ้า `yarn dev` แจ้ง Another next dev server is already running ให้เปิด URL ของเซิร์ฟเวอร์เดิมที่แสดง เช่น `http://127.0.0.1:3000` ไม่ต้องเปิดเซิร์ฟเวอร์เพิ่ม หากต้องการย้ายมาเปิดใน terminal ของคุณ ให้หยุดเซิร์ฟเวอร์เดิมด้วย Ctrl+C ใน terminal ที่เปิดมันไว้ หรือใช้ `kill PID` ตาม PID ที่ข้อความแจ้ง แล้วค่อยรัน `yarn dev` ใหม่ อย่าเปิดเซิร์ฟเวอร์หลายตัวกับ `work/local-db` เดียวกัน ถ้าต้องการล้างการทดลอง ปิดเซิร์ฟเวอร์แล้วลบ `work/local-db` และ `.env.local` ก่อนรัน `demo:setup` ใหม่ การลบนี้ล้างข้อมูลทดลองทั้งหมด

## ตั้งค่าฐานข้อมูลใช้งานจริง

สร้าง PostgreSQL เช่น Neon ผ่าน Vercel Marketplace หรือ PostgreSQL จากผู้ให้บริการของคุณ และใช้ URL แบบ pooled ที่ผู้ให้บริการให้มา (พร้อม TLS ตามข้อกำหนดของผู้ให้บริการ)

1. คัดลอก `.env.example` เป็น `.env.local` แล้วเอา `LOCAL_DATABASE_PATH` ของการทดลองออก
2. ใส่ `DATABASE_URL` ของฐานข้อมูลจริง และรัน:

```sh
yarn db:migrate
```

สคริปต์ใช้ transaction และจำ migration ที่ทำแล้ว ไม่มีฐานข้อมูลใน browser และไม่ใช้ไฟล์ SQLite บน Vercel
ใช้ฐานข้อมูลคนละชุดสำหรับ development, preview และ production เพื่อไม่ให้การทดสอบเปลี่ยนผลรางวัลของงานจริง

## ตั้งค่าบัญชีผู้จัดงานและ secret

```sh
yarn admin:password
```

เลือก password ใหม่อย่างน้อย 16 ตัวอักษร แล้วนำค่า hash ที่แสดงไปใส่ `ADMIN_PASSWORD_HASH` ใน Vercel และ `.env.local` ของคุณ ไม่ต้องใส่ password ลงโค้ด สคริปต์แสดง input เฉพาะ terminal เครื่องของคุณ จึงควรใช้งานในที่ส่วนตัว

สร้าง `APP_SECRET` ด้วย:

```sh
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
```

เก็บ secret นี้ไว้คงเดิมตลอดกิจกรรม การเปลี่ยน `APP_SECRET` จะทำให้ QR และลิงก์ voucher ที่ออกไปแล้วใช้ไม่ได้

## Environment Variables สำหรับ Vercel

| ตัวแปร | ค่า |
|---|---|
| `DATABASE_URL` | PostgreSQL pooled connection string ของ production |
| `APP_SECRET` | random secret อย่างน้อย 32 ตัวอักษร |
| `ADMIN_USERNAME` | ชื่อบัญชีผู้จัดงานหนึ่งบัญชี เช่น `admin` |
| `ADMIN_PASSWORD_HASH` | hash จาก `yarn admin:password` |
| `APP_URL` | URL production ที่แน่นอน เช่น `https://your-event.vercel.app` ไม่ใส่ slash ปิดท้าย |
| `NEXT_PUBLIC_COMPANY_NAME` | ชื่อบริษัทผู้ดูแลข้อมูล เช่น `TE` |
| `NEXT_PUBLIC_CONTACT_TEXT` | ช่องทางติดต่อผู้จัดงานสำหรับแก้ไข/สอบถามข้อมูล |

ไม่ต้องใส่ `LOCAL_DATABASE_PATH` บน Vercel อย่าใส่ token/secret ในตัวแปรที่ขึ้นต้น `NEXT_PUBLIC_`
ค่า `NEXT_PUBLIC_*` ถูกฝังตอน build ต้อง redeploy หลังแก้ค่า

## ขึ้น GitHub และ Vercel

เปิด terminal ในโฟลเดอร์โปรเจกต์นี้ (โฟลเดอร์ที่มี `package.json`):

```sh
git init
git add .
git commit -m "Build Sigenergy event voucher and lucky draw"
git branch -M main
git remote add origin https://github.com/YOUR-ACCOUNT/YOUR-REPOSITORY.git
git push -u origin main
```

สร้าง repository ของคุณก่อน และเปลี่ยน remote ให้ตรงบัญชีของคุณ `.gitignore` กัน `.env.local`, `node_modules` และข้อมูลทดลอง ไม่ commit สิ่งเหล่านั้น

ใน Vercel เลือก Add New Project → Import Git Repository:

- Framework: **Next.js**
- Root Directory: โฟลเดอร์ที่มี `package.json` (ถ้าอัปโหลดไฟล์ใน ZIP เป็นราก repo เลือก `.`)
- Install Command: `yarn install --frozen-lockfile`
- Build Command: `yarn build`
- Node.js: 22.x หรือรุ่นที่ตรง `engines`
- ตั้ง Environment Variables ตารางด้านบน แล้ว Deploy

ถ้ายังไม่ทราบ URL ครั้งแรก ให้ deploy เพื่อรับโดเมนก่อน จากนั้นตั้ง `APP_URL` เป็นโดเมนที่ได้และ Redeploy ก่อนเปิดลงทะเบียน ต้องเปิด origin นี้ตรงกับค่าที่ตั้ง รวมทั้ง www / custom domain

ตั้ง domain ของงานให้คงเดิมก่อนพิมพ์ QR หลังตั้งค่าเสร็จเปิด `/api/event-qr` เพื่อดาวน์โหลด PNG หรือใช้ปุ่มในหน้า admin **QR ลงทะเบียนหน้างาน** โค้ดนี้พาผู้ร่วมงานเข้าเว็บจริงตาม `APP_URL`

ถ้า Vercel เปิด Deployment Protection สำหรับ production ต้องปรับให้ผู้ร่วมงาน เข้าหน้าลงทะเบียนและ `/api/voucher/.../image` ได้ การป้องกัน admin ยังคงเป็น login ของแอปและ cookie ฝั่งเซิร์ฟเวอร์

## LINE และการเริ่มจับรางวัลใหม่

ลิงก์บริษัทกำหนดที่ `lib/contact.ts`: https://lin.ee/X112gOl ไม่ต้องใช้ LINE channel secret, access token หรือ webhook ตัวแปร LINE เดิมบน Vercel ไม่ถูกใช้งาน และ endpoint อัตโนมัติเดิมตอบ 410

ผู้ร่วมงานลงทะเบียนและเก็บลิงก์ voucher → เพิ่มเพื่อน LINE → หลังจับรางวัลกดตรวจผลบนเว็บ → ดาวน์โหลดรูปผลรางวัลแล้วส่งให้บริษัทในแชตด้วยตนเอง บริษัทตอบกลับหรือยืนยันสิทธิ์เอง ไม่มีระบบตอบกลับอัตโนมัติ

ผู้จัดงานเข้าสู่ `/admin` → ปิดรับลงทะเบียน → เลือกประเภทและหมุนวงล้อ → จบการจับรางวัลเพื่อยืนยันผลผู้ที่ไม่ได้รับรางวัล ดาวน์โหลด CSV เพื่อเก็บรายชื่อและผลได้

- **ล้างผลรางวัล / สุ่มใหม่**: พิมพ์ `RESET DRAW` ลบผลเดิมทั้งหมด แต่เก็บรายชื่อและ voucher เดิมไว้ เปิดให้สุ่มใหม่ สถานะปิดรับลงทะเบียนคงเดิม ภาพผลรางวัลเดิมที่ส่งออกไปแล้วใช้ยืนยันไม่ได้
- **ล้างข้อมูลทั้งหมด**: พิมพ์ `DELETE ALL` ลบรายชื่อและผลรางวัล เปิดรับลงทะเบียนใหม่ เริ่ม TE-001 อีกครั้ง ลิงก์ voucher เดิมใช้ไม่ได้ การลบย้อนกลับไม่ได้ ควรส่งออก CSV ก่อน

ทั้งสองคำสั่งต้องใช้เซสชันผู้จัดงานที่ยังใช้งานได้ และไม่ทำงานขณะวงล้อกำลังแสดงผล การลบใช้ transaction และ lock เดียวกับการลงทะเบียน/สุ่มเพื่อไม่ให้ข้อมูลค้างครึ่งทาง


## ความเป็นส่วนตัวและขอบเขต

- ฟอร์มมี consent เฉพาะกิจกรรม ให้บริษัทกำหนดอายุการเก็บข้อมูลและเงื่อนไขส่วนลด/การใช้ voucher จริงก่อนวันงาน ขณะนี้ไม่มีวันหมดอายุที่สมมติขึ้น
- ข้อมูล 3 ช่องใช้ลดการลงทะเบียนซ้ำ ไม่ใช่การพิสูจน์ตัวตนจริง ผู้เปลี่ยนชื่อ/บริษัท/ตำแหน่งยังอาจลงทะเบียนใหม่ได้ หากต้องการยืนยันบุคคลจริงต้องเพิ่ม OTP/LINE Login ในขั้นถัดไป
- `TE-001` เป็นเลขแสดงผล ไม่มีสิทธิ์เข้าถึงข้อมูลด้วยเลขนี้เพียงอย่างเดียว QR ใช้ลายเซ็น HMAC และ UUID
- การเข้า admin ใหม่จะยกเลิก session เก่า รหัสผ่านเดียวควรอยู่กับผู้จัดงานคนเดียว ไม่มีระบบเชิญ admin เพิ่ม
- โค้ดใช้ rate limit ฝั่ง PostgreSQL และตรวจ Origin สำหรับการแก้ข้อมูล
- งานนี้ไม่มีการย้ายข้อมูลจาก Sites/D1 เวอร์ชันเก่าอัตโนมัติ เพราะยังไม่มีฐานข้อมูลออนไลน์เวอร์ชันเก่าที่เผยแพร่สำเร็จ
- รูป inverter เป็นภาพคอนเซ็ปต์ที่สร้างขึ้น ไม่ใช่ภาพรับรองรุ่นสินค้าจาก Sigenergy สามารถแทน `public/assets/voucher-background.jpg` ด้วยภาพสินค้าที่คุณมีสิทธิ์ใช้งาน

## ทดสอบ

```sh
yarn typecheck
yarn test
yarn build
```

การทดสอบ domain ใช้ PostgreSQL embedded (PGlite) กับ schema เดียวกับ production ตรวจรหัสครบ 150, retry, privacy ของรหัส, operator session, quota 30, ผู้ชนะไม่ซ้ำ, หมุนพร้อมกัน, การล้างผล/ล้างข้อมูลทั้งหมด และอ่าน QR กลับจากรูปที่สร้างจริง

ก่อนหน้างาน ต้อง smoke-test กับ PostgreSQL production และลิงก์เพิ่มเพื่อนของบริษัทเอง เพราะชุดไฟล์นี้ไม่ได้มาพร้อมบัญชี Vercel / ฐานข้อมูล ของคุณ

## แหล่งอ้างอิง

- [Vercel: Deployments](https://vercel.com/docs/deployments/overview)
- [Vercel: Postgres](https://vercel.com/docs/postgres)

## Assets

พื้นหลังสร้างด้วย built-in ImageGen ตาม brief: ภาพแนวนอนโทน midnight blue / cyan ระบบ inverter และ energy storage สีขาวอยู่ทางขวา เว้นพื้นที่ทางซ้ายสำหรับข้อความ voucher ไม่มีโลโก้หรือข้อความในภาพต้นฉบับ บันทึกเป็น `public/assets/voucher-background.jpg`
Noto Sans Thai ใช้ตาม SIL Open Font License — ดู `public/fonts/OFL.txt`
# TE-Reward
# TE-Reward
# TE-Reward

QR บนภาพ voucher ใช้รูป LINE OA ที่บริษัทให้มา (`public/assets/line-oa-qr.png`) สำหรับเพิ่มเพื่อน ไม่ใช่ลิงก์ voucher เฉพาะคน ผู้ร่วมงานต้องเก็บลิงก์หน้า voucher ไว้ตรวจผล

รางวัลเพิ่ม: หมวก TE 10 รางวัล มูลค่า 3,000 บาท; เสื้อ TE 5 รางวัล มูลค่า 2,500 บาท; Sigen Micro 2 รางวัล มูลค่ากว่า 12,400 บาท แสดงมูลค่าตามที่ผู้จัดงานระบุ ไม่คำนวณเป็นราคาต่อชิ้น ต้องรัน `yarn db:migrate` เพื่อเพิ่มประเภทใหม่ในฐานข้อมูลเดิมก่อน deploy

## เว็บ dev ทดลองหมุนรางวัลแยก

รัน `yarn dev:draw` แล้วเปิด http://127.0.0.1:3002/admin บัญชีทดสอบ `admin` รหัส `TE-Draw-Demo-2026!` ใช้ฐานข้อมูลเฉพาะใน `work/draw-demo/database` และสร้างผู้ร่วมงานจำลอง 40 คนเมื่อฐานข้อมูลว่าง ปิดรับลงทะเบียนให้พร้อมหมุนตั้งแต่แรก รองรับรางวัลทั้ง 6 ประเภท ใช้ปุ่มล้างผลเพื่อสุ่มใหม่ได้ ไม่เชื่อมฐานข้อมูลจริงแม้ `.env.local` มี DATABASE_URL ค่า build แยกใน `.next-draw-demo` อย่านำบัญชีนี้ไปตั้งบน production เว็บนี้เปิดได้เฉพาะเครื่องนี้

## ดาวน์โหลด voucher ผู้ชนะจาก admin

ในตารางรายชื่อและผลรางวัล ผู้ที่มีรางวัลจะมีปุ่ม **ดาวน์โหลด voucher** บันทึกเป็น PNG พร้อมชื่อ บริษัท และรหัส TE-XXX จากฐานข้อมูล ผู้ที่ยังไม่ถูกรางวัลจะไม่มีปุ่ม API นี้ต้องเข้าสู่ระบบผู้จัดงาน ส่วนผู้ร่วมงานดาวน์โหลดรูปผลของตนได้จากลิงก์ voucher เดิม

แบบส่วนลดใช้ภาพใน `public/assets/prize-templates` และใส่ชื่อกับบริษัทที่ด้านขวาบนภายในภาพ voucher ภาพ bundle ใช้ส่วนลด 3% ตามต้นฉบับ โดยไม่มีกรอบทับตัวเลข หมวก เสื้อ และ Sigen Micro ใช้แบบรูปผลรางวัลเดิม ไม่เปลี่ยนผลรางวัลหรือข้อมูลผู้ร่วมงานที่บันทึกแล้ว
