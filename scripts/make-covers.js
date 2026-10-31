// Cắt viền trắng và nén ảnh gốc trong public/images/imagerandom thành WebP nhẹ (chạy một lần)
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'public', 'images', 'imagerandom');
const OUT = path.join(__dirname, '..', 'public', 'images', 'covers');

// số cuối tên file gốc -> tên ảnh mới (ảnh số 6 "Industrial Services" chưa dùng)
const MAP = { 1: 'new-material', 2: 'equipment-robot', 3: 'polymer', 4: 'automation', 5: 'equipment-pipes' };

fs.mkdirSync(OUT, { recursive: true });
const files = fs.readdirSync(SRC);

(async () => {
  for (const [num, name] of Object.entries(MAP)) {
    const file = files.find((f) => f.startsWith('ChatGPT') && f.endsWith(`-${num}.png`));
    if (!file) {
      console.log('Khong thay anh so', num);
      continue;
    }
    const trimmed = await sharp(path.join(SRC, file))
      .trim({ background: '#ffffff', threshold: 22 })
      .toBuffer({ resolveWithObject: true });
    const { width, height } = trimmed.info;
    const inset = 10; // cắt thêm chút để bỏ góc bo
    await sharp(trimmed.data)
      .extract({ left: inset, top: inset, width: width - inset * 2, height: height - inset * 2 })
      .resize({ width: 760 })
      .webp({ quality: 78 })
      .toFile(path.join(OUT, `${name}.webp`));
    console.log('OK', name);
  }
})();