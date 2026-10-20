// Download inductee portraits, bio images and archive photos from Squarespace into media/,
// then point the data at the local copies so the site no longer depends on Squarespace.
//
// Usage: node scripts/fetch-photos.mjs
// Safe to re-run: files already downloaded are skipped.

import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const INDUCTEES = path.join(ROOT, "data/inductees.json");
const PHOTOS = path.join(ROOT, "data/photos.json");
const WIDTH = "?format=1500w"; // Squarespace resizes on request; 1500px is plenty for portraits

const extOf = (url) => (path.extname(new URL(url).pathname).toLowerCase().match(/^\.(jpe?g|png|webp|gif)$/) ? path.extname(new URL(url).pathname).toLowerCase() : ".jpg");
const slugify = (s) => s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\([^)]*\)/g, " ").replace(/"[^"]*"/g, " ").replace(/["'’.]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

let ok = 0, skipped = 0, failed = 0;
async function download(url, rel) {
  const dest = path.join(ROOT, rel);
  if (fs.existsSync(dest)) { skipped++; return rel; }
  const src = url.includes("squarespace") && !url.includes("format=") ? url.split("?")[0] + WIDTH : url;
  try {
    const res = await fetch(src, { headers: { "User-Agent": "Mozilla/5.0 (photo migration)" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
    ok++;
    return rel;
  } catch (e) {
    failed++;
    console.warn(`  Failed ${url}: ${e.message}`);
    return null;
  }
}

const inductees = JSON.parse(fs.readFileSync(INDUCTEES, "utf8"));
for (const i of inductees) {
  const slug = i.slug || slugify(i.name);
  if (i.photoRemote && !i.photo) {
    const rel = await download(i.photoRemote, `media/inductees/${slug}${extOf(i.photoRemote)}`);
    if (rel) i.photo = rel;
  }
  // Images embedded in the biography text
  if (i.bioHtml) {
    const srcs = [...i.bioHtml.matchAll(/<img[^>]+src="(https?:\/\/[^"]+)"/g)].map((m) => m[1]);
    let n = 0;
    for (const s of srcs) {
      n++;
      const rel = await download(s, `media/bio/${slug}-${n}${extOf(s)}`);
      if (rel) i.bioHtml = i.bioHtml.split(s).join(`/${rel}`);
    }
  }
}
fs.writeFileSync(INDUCTEES, JSON.stringify(inductees, null, 2) + "\n");

if (fs.existsSync(PHOTOS)) {
  const photos = JSON.parse(fs.readFileSync(PHOTOS, "utf8"));
  let n = 0;
  for (const p of photos) {
    n++;
    if (p.remote && !p.file) {
      const name = decodeURIComponent(path.basename(new URL(p.remote).pathname)).replace(/[^\w.-]+/g, "-").toLowerCase();
      const rel = await download(p.remote, `media/archive/${String(n).padStart(3, "0")}-${name}`);
      if (rel) p.file = rel;
    }
  }
  fs.writeFileSync(PHOTOS, JSON.stringify(photos, null, 2) + "\n");
}

console.log(`Photos: ${ok} downloaded, ${skipped} already present, ${failed} failed.`);
if (failed) process.exitCode = 0; // don't fail the workflow over a few missing images
