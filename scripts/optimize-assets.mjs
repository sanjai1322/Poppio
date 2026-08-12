/**
 * One-off asset pass. Re-run after re-exporting the can or the wrap art:
 *   node scripts/optimize-assets.mjs
 *
 * 1. Wrap art -> WebP at a sane resolution (the PNGs are ~1.7MB each).
 * 2. Shrinks the label texture baked into the GLB down to a 4x4 stub.
 *
 * The stub matters: the runtime replaces `POPPIO_Label.map` with a wrap on
 * mount, so the baked pixels are never shown — but the texture object still
 * carries the sampler wrap modes and the KHR_texture_transform offset that
 * Can.tsx copies onto each wrap. Deleting the texture outright would throw
 * that away; shrinking it keeps the metadata for ~100 bytes.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from "node:fs";
import { basename, join } from "node:path";
import sharp from "sharp";

const PUBLIC = "public";
const BACKUP = "assets";

const GLB = join(PUBLIC, "poppio-can.glb");
const WRAPS = [
  "poppio_mango.png",
  "poppio_guava.png",
  "poppio_pineapple.png",
  "poppio_dragon.png",
].map((name) => join(PUBLIC, "wraps", name));

const JSON_CHUNK = 0x4e4f534a;
const BIN_CHUNK = 0x004e4942;

function align4(n) {
  return (n + 3) & ~3;
}

function parseGlb(buffer) {
  const jsonLength = buffer.readUInt32LE(12);
  const json = JSON.parse(buffer.subarray(20, 20 + jsonLength).toString("utf8"));
  const binStart = 20 + jsonLength;
  const binLength = buffer.readUInt32LE(binStart);
  const bin = buffer.subarray(binStart + 8, binStart + 8 + binLength);
  return { json, bin };
}

function writeGlb(json, bin) {
  const jsonBytes = Buffer.from(JSON.stringify(json), "utf8");
  const jsonPadded = Buffer.alloc(align4(jsonBytes.length), 0x20);
  jsonBytes.copy(jsonPadded);

  const binPadded = Buffer.alloc(align4(bin.length), 0);
  bin.copy(binPadded);

  const total = 12 + 8 + jsonPadded.length + 8 + binPadded.length;
  const out = Buffer.alloc(total);

  out.writeUInt32LE(0x46546c67, 0); // "glTF"
  out.writeUInt32LE(2, 4);
  out.writeUInt32LE(total, 8);

  out.writeUInt32LE(jsonPadded.length, 12);
  out.writeUInt32LE(JSON_CHUNK, 16);
  jsonPadded.copy(out, 20);

  const binHeader = 20 + jsonPadded.length;
  out.writeUInt32LE(binPadded.length, binHeader);
  out.writeUInt32LE(BIN_CHUNK, binHeader + 4);
  binPadded.copy(out, binHeader + 8);

  return out;
}

/** Rebuild the BIN chunk with one bufferView's bytes replaced, re-packing offsets. */
function replaceBufferView(json, bin, index, bytes) {
  const chunks = json.bufferViews.map((view, i) =>
    i === index
      ? bytes
      : Buffer.from(bin.subarray(view.byteOffset ?? 0, (view.byteOffset ?? 0) + view.byteLength)),
  );

  const parts = [];
  let offset = 0;

  json.bufferViews.forEach((view, i) => {
    const padding = align4(offset) - offset;
    if (padding > 0) parts.push(Buffer.alloc(padding, 0));
    offset += padding;

    view.byteOffset = offset;
    view.byteLength = chunks[i].length;
    parts.push(chunks[i]);
    offset += chunks[i].length;
  });

  const rebuilt = Buffer.concat(parts);
  json.buffers[0].byteLength = rebuilt.length;
  return rebuilt;
}

const kb = (n) => `${(n / 1024).toFixed(0)}KB`;

async function main() {
  mkdirSync(BACKUP, { recursive: true });

  for (const source of WRAPS) {
    const target = source.replace(/\.png$/, ".webp");
    const before = readFileSync(source).length;

    await sharp(source)
      .resize({ width: 1280, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(target);

    const after = readFileSync(target).length;
    console.log(`${basename(target).padEnd(24)} ${kb(before)} -> ${kb(after)}`);
  }

  const backup = join(BACKUP, "poppio-can.original.glb");
  if (!existsSync(backup)) copyFileSync(GLB, backup);

  const original = readFileSync(backup);
  const { json, bin } = parseGlb(original);

  const imageView = json.images?.[0]?.bufferView;
  if (imageView === undefined) throw new Error("GLB has no embedded image to shrink");

  const stub = await sharp({
    create: { width: 4, height: 4, channels: 3, background: "#ffffff" },
  })
    .png({ compressionLevel: 9 })
    .toBuffer();

  const rebuilt = replaceBufferView(json, bin, imageView, stub);
  const out = writeGlb(json, rebuilt);
  writeFileSync(GLB, out);

  console.log(`${"poppio-can.glb".padEnd(24)} ${kb(original.length)} -> ${kb(out.length)}`);
}

main();
