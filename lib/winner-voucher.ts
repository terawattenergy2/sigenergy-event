import sharp,{type OverlayOptions} from 'sharp';
import {join} from 'node:path';
import {createRequire} from 'node:module';
const fontkit=createRequire(import.meta.url)('fontkit');
import {prizeFor,type Entry} from './prizes';
const templateIds=new Set(['sigenstor','neo','bundle']);
// Draw shaped glyph outlines directly so PNG exports never fall back to a system font.
async function text(value:string,size:number,width:number,bold=false){
 const font=fontkit.openSync(join(process.cwd(),bold?'public/fonts/Kanit-Bold.ttf':'public/fonts/Kanit-Regular.ttf'));
 const run=font.layout(value);
 const naturalWidth=run.positions.reduce((sum:number,p:{xAdvance:number})=>sum+p.xAdvance,0);
 const scale=Math.min(size/font.unitsPerEm,width/Math.max(1,naturalWidth));
 const height=Math.ceil((font.ascent-font.descent)*scale);
 let x=0,y=0;
 const paths=run.glyphs.map((glyph:{path:{toSVG:()=>string}},i:number)=>{
  const pos=run.positions[i];
  const path=`<path d="${glyph.path.toSVG()}" transform="translate(${(x+pos.xOffset)*scale},${font.ascent*scale-(y+pos.yOffset)*scale}) scale(${scale},${-scale})"/>`;
  x+=pos.xAdvance;y+=pos.yAdvance;return path;
 });
 return sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${Math.max(1,Math.ceil(naturalWidth*scale))}" height="${height}"><g fill="white">${paths.join('')}</g></svg>`)).png().toBuffer();
}
export async function renderWinnerVoucher(entry:Entry){
 const prize=prizeFor(entry.prize_id);if(!prize||!templateIds.has(prize.id))return null;
 const width=2048,height=1138,headerWidth=970;
 const source=await sharp(join(process.cwd(),`public/assets/prize-templates/${prize.id}.png`)).resize(width,height).png().toBuffer();
 const overlays:OverlayOptions[]=[];
 const greeting=`แสดงความยินดีกับ คุณ${entry.name} จากบริษัท ${entry.company}`;
 overlays.push({input:await text(greeting,36,headerWidth,true),left:1020,top:45});
 overlays.push({input:Buffer.from('<svg width="840" height="238"><rect width="840" height="238" rx="25" fill="#052d60" fill-opacity=".88"/></svg>'),left:0,top:900});
 overlays.push({input:await text('เงื่อนไขการใช้ Voucher',27,780,true),left:50,top:924});
 const terms=[
  '- ซื้อสินค้าครบชุดตามประเภท Voucher ที่ได้รับ',
  '- มัดจำ 20% ภายใน 30 วัน นับจากวันที่ได้รับ Voucher',
  '- ใช้สิทธิ์ 1 Voucher / 1 บริษัท / 1 Order',
  '- ไม่สามารถแลกหรือถอนเป็นเงินสด และไม่สามารถใช้ร่วมกับส่วนลดอื่นได้',
 ];
 for(let i=0;i<terms.length;i++)overlays.push({input:await text(terms[i],23,785),left:50,top:974+i*36});
 return sharp(source).composite(overlays).png().toBuffer();
}
