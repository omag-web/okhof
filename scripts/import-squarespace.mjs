// Import inductee bios from a Squarespace export (Settings → Advanced → Import & Export → Export,
// which downloads a WordPress-format .xml file).
//
// Usage: node scripts/import-squarespace.mjs path/to/export.xml
//
// What it does
//  - Reads every blog post in the "past-inductees-1" collection.
//  - Takes the induction year from the post's 4-digit tag (2001, 2002, ...).
//  - Cleans the Squarespace block markup down to plain, semantic HTML.
//  - Records the portrait URL (featured image, or the first image in the post).
//  - Merges into data/inductees.json, matching on the old Squarespace URL slug, then on name.
//    Anything you've already filled in by hand (city, title, local photo, slug) is kept.
//  - Saves raw page content (History, Nomination, etc.) to data/import/pages-raw.json for reference.

import fs from "node:fs";
import path from "node:path";
import { XMLParser } from "fast-xml-parser";
import sanitizeHtml from "sanitize-html";

const file = process.argv[2];
if (!file) {
  console.error("Usage: node scripts/import-squarespace.mjs path/to/export.xml");
  process.exit(1);
}

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const DATA = path.join(ROOT, "data/inductees.json");
const COLLECTION = /\/past-inductees-1\//;

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@", cdataPropName: "#cdata", textNodeName: "#text" });
const xml = parser.parse(fs.readFileSync(file, "utf8"));
const arr = (x) => (x == null ? [] : Array.isArray(x) ? x : [x]);
const text = (x) => {
  if (x == null) return "";
  if (typeof x === "string" || typeof x === "number") return String(x);
  return String(x["#cdata"] ?? x["#text"] ?? "");
};

const items = arr(xml.rss?.channel?.item);
if (!items.length) {
  console.error("No <item> entries found. Is this the Squarespace WordPress export?");
  process.exit(1);
}

// Attachments, for featured images.
const attachments = new Map();
for (const it of items) {
  if (text(it["wp:post_type"]) === "attachment") {
    attachments.set(text(it["wp:post_id"]), text(it["wp:attachment_url"]) || text(it.guid));
  }
}

const clean = (html) =>
  sanitizeHtml(html, {
    allowedTags: ["p", "h2", "h3", "h4", "ul", "ol", "li", "strong", "b", "em", "i", "a", "blockquote", "br", "img", "figure", "figcaption"],
    allowedAttributes: { a: ["href"], img: ["src", "alt"] },
    transformTags: { b: "strong", i: "em", h1: "h2" },
    exclusiveFilter: (f) => (f.tag === "p" || f.tag === "figure") && !f.text.trim() && !(f.mediaChildren?.length),
  })
    .replace(/(<br\s*\/?>\s*){2,}/g, "</p><p>")
    .replace(/<p>\s*<\/p>/g, "")
    .replace(/ /g, " ")
    .trim();

const firstImg = (html) => (html.match(/<img[^>]+src="([^"]+)"/i) || [])[1] || "";
const stripImg = (html, src) => {
  if (!src) return html;
  const esc = src.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return html.replace(new RegExp(`<figure>\\s*<img[^>]+src="${esc}"[^>]*>\\s*(<figcaption>.*?</figcaption>)?\\s*</figure>|<img[^>]+src="${esc}"[^>]*>`, "i"), "").replace(/<p>\s*<\/p>/g, "").trim();
};
const normName = (s) => s.toLowerCase().replace(/[^a-z]/g, "");

