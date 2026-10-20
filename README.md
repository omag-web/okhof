# Oklahoma Hall of Fame for City and Town Officials

The website for the Oklahoma Hall of Fame for City and Town Officials, rebuilt from the original Squarespace site as a fast static site hosted free on GitHub Pages.

- **88 inductees, 24 classes (2001–2025)**, each with a full biography, portrait, and (for 82 of them) their acceptance speech video
- **Searchable library**: search by name, town, title or anything in the biography; filter by class or last initial
- **A page per class** and **a page per inductee**, with prev/next and classmates
- **130-photo archive** with a keyboard-friendly viewer
- **Every old Squarespace link still works**: `/past-inductees-1/<old-slug>` and the other old URLs redirect to the new pages
- Sitemap, structured data for search engines, social share tags, print styles, mobile layout

No framework and no runtime dependencies. One Node script (`src/build.mjs`) turns the data files into HTML.

## Repository layout

| Path | What it is |
|---|---|
| `data/inductees.json` | **The library.** One entry per inductee. Edit this to add or correct inductees. |
| `data/site.json` | Organization details: contact, nomination deadline, news/press releases, board organizations, supporters |
| `data/photos.json` | The photo archive (add captions here) |
| `content/history.html`, `content/nominate.html` | Body copy for the History and Nominate pages |
| `src/build.mjs` | Site generator: page templates live here |
| `src/assets/` | `styles.css`, `site.js` (search, menu, lightbox, video), favicon |
| `media/` | Portraits and archive photos (filled by the photo workflow) |
| `scripts/import-squarespace.mjs` | Imports bios from a Squarespace export, if ever needed again |
| `scripts/fetch-photos.mjs` | Copies photos from Squarespace into `media/` |

## First-time setup

1. Create a new GitHub repository and push this folder to its `main` branch.
2. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
3. **Actions → "Download photos from Squarespace" → Run workflow.** This copies all 88 portraits and 130 archive photos into `media/` so the site no longer depends on Squarespace. It commits them and redeploys automatically.
4. The site is live at `https://<account>.github.io/<repo>/`.

Until step 3 runs, portraits load directly from Squarespace's image server, so the site works either way.

## Moving the domain

When you're ready to switch `okcityandtownofficials.org` over:

1. Add a file named `CNAME` at the repo root containing `www.okcityandtownofficials.org`. The build switches to root-relative links automatically.
2. In **Settings → Pages**, enter the custom domain and tick **Enforce HTTPS** once the certificate is issued.
3. At the domain registrar, point DNS at GitHub Pages:
   - `www` → CNAME → `<account>.github.io`
   - apex `okcityandtownofficials.org` → A records `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
4. **Run step 3 of setup before cancelling Squarespace**, or portraits that haven't been copied yet will break.
5. The press release PDFs and nomination form are still linked from Squarespace (`/s/...pdf`). Download them, drop them in `media/docs/`, and update the URLs in `data/site.json` before the Squarespace plan ends.

## Common edits

**Add next year's class.** Add one entry per inductee to `data/inductees.json`, put each portrait in `media/inductees/`, and push:

```json
{
  "name": "Jane Q. Example",
  "year": 2026,
  "title": "City Manager, Exampleton",
  "photo": "media/inductees/jane-q-example.jpg",
  "bioHtml": "<p>First paragraph…</p><p>Second paragraph…</p>",
  "videos": [{ "id": "YOUTUBE_ID", "label": "Acceptance speech" }],
  "posthumous": false
}
```

The year wall, class page, library, sitemap and prev/next links all update on their own.

**Add a press release.** Add an entry to `news` in `data/site.json`.

**Change the nomination deadline or contact info.** Edit `data/site.json`; it flows to every page.

Optional fields per inductee: `slug` (to pin a URL), `sortName` (if the last name isn't the last word), `city`, `photoRemote`.

## Working locally

```bash
npm run build      # writes the site to dist/
npm run dev        # build and serve at http://localhost:8080
```
