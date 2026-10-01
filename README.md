# TE × Sigenergy — Event Voucher & Lucky Draw

เว็บ Next.js + Yarn สำหรับให้ผู้ร่วมงานสแกน QR ลงทะเบียน รับรูป voucher และตรวจผลผ่าน LINE OA พร้อมวงล้อบนจอใหญ่ที่ควบคุมด้วยบัญชีผู้จัดงานเพียงบัญชีเดียว

## สิ่งที่ทำได้

- กรอกชื่อ บริษัท ตำแหน่ง และยินยอมให้ใช้ข้อมูลกิจกรรม บันทึกในฐานข้อมูลฝั่งเซิร์ฟเวอร์
- ออกเลข **TE-001–TE-150** ตามลำดับ ไม่ซ้ำ รับสูงสุด 150 คน
- ดาวน์โหลด voucher PNG โทนฟ้า ภาพคอนเซ็ปต์ inverter / storage และ QR ยืนยันสิทธิ์ส่วนบุคคล
- เพิ่มเพื่อน LINE OA ส่งภาพ voucher เข้าแชต ระบบอ่าน QR แล้วผูกสิทธิ์กับ LINE ของผู้ใช้
- LINE ตอบกลับด้วยรูป: รอประกาศผล / ได้รับส่วนลด / ไม่ได้รับรางวัล
- มีบัญชีผู้จัดงานหนึ่งบัญชี การ login ใหม่ยกเลิก session เดิม รวมทั้งป้องกันการหมุนพร้อมกันจากหลายแท็บ
- ปิดรับลงทะเบียนก่อนสุ่ม ใช้การสุ่มฝั่งเซิร์ฟเวอร์ด้วย `crypto.randomInt` บันทึกผลใน transaction ก่อนวงล้อแสดงผล
- คนเดิมชนะได้ครั้งเดียว ป้องกันเกินโควตาและป้องกันการ retry แล้วสุ่มผู้ชนะใหม่
- เก็บรายชื่อ ผล วันเวลาจับรางวัล และคิวแจ้งผล LINE ใน PostgreSQL
- โหมดเต็มจอสำหรับโปรเจกเตอร์ และดาวน์โหลดรายชื่อ/ผล CSV

| รางวัล | ส่วนลด | ส่วนลดสูงสุด | ผู้ชนะ |
|---|---:|---:|---:|
| SigenStor | 5% | 20,000 บาท | 1 |
| SigenStor NEO | 3% | 10,000 บาท | 2 |
| Sigenergy + JA Solar | 2% | 5,000 บาท | 10 |

รวม 3 ประเภท / 13 ผู้ชนะ ผู้ลงทะเบียนทุกคนมีสิทธิ์ถูกสุ่ม การผูก LINE ช่วยให้ระบบส่งผลในแชตได้ ไม่ใช่เงื่อนไขตัดสิทธิ์จับรางวัล

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
| `NEXT_PUBLIC_LINE_OA_URL` | ลิงก์เพิ่มเพื่อนจริง เช่น `https://lin.ee/your-code` หรือ `https://line.me/R/ti/p/@your-account` |
| `LINE_CHANNEL_SECRET` | secret ของ Messaging API channel |
| `LINE_CHANNEL_ACCESS_TOKEN` | access token ของ Messaging API channel เดียวกัน |
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

ถ้า Vercel เปิด Deployment Protection สำหรับ production ต้องปรับให้ผู้ร่วมงานและ LINE server เข้าหน้าลงทะเบียนและ `/api/voucher/.../image` กับ `/api/line/webhook` ได้ การป้องกัน admin ยังคงเป็น login ของแอปและ cookie ฝั่งเซิร์ฟเวอร์

## เชื่อม LINE OA

1. เปิดใช้ Messaging API ให้ LINE OA บริษัท แล้วใช้ **channel ของ OA นี้** ใน LINE Developers Console
2. ตั้ง `LINE_CHANNEL_SECRET`, `LINE_CHANNEL_ACCESS_TOKEN`, `NEXT_PUBLIC_LINE_OA_URL` ใน Vercel แล้ว redeploy
3. ใน Messaging API ตั้ง Webhook URL เป็น:

