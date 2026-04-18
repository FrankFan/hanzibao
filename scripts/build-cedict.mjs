import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import zlib from 'node:zlib';

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--input') args.input = argv[++i];
    else if (a === '--outDir') args.outDir = argv[++i];
    else if (a === '--maxExamples') args.maxExamples = Number(argv[++i]);
    else if (a === '--onlySingleChar') args.onlySingleChar = true;
    else if (a === '--help' || a === '-h') args.help = true;
    else args._.push(a);
  }
  return args;
}

function isHanChar(c) {
  return /^\p{Script=Han}$/u.test(c);
}

function toToneMarkSyllable(syl) {
  const m = syl.match(/^([A-Za-züÜv:]+)([1-5])$/);
  if (!m) return syl;
  let base = m[1].replaceAll('u:', 'ü').replaceAll('U:', 'Ü').replaceAll('v', 'ü').replaceAll('V', 'Ü');
  const tone = Number(m[2]);
  if (tone === 5) return base;

  const lower = base.toLowerCase();
  const findIndex = () => {
    const a = lower.indexOf('a');
    if (a !== -1) return a;
    const e = lower.indexOf('e');
    if (e !== -1) return e;
    const ou = lower.indexOf('ou');
    if (ou !== -1) return ou;
    if (lower.includes('iu')) return lower.indexOf('u');
    if (lower.includes('ui')) return lower.indexOf('i');
    for (let i = lower.length - 1; i >= 0; i -= 1) {
      if ('aeiouü'.includes(lower[i])) return i;
    }
    return -1;
  };

  const idx = findIndex();
  if (idx === -1) return base;

  const map = {
    a: ['ā', 'á', 'ǎ', 'à'],
    e: ['ē', 'é', 'ě', 'è'],
    i: ['ī', 'í', 'ǐ', 'ì'],
    o: ['ō', 'ó', 'ǒ', 'ò'],
    u: ['ū', 'ú', 'ǔ', 'ù'],
    ü: ['ǖ', 'ǘ', 'ǚ', 'ǜ'],
    A: ['Ā', 'Á', 'Ǎ', 'À'],
    E: ['Ē', 'É', 'Ě', 'È'],
    I: ['Ī', 'Í', 'Ǐ', 'Ì'],
    O: ['Ō', 'Ó', 'Ǒ', 'Ò'],
    U: ['Ū', 'Ú', 'Ǔ', 'Ù'],
    Ü: ['Ǖ', 'Ǘ', 'Ǚ', 'Ǜ'],
  };

  const ch = base[idx];
  const repl = map[ch]?.[tone - 1];
  if (!repl) return base;
  return base.slice(0, idx) + repl + base.slice(idx + 1);
}

function toToneMarks(pinyinNumbered) {
  return pinyinNumbered
    .split(/\s+/g)
    .filter(Boolean)
    .map((t) => toToneMarkSyllable(t))
    .join(' ');
}

function parseCedictLine(line) {
  if (!line || line.startsWith('#')) return null;
  const m = line.match(/^(\S+)\s+(\S+)\s+\[(.+?)\]\s+\/(.+)\/\s*$/);
  if (!m) return null;
  const traditional = m[1];
  const simplified = m[2];
  const pinyin = m[3];
  const defs = m[4]
    .split('/')
    .map((s) => s.trim())
    .filter(Boolean);
  return { traditional, simplified, pinyin, definitions: defs };
}

function shardForChar(char) {
  const cp = char.codePointAt(0);
  if (cp == null) return null;
  return Math.floor(cp / 500);
}

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

async function loadText({ input }) {
  if (input) return fs.readFile(input, 'utf8');
  const sources = [
    'https://www.mdbg.net/chinese/export/cedict/cedict_1_0_ts_utf-8_mdbg.txt.gz',
    'https://raw.githubusercontent.com/rhcarvalho/cedict/master/cedict_ts.u8',
  ];

  let lastError = null;
  for (const url of sources) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`.trim());

      if (url.endsWith('.gz')) {
        const ab = await res.arrayBuffer();
        const buf = Buffer.from(new Uint8Array(ab));
        return zlib.gunzipSync(buf).toString('utf8');
      }

      return res.text();
    } catch (e) {
      lastError = e;
    }
  }

  const msg = lastError instanceof Error ? lastError.message : String(lastError);
  throw new Error(`Failed to download CC-CEDICT from all sources. Last error: ${msg}`);
}

function buildCharacterIndex(entries, maxExamples) {
  const single = new Map();
  const wordsByChar = new Map();

  for (const e of entries) {
    const chars = Array.from(e.simplified);
    for (const c of chars) {
      if (!isHanChar(c)) continue;
      const list = wordsByChar.get(c) ?? [];
      list.push(e);
      wordsByChar.set(c, list);
    }
  }

  for (const e of entries) {
    if (Array.from(e.simplified).length !== 1) continue;
    const c = e.simplified;
    if (!isHanChar(c)) continue;
    if (single.has(c)) continue;

    const pinyin = toToneMarks(e.pinyin);
    const definitions = e.definitions.slice(0, 6);
    const rawWords = (wordsByChar.get(c) ?? []).filter(
      (w) => Array.from(w.simplified).length >= 2 && Array.from(w.simplified).length <= 4,
    );

    const seen = new Set();
    const examples = [];
    for (const w of rawWords) {
      if (examples.length >= maxExamples) break;
      const word = w.simplified;
      if (seen.has(word)) continue;
      seen.add(word);
      examples.push({
        word,
        pinyin: toToneMarks(w.pinyin),
        meaning: (w.definitions[0] ?? '').trim(),
      });
    }

    single.set(c, {
      traditional: e.traditional,
      simplified: e.simplified,
      pinyin,
      definitions,
      examples,
    });
  }

  return single;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    process.stdout.write(
      [
        'Usage:',
        '  node scripts/build-cedict.mjs --outDir public/data',
        '',
        'Options:',
        '  --input <file>         local cedict_ts.u8 path (optional)',
        '  --outDir <dir>         output directory (default: public/data)',
        '  --maxExamples <n>      examples per character (default: 3)',
        '  --onlySingleChar       only keep entries where simplified length = 1',
      ].join('\n') + '\n',
    );
    return;
  }

  const outDir = args.outDir ? path.resolve(args.outDir) : path.resolve('public/data');
  const maxExamples = Number.isFinite(args.maxExamples) ? args.maxExamples : 3;
  await ensureDir(outDir);

  const text = await loadText({ input: args.input });
  const lines = text.split(/\r?\n/g);
  const parsed = [];
  for (const line of lines) {
    const p = parseCedictLine(line);
    if (!p) continue;
    if (args.onlySingleChar && Array.from(p.simplified).length !== 1) continue;
    parsed.push(p);
  }

  const index = buildCharacterIndex(parsed, maxExamples);
  const shards = new Map();
  for (const [char, entry] of index.entries()) {
    const shard = shardForChar(char);
    if (shard == null) continue;
    const bucket = shards.get(shard) ?? {};
    bucket[char] = entry;
    shards.set(shard, bucket);
  }

  const writes = [];
  for (const [shard, data] of shards.entries()) {
    const file = path.join(outDir, `cedict-${shard}.json`);
    writes.push(fs.writeFile(file, JSON.stringify(data), 'utf8'));
  }
  await Promise.all(writes);

  process.stdout.write(
    `Wrote ${shards.size} shards into ${outDir} (${index.size} chars)\n`,
  );
}

await main();
