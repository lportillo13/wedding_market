import fs from 'node:fs/promises';
import sharp from 'sharp';
import {createHash} from 'node:crypto';

// All bitmap assets derive from these editable, font-independent outlined SVG masters.
const mark=await fs.readFile('public/brand/wm-mark.svg','utf8');
const smallMark=await fs.readFile('public/brand/wm-small-mark.svg','utf8');
const ivory='#FBF7F0',cocoa='#4B352C';
function frame(size,background,color,fraction=.8,compact=false) {
  const master=compact?smallMark:mark;
  const body=color?master.replaceAll('#C9AC79',color).replaceAll('#4B352C',color):master;
  const width=1024*fraction,height=width*512/600;
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 1024 1024">${background?`<rect width="1024" height="1024" fill="${background}"/>`:''}<svg x="${(1024-width)/2}" y="${(1024-height)/2}" width="${width}" height="${height}" viewBox="0 0 600 512">${body.slice(body.indexOf('<defs>'),body.lastIndexOf('</svg>'))}</svg></svg>`);
}
async function png(path,size,background,color,fraction,compact=false) {
  const raster=sharp(frame(size,background,color,fraction,compact));
  await fs.writeFile(path,await (background?raster.removeAlpha():raster).png().toBuffer());
}
await fs.mkdir('mobile/assets/brand',{recursive:true});
await png('mobile/assets/brand/app-icon.png',1024,cocoa,ivory,.88);
await png('mobile/assets/brand/adaptive-foreground.png',1080,null,ivory,.65);
await png('mobile/assets/brand/adaptive-monochrome.png',1080,null,'#FFFFFF',.65,true);
await png('mobile/assets/brand/notification.png',96,null,'#FFFFFF',.98,true);
await png('mobile/assets/brand/splash.png',600,null,cocoa,.9);
await png('mobile/assets/brand/mark.png',256,null,cocoa,.98);
for(const size of [192,512])await png(`public/icon-${size}.png`,size,cocoa,ivory,.85);
await png('public/apple-touch-icon.png',180,cocoa,ivory,.85);
await png('public/icon-maskable-512.png',512,cocoa,ivory,.7);
await fs.writeFile('public/icon.svg',frame(512,cocoa,ivory,.94,true));
const worker=await fs.readFile('public/sw.js','utf8');
const offline=await fs.readFile('public/offline.html');
const revision=createHash('sha256').update(await fs.readFile('public/icon.svg')).update(offline).digest('hex').slice(0,12);
await fs.writeFile('public/sw.js',worker.replace(/const CACHE_VERSION = "[^"]+";/,`const CACHE_VERSION = "wm-pwa-v2-${revision}";`));
const images=await Promise.all([16,32,48].map(size=>sharp(frame(size,cocoa,ivory,1.1,true)).png().toBuffer()));
const header=Buffer.alloc(6+16*images.length);header.writeUInt16LE(1,2);header.writeUInt16LE(images.length,4);
let offset=header.length;
for(const [i,bytes] of images.entries()) {
  const base=6+16*i;header[base]=[16,32,48][i];header[base+1]=[16,32,48][i];header.writeUInt16LE(1,base+4);header.writeUInt16LE(32,base+6);header.writeUInt32LE(bytes.length,base+8);header.writeUInt32LE(offset,base+12);offset+=bytes.length;
}
await fs.writeFile('app/favicon.ico',Buffer.concat([header,...images]));
await png('mobile/store/icon-512.png',512,cocoa,ivory,.88);
await sharp(Buffer.from(await fs.readFile('public/brand/wm-logo.svg','utf8'))).resize(1024).png().toFile('public/brand/wm-logo.png');
const wordmark=await fs.readFile('public/brand/wm-logo.svg','utf8');
const feature=`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="500" viewBox="0 0 1024 500"><rect width="1024" height="500" fill="${ivory}"/><rect width="314" height="500" fill="${cocoa}"/><path d="M350 72H965M350 428H965" stroke="#C9AC79"/><image x="34" y="127" width="246" height="246" href="data:image/png;base64,${(await fs.readFile('mobile/store/icon-512.png')).toString('base64')}"/><svg x="348" y="162" width="620" height="176" viewBox="0 0 1060 300">${wordmark.slice(wordmark.indexOf('<g'),wordmark.lastIndexOf('</svg>'))}</svg></svg>`;
await fs.writeFile('mobile/store/feature-graphic.svg',feature);
await sharp(Buffer.from(feature)).removeAlpha().png().toFile('mobile/store/feature-graphic-1024x500.png');
// One inspectable contact sheet, with real small-size rasters at 1x alongside enlarged previews.
const icon=await fs.readFile('mobile/assets/brand/app-icon.png');
const notify=await fs.readFile('mobile/assets/brand/notification.png');
const logo=await fs.readFile('public/brand/wm-logo.svg','utf8');
const sheet=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="700"><rect width="1200" height="700" fill="${ivory}"/><text x="55" y="60" font-family="Georgia" font-size="22" fill="${cocoa}">THE WEDDING MARKET · PRODUCTION CANDIDATE</text><svg x="45" y="90" width="800" height="226" viewBox="0 0 1060 300">${logo.slice(logo.indexOf('<g'),logo.lastIndexOf('</svg>'))}</svg><image x="60" y="345" width="220" height="220" href="data:image/png;base64,${icon.toString('base64')}"/><rect x="350" y="345" width="220" height="220" rx="30" fill="${cocoa}"/><image x="412" y="407" width="96" height="96" href="data:image/png;base64,${notify.toString('base64')}"/>${images.map((bytes,i)=>`<image x="${660+i*110}" y="400" width="${[16,32,48][i]}" height="${[16,32,48][i]}" href="data:image/png;base64,${bytes.toString('base64')}"/>`).join('')}<text x="60" y="610" font-family="Arial" font-size="17" fill="${cocoa}">1024px app icon</text><text x="350" y="610" font-family="Arial" font-size="17" fill="${cocoa}">White / transparent notification</text><text x="660" y="510" font-family="Arial" font-size="17" fill="${cocoa}">16 / 32 / 48 px favicons · actual size</text></svg>`;
await sharp(Buffer.from(sheet)).png().toFile('docs/mobile-launch-2026-10-26/brand/production-candidate.png');
console.log('Generated native, notification, splash, favicon, PWA and listing assets from the outlined WM master.');
