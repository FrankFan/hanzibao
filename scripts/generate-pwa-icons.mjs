import fs from 'node:fs/promises';
import path from 'node:path';
import zlib from 'node:zlib';

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  const crc = crc32(Buffer.concat([typeBuf, data]));
  crcBuf.writeUInt32BE(crc, 0);
  return Buffer.concat([length, typeBuf, data, crcBuf]);
}

function pngFromRgba({ width, height, rgba }) {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([PNG_SIGNATURE, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

function makeIconRgba(size) {
  const rgba = Buffer.alloc(size * size * 4);
  const bg = { r: 0x0e, g: 0xa5, b: 0xe9, a: 0xff };
  const fg = { r: 0xff, g: 0xff, b: 0xff, a: 0xff };

  const setPixel = (x, y, c) => {
    const i = (y * size + x) * 4;
    rgba[i] = c.r;
    rgba[i + 1] = c.g;
    rgba[i + 2] = c.b;
    rgba[i + 3] = c.a;
  };

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) setPixel(x, y, bg);
  }

  const pad = Math.round(size * 0.22);
  const barH = Math.max(2, Math.round(size * 0.12));
  const gap = Math.max(2, Math.round(size * 0.08));
  const left = pad;
  const right = size - pad;
  const top = pad;

  const bars = [
    { y: top, w: right - left },
    { y: top + barH + gap, w: right - left },
    { y: top + (barH + gap) * 2, w: Math.round((right - left) * 0.65) },
  ];

  for (const b of bars) {
    for (let y = b.y; y < b.y + barH; y += 1) {
      for (let x = left; x < left + b.w; x += 1) setPixel(x, y, fg);
    }
  }

  return rgba;
}

async function writeIcon(filePath, size) {
  const rgba = makeIconRgba(size);
  const png = pngFromRgba({ width: size, height: size, rgba });
  await fs.writeFile(filePath, png);
}

async function main() {
  const outDir = path.resolve('public/icons');
  await fs.mkdir(outDir, { recursive: true });
  await writeIcon(path.join(outDir, 'icon-192.png'), 192);
  await writeIcon(path.join(outDir, 'icon-512.png'), 512);
  await writeIcon(path.join(outDir, 'apple-touch-icon.png'), 180);
  process.stdout.write(`Generated icons in ${outDir}\n`);
}

await main();