```text
https://YOUR-DOMAIN/api/line/webhook
```

4. กด Verify และเปิด Use webhook / Webhook redelivery
5. ปิดข้อความ auto-response เดิมที่ซ้ำกับ bot เพื่อไม่ให้ผู้ใช้ได้รับคำตอบซ้อน
6. ตรวจสอบว่า OA ส่งข้อความได้และมีโควตาสำหรับ push messages ก่อนวันงาน ค่าใช้จ่าย/โควตาขึ้นกับแพ็กเกจ LINE OA ของคุณ

### วิธีที่ผู้ร่วมงานใช้

- สแกน QR หน้างาน → กรอกฟอร์ม → รับรูป voucher → บันทึกรูป
- กดแอด LINE OA แล้วส่ง **รูป voucher ต้นฉบับจากเว็บ** ในแชตส่วนตัวกับ OA
- ระบบดาวน์โหลดภาพจาก LINE แล้วอ่าน QR (ไม่ใช้ OCR เดาชื่อ)
- QR เป็น bearer proof ของ voucher จึงควรเก็บส่วนตัว ห้ามโพสต์รูปหรือข้อความยืนยันสิทธิ์ลงกลุ่ม/สาธารณะ
- ถ้าภาพถูกครอปหรือ QR อ่านไม่ได้ กด “คัดลอกข้อความยืนยันสิทธิ์” บนเว็บแล้ววางส่งใน LINE ได้
- ระบบผูก 1 voucher กับ 1 LINE account และไม่ให้เปลี่ยนไปผูกกับบัญชีอื่นเอง
- ก่อนจับรางวัล: ตอบรูปสิทธิ์รอประกาศผล หลังได้รางวัล: ตอบรูปส่วนลดตามประเภทที่ได้รับ
- ถ้าผูก LINE ก่อนจับรางวัล ระบบเข้าคิว push รูปผู้ชนะหลังวงล้อจบ และผู้จัดงานกด **ส่งผลที่ค้าง / ลองใหม่** เพื่อส่งรายการที่เหลือได้
- ผู้ที่ยังไม่ถูกสุ่มต้องรอจนผู้จัดงานกด **จบการจับรางวัลและยืนยันผล** จึงเห็น “ไม่ได้รับรางวัล”
- พิมพ์ **ผลรางวัล** ในแชตเพื่อตรวจผลซ้ำได้

การตอบรูปผ่าน LINE ต้องให้ LINE เข้าถึง URL HTTPS ของรูปได้ ภาพมี URL token เฉพาะคนและไม่ได้มีหน้ารวมรูปแบบสาธารณะ

## วิธีใช้หน้า admin ในวันงาน

1. เข้าสู่ระบบที่ `/admin` ใช้บัญชีเดียวที่ตั้งค่าไว้
2. ตรวจรายชื่อและจำนวนผู้ผูก LINE ดาวน์โหลด QR ลงทะเบียน / CSV ได้
3. กด **ปิดรับลงทะเบียน** เมื่อพร้อม ปิดแล้วเปิดกลับไม่ได้ผ่าน UI เพื่อรักษารายชื่อก่อนจับรางวัล
4. เลือกรางวัล เปิด **แสดงจอใหญ่** ต่อโปรเจกเตอร์ แล้วกดหมุนวงล้อทีละคน
5. ระบบเก็บผู้ชนะก่อนแอนิเมชัน ป้องกันการสุ่มพร้อมกันและกันกดซ้ำระหว่างรอบ
6. หากเครือข่ายขาด กด **กู้ผลการสุ่มรอบเดิม** ระบบคืนผลที่ commit แล้ว ไม่เลือกคนใหม่
7. แจกให้ครบ 1 / 2 / 10 คน รวม 13 คน แล้วกด **จบการจับรางวัลและยืนยันผล**
8. กด **ส่งผลที่ค้าง / ลองใหม่** จนคิวหมด หากส่งไม่ผ่านให้ตรวจ token / quota ใน LINE OA ผลรางวัลยังอยู่ในฐานข้อมูล

ปุ่มจบการจับรางวัลต้องยืนยัน หากยืนยันก่อนแจกครบ จะปิดรางวัลที่ยังเหลือและผู้ที่ยังไม่ได้รางวัลเป็น “ไม่ได้รับรางวัล” โดยไม่มีการจับต่อ ตรวจยอดก่อนยืนยัน

## ความเป็นส่วนตัวและขอบเขต

- ฟอร์มมี consent เฉพาะกิจกรรม ให้บริษัทกำหนดอายุการเก็บข้อมูลและเงื่อนไขส่วนลด/การใช้ voucher จริงก่อนวันงาน ขณะนี้ไม่มีวันหมดอายุที่สมมติขึ้น
- ข้อมูล 3 ช่องใช้ลดการลงทะเบียนซ้ำ ไม่ใช่การพิสูจน์ตัวตนจริง ผู้เปลี่ยนชื่อ/บริษัท/ตำแหน่งยังอาจลงทะเบียนใหม่ได้ หากต้องการยืนยันบุคคลจริงต้องเพิ่ม OTP/LINE Login ในขั้นถัดไป
- `TE-001` เป็นเลขแสดงผล ไม่มีสิทธิ์เข้าถึงข้อมูลด้วยเลขนี้เพียงอย่างเดียว QR ใช้ลายเซ็น HMAC และ UUID
- การเข้า admin ใหม่จะยกเลิก session เก่า รหัสผ่านเดียวควรอยู่กับผู้จัดงานคนเดียว ไม่มีระบบเชิญ admin เพิ่ม
- โค้ดใช้ rate limit ฝั่ง PostgreSQL และตรวจ Origin สำหรับการแก้ข้อมูล ตรวจ HMAC จาก raw body สำหรับ LINE webhook
- งานนี้ไม่มีการย้ายข้อมูลจาก Sites/D1 เวอร์ชันเก่าอัตโนมัติ เพราะยังไม่มีฐานข้อมูลออนไลน์เวอร์ชันเก่าที่เผยแพร่สำเร็จ
- รูป inverter เป็นภาพคอนเซ็ปต์ที่สร้างขึ้น ไม่ใช่ภาพรับรองรุ่นสินค้าจาก Sigenergy สามารถแทน `public/assets/voucher-background.jpg` ด้วยภาพสินค้าที่คุณมีสิทธิ์ใช้งาน

## ทดสอบ

```sh
yarn typecheck
yarn test
yarn build
```

การทดสอบ domain ใช้ PostgreSQL embedded (PGlite) กับ schema เดียวกับ production ตรวจรหัสครบ 150, retry, privacy ของรหัส, operator session, quota 13, ผู้ชนะไม่ซ้ำ, หมุนพร้อมกัน, LINE signature/ownership และอ่าน QR กลับจากรูปที่สร้างจริง

ก่อนหน้างาน ต้อง smoke-test กับ PostgreSQL production และ LINE OA ของบริษัทเอง เพราะชุดไฟล์นี้ไม่ได้มาพร้อมบัญชี Vercel / ฐานข้อมูล / LINE channel ของคุณ

## แหล่งอ้างอิง

- [Vercel: Deployments](https://vercel.com/docs/deployments/overview)
- [Vercel: Postgres](https://vercel.com/docs/postgres)
- [LINE: Receiving messages](https://developers.line.biz/en/docs/messaging-api/receiving-messages/)
- [LINE: Verify webhook signature](https://developers.line.biz/en/docs/messaging-api/verify-webhook-signature/)
- [LINE: Retry requests](https://developers.line.biz/en/docs/messaging-api/retrying-api-request/)

## Assets

พื้นหลังสร้างด้วย built-in ImageGen ตาม brief: ภาพแนวนอนโทน midnight blue / cyan ระบบ inverter และ energy storage สีขาวอยู่ทางขวา เว้นพื้นที่ทางซ้ายสำหรับข้อความ voucher ไม่มีโลโก้หรือข้อความในภาพต้นฉบับ บันทึกเป็น `public/assets/voucher-background.jpg`
Noto Sans Thai ใช้ตาม SIL Open Font License — ดู `public/fonts/OFL.txt`
# TE-Reward
# TE-Reward