const imported = [];
const pagesRaw = {};
for (const it of items) {
  const type = text(it["wp:post_type"]);
  const link = text(it.link);
  const status = text(it["wp:status"]);
  const content = text(it["content:encoded"]);
  const slug = text(it["wp:post_name"]) || link.split("/").filter(Boolean).pop();

  if (type === "page") {
    pagesRaw[slug] = { title: text(it.title), link, html: clean(content) };
    continue;
  }
  if (type !== "post" || !COLLECTION.test(link) || (status && status !== "publish")) continue;

  const cats = arr(it.category);
  const tags = cats.filter((c) => c?.["@domain"] === "post_tag").map((c) => text(c).trim());
  const year = Number(tags.find((t) => /^\d{4}$/.test(t)));
  if (!year) {
    console.warn(`  Skipped "${text(it.title)}": no 4-digit year tag.`);
    continue;
  }

  const meta = arr(it["wp:postmeta"]);
  const thumbId = text(meta.find((m) => text(m["wp:meta_key"]) === "_thumbnail_id")?.["wp:meta_value"]);
  let photoRemote = (thumbId && attachments.get(thumbId)) || "";
  let bioHtml = clean(content);
  if (!photoRemote) photoRemote = firstImg(bioHtml);
  bioHtml = stripImg(bioHtml, photoRemote);

  // Acceptance-speech videos become their own field (rendered as a player), not a bare link.
  const videos = [];
  bioHtml = bioHtml.replace(/<p>\s*<a href="(https?:\/\/(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})[^"]*)">([^<]*)<\/a>\s*<\/p>/gi, (_, url, id, label) => {
    videos.push({ id, label: label.trim() || "Acceptance speech" });
    return "";
  });
  // Old site navigation that was typed into each post.
  bioHtml = bioHtml.replace(/<p>\s*<a href="\/past-inductees[^"]*">[^<]*<\/a>\s*<\/p>/gi, "").replace(/<p>\s*<\/p>/g, "").trim();

  imported.push({ name: text(it.title).trim(), year, oldSlug: slug, photoRemote: photoRemote.split("?")[0], bioHtml, videos });
}

// Archive photos: the gallery on the Squarespace /photos page.
const photosPage = items.find((it) => text(it["wp:post_type"]) === "page" && /\/photos\/?$/.test(text(it.link)));
let archive = [];
if (photosPage) {
  const srcs = [...text(photosPage["content:encoded"]).matchAll(/<img[^>]+src="([^"]+)"/gi)].map((m) => m[1].split("?")[0]);
  archive = [...new Set(srcs)].map((remote) => {
    const base = decodeURIComponent(remote.split("/").pop()).replace(/\.[a-z]+$/i, "").replace(/\s*\(\d+\)$/, "");
    const generic = /^(\d+|DSC_?\d+\w?|IMG_?\d+|CZ2D\d+|AdobeStock.*)$/i.test(base);
    return { remote, caption: generic ? "" : base.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim() };
  });
}

const existing = fs.existsSync(DATA) ? JSON.parse(fs.readFileSync(DATA, "utf8")) : [];
let matched = 0, added = 0;
for (const imp of imported) {
  const hit = existing.find((e) => e.oldSlug === imp.oldSlug) || existing.find((e) => normName(e.name) === normName(imp.name));
  if (hit) {
    matched++;
    hit.bioHtml = imp.bioHtml;
    hit.videos = imp.videos;
    hit.year = imp.year;
    hit.oldSlug = imp.oldSlug;
    if (imp.photoRemote && !hit.photo) hit.photoRemote = imp.photoRemote;
  } else {
    added++;
    existing.push({ name: imp.name, year: imp.year, city: "", title: "", photo: "", photoRemote: imp.photoRemote, bioHtml: imp.bioHtml, videos: imp.videos, oldSlug: imp.oldSlug });
  }
}
const notInExport = existing.filter((e) => !imported.some((i) => i.oldSlug === e.oldSlug));

existing.sort((a, b) => b.year - a.year || a.name.localeCompare(b.name));
fs.writeFileSync(DATA, JSON.stringify(existing, null, 2) + "\n");
fs.mkdirSync(path.join(ROOT, "data/import"), { recursive: true });
fs.writeFileSync(path.join(ROOT, "data/import/pages-raw.json"), JSON.stringify(pagesRaw, null, 2) + "\n");
if (archive.length) {
  const PHOTOS = path.join(ROOT, "data/photos.json");
  const prev = fs.existsSync(PHOTOS) ? JSON.parse(fs.readFileSync(PHOTOS, "utf8")) : [];
  const merged = archive.map((a) => ({ ...a, ...(prev.find((p) => (p.remote || "").split("?")[0] === a.remote) || {}), remote: a.remote }));
  fs.writeFileSync(PHOTOS, JSON.stringify(merged, null, 2) + "\n");
  console.log(`Saved ${archive.length} archive photos to data/photos.json.`);
}

console.log(`Imported ${imported.length} inductee posts: ${matched} updated, ${added} new.`);
console.log(`Saved ${Object.keys(pagesRaw).length} pages to data/import/pages-raw.json.`);
if (notInExport.length) console.log(`Not found in export (kept as-is): ${notInExport.map((e) => e.name).join(", ")}`);
console.log(`Next: run "npm run photos" (or the "Download photos" GitHub Action) to copy portraits into the repo.`);
