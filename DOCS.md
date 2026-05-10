# Syloline Portfolio — Developer Docs

A digital-artist portfolio with an admin dashboard. Public visitors browse a gallery; the admin signs in with Google to upload, edit, and delete pieces. All data lives in MongoDB Atlas, all images in Cloudinary, all of it deployed serverless on Vercel.

This document walks through every important file and function so future-you (or anyone else opening this repo) can navigate it without re-reading the source line by line.

---

## Stack

| Layer            | Choice                                                  | Why                                                                                                                                |
| ---------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Framework        | **Next.js 14 (App Router)** + TypeScript                | Vercel-native; SSR/SSG for SEO + link previews; API routes replace Express; no separate backend to deploy.                         |
| Styling          | **Tailwind CSS** with a small custom palette            | Centralizes the brand color via `tailwind.config.ts`; fast iteration; no runtime CSS-in-JS overhead.                               |
| Database         | **MongoDB Atlas** + Mongoose                            | Schema-light for content that may evolve; Mongoose gives typed schemas in TS.                                                      |
| Auth             | **NextAuth (Auth.js v5)** with Google + email allowlist | httpOnly cookie session — no client-readable token, fixes the XSS-vulnerable sessionStorage pattern from the previous portfolio.   |
| Image hosting    | **Cloudinary** with signed direct browser uploads       | Bypasses Vercel's 4.5 MB function body limit; built-in optimization, responsive variants, CDN.                                     |
| Deploy           | **Vercel**                                              | Zero-config, free tier covers a portfolio's traffic, native to Next.                                                               |

---

## Required environment variables

Copy `.env.example` to `.env.local` and fill in. Production values go in the Vercel dashboard, not in any file.

| Variable                          | Purpose                                                                                                  |
| --------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `MONGODB_URI`                     | Atlas connection string. Include the database name (`/syloline`).                                        |
| `NEXTAUTH_SECRET`                 | Signs the session JWT. Generate with `openssl rand -base64 32`.                                          |
| `NEXTAUTH_URL`                    | Public URL of the deployment (e.g. `http://localhost:3000` in dev, `https://...` in prod).               |
| `GOOGLE_CLIENT_ID` / `_SECRET`    | OAuth client from Google Cloud Console. Add `/api/auth/callback/google` as an authorized redirect URI.   |
| `ADMIN_EMAIL`                     | The single email allowed to access `/admin`. Lowercase comparison.                                       |
| `CLOUDINARY_CLOUD_NAME`           | From the Cloudinary console.                                                                             |
| `CLOUDINARY_API_KEY` / `_SECRET`  | Server-side credentials used to sign upload requests and delete assets.                                  |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Same as `CLOUDINARY_CLOUD_NAME`. Exposed to the browser. Currently the form reads cloud name from the signature response, but this is here in case future client code needs it. |

---

## Repository layout

```
src/
  auth.ts                                 NextAuth config (single source of truth)
  middleware.ts                           Edge gate for /admin and /api/admin

  app/
    layout.tsx                            Root HTML + fonts
    globals.css                           Tailwind + CSS variables
    page.tsx                              Public homepage
    work/[slug]/page.tsx                  Public artwork detail
    admin/
      signin/page.tsx                     Google sign-in (NOT gated; outside (authed))
      (authed)/                           Route group — applies the admin layout to authed pages only
        layout.tsx                        Admin shell (nav + sign-out)
        page.tsx                          Artwork list with edit/delete
        new/page.tsx                      Upload form
        [id]/edit/page.tsx                Edit form
    api/
      auth/[...nextauth]/route.ts         NextAuth handlers
      admin/
        upload-signature/route.ts         Signed Cloudinary payload
        artworks/route.ts                 GET list, POST create
        artworks/[id]/route.ts            PATCH update, DELETE remove

  lib/
    db.ts                                 Cached Mongoose connection
    artworks.ts                           CRUD service for the Artwork model
    cloudinary.ts                         Cloudinary SDK config + helpers
    models/Artwork.ts                     Mongoose schema

  components/
    BrandHeader.tsx                       [SYLOLINE] header
    BioColumn.tsx                         Left column: bio + contact
    ArtworkGrid.tsx                       Responsive grid of cards
    ArtworkCard.tsx                       Single tile linking to detail
    admin/
      AdminArtworkRow.tsx                 One row in the admin list (delete logic)
      ArtworkForm.tsx                     Shared create + edit form
```

---

## Important functions, file by file

### `src/lib/db.ts`

**`connectDb(): Promise<typeof mongoose>`** — returns the singleton Mongoose connection, opening it on the first call and reusing it on every subsequent call. The connection is cached on `globalThis.__mongooseCache` so that a warm serverless invocation reuses the existing pool instead of opening a new one (which would exhaust the Atlas connection limit under load). On connection failure the cached promise is reset so the next call retries instead of getting stuck on a rejected promise.

### `src/lib/models/Artwork.ts`

Mongoose schema for the `artworks` collection.

Fields: `title`, `slug` (unique, lowercased), `description`, `tags[]`, `cloudinaryPublicId`, `cloudinaryUrl`, `width`, `height`, plus auto `createdAt`/`updatedAt`. The schema uses `InferSchemaType` so the TypeScript shape stays in sync with the schema definition automatically.

The model is registered defensively as `models.Artwork || model('Artwork', ...)` to avoid `OverwriteModelError` during Next.js hot reload.

### `src/lib/artworks.ts`

Service layer over the `Artwork` model. Every function ensures `connectDb()` is called first, calls `.lean()` on queries to skip Mongoose's hydration step (faster + serializable), and converts results to a plain `ArtworkDTO` so they can cross the React Server Component → Client boundary.

- **`listArtworks(): Promise<ArtworkDTO[]>`** — every artwork, newest first. Used by the homepage and the admin list.
- **`getArtworkBySlug(slug)`** — fetch by URL slug. Used by the public detail page.
- **`getArtworkById(id)`** — fetch by Mongo `_id`. Used by the admin edit page.
- **`createArtwork(input)`** — inserts a new doc. Generates a unique slug from the title via `generateUniqueSlug`.
- **`updateArtwork(id, input)`** — patches title/description/tags. Re-derives the slug if the title changed (passing the doc's own `_id` as `excludeId` so we don't collide with ourselves).
- **`deleteArtwork(id)`** — removes the doc and returns whether one existed.
- `slugify(input)` — lowercase, strip diacritics, replace non-alphanumerics with hyphens, cap at 80 chars.
- `generateUniqueSlug(title, excludeId?)` — base slug, then `-2`, `-3`, … until no collision.

### `src/lib/cloudinary.ts`

- **`getUploadSignature(folder = "syloline")`** — returns `{ timestamp, signature, apiKey, cloudName, folder }`. The browser then POSTs the file plus these fields to `https://api.cloudinary.com/v1_1/{cloud}/image/upload`, and Cloudinary verifies the HMAC matches. The signature includes the timestamp so it's short-lived (~1 h before Cloudinary rejects it).
- **`deleteCloudinaryAsset(publicId)`** — calls `cloudinary.uploader.destroy(publicId)` to free the storage when an artwork is deleted.

### `src/auth.ts`

The single NextAuth (Auth.js v5) config. Exports `handlers`, `auth`, `signIn`, `signOut` — every other auth-related file imports from here.

Key choices:
- **Google provider only.** Anyone can sign in *with Google* but only the allowlisted email passes the `signIn` callback.
- **`signIn` callback** rejects any email that doesn't match `process.env.ADMIN_EMAIL`. Returning `false` causes NextAuth to redirect back to the sign-in page with `?error=AccessDenied`.
- **JWT session strategy.** Session lives in an httpOnly cookie signed by `NEXTAUTH_SECRET`. No DB session table needed.
- **Custom sign-in page** at `/admin/signin` instead of NextAuth's default UI.

### `src/middleware.ts`

Edge middleware that runs before any matched request. Wrapped in `auth(...)` so `req.auth` is populated.

If a visitor hits a gated path without a session, they're redirected to `/admin/signin?callbackUrl=<original-path>`. The matcher excludes `/admin/signin` itself so that page is reachable.

### `src/app/api/auth/[...nextauth]/route.ts`

Re-exports `handlers.GET` and `handlers.POST` so Next sees them as Route Handlers. NextAuth covers all of `/api/auth/signin`, `/api/auth/callback/google`, `/api/auth/signout`, `/api/auth/session`, etc., from this single dynamic route.

### `src/app/api/admin/upload-signature/route.ts`

`GET` returns a fresh `UploadSignature`. Authentication is enforced by `middleware.ts` — without a session you never reach this code path.

### `src/app/api/admin/artworks/route.ts`

- `GET` — returns `{ items: ArtworkDTO[] }`. Same data as the homepage but exposed as JSON for the admin client.
- `POST` — validates the body (`parseCreateBody`), calls `createArtwork`, then `revalidatePath('/')` and `revalidatePath('/work/<slug>')` to bust the static cache so the new piece appears for visitors immediately. Returns the created `ArtworkDTO` with status 201.
- `parseCreateBody(raw)` — defensive runtime validation. Returns a discriminated union `{ ok: true, data } | { ok: false, error }`. We don't pull in zod for one endpoint.

### `src/app/api/admin/artworks/[id]/route.ts`

- `PATCH` — accepts partial `{ title?, description?, tags? }` and applies it via `updateArtwork`. Image is intentionally not updatable here (to avoid orphan Cloudinary assets and the UX complexity of re-uploading).
- `DELETE` — looks up the artwork, calls `deleteCloudinaryAsset` (warn-and-continue on failure — orphaned Cloudinary storage is less bad than orphaned DB records), then deletes the doc and revalidates.

### `src/app/page.tsx`

The public homepage. Server Component — runs on the server, fetches artworks via `listArtworks()`, renders the brand header + bio column + grid. `export const revalidate = 60` caches the rendered page for 60 seconds to keep DB reads low; admin mutations call `revalidatePath('/')` to invalidate immediately.

### `src/app/work/[slug]/page.tsx`

Detail page per artwork. The `generateMetadata` function builds per-page `<title>`, `description`, and `og:image` so each artwork has its own link preview when shared on Twitter/Discord/IG. `notFound()` triggers Next's 404 page if the slug doesn't resolve.

### Why the `(authed)` route group?

Next.js applies a `layout.tsx` to every nested page. The admin shell (nav, sign-out button) shouldn't appear on the sign-in page itself — that page is where unauthenticated visitors land. Route groups let us scope the layout: `(authed)/layout.tsx` wraps only the pages inside `(authed)/`, and the parens mean the group name doesn't appear in the URL. So `/admin` still resolves to `(authed)/page.tsx`, but `/admin/signin` is outside the group and renders without the admin shell.

### `src/app/admin/signin/page.tsx`

Server Component with a server action — `signIn("google", { redirectTo: callbackUrl })` runs on the server when the form submits, so we don't need any client-side auth code. Reads `?error=` to show a message if the email allowlist rejected the user.

### `src/app/admin/layout.tsx`

Wraps every admin page except `/admin/signin`. Provides:
- Top nav (`All work`, `+ New`, `View site →`)
- Sign-out button (server action calling `signOut({ redirectTo: "/" })`)
- Tailwind layout shell

By the time this layout renders, the visitor is guaranteed authenticated (middleware would have bounced them otherwise).

### `src/app/admin/page.tsx`

Lists every artwork using `<AdminArtworkRow>`. `export const dynamic = "force-dynamic"` disables caching so the list always reflects the latest DB state (admin user, low traffic, no cache benefit).

### `src/app/admin/new/page.tsx` and `src/app/admin/[id]/edit/page.tsx`

Thin wrappers around `<ArtworkForm mode="create">` / `<ArtworkForm mode="edit" artwork={...}>`. Keeping these pages tiny on purpose — all the logic lives in the shared form component.

### `src/components/BrandHeader.tsx`

The top bar with `[ SYLOLINE ]` between thin horizontal rules. Cormorant Garamond serif for the brand mark; the bracket characters echo the handwritten sketch.

### `src/components/BioColumn.tsx`

Static bio + contact links. Currently hard-coded — change the strings to the artist's real info. Move to MongoDB later if you want admin-editable bio content (low priority).

### `src/components/ArtworkGrid.tsx`

Renders the artworks as a responsive grid (1 column mobile, 2 columns desktop). Passes `featured` to the first card so it spans both columns — matches the "one big block + one smaller block" rhythm in the sketch.

### `src/components/ArtworkCard.tsx`

Single tile. Wraps `next/image` with `fill` + Cloudinary URL — Cloudinary serves the optimized variant per device, Next handles lazy loading and responsive `sizes`. Title appears as a gradient overlay on hover so the grid stays quiet by default.

### `src/components/admin/AdminArtworkRow.tsx`

Client component (`"use client"`) — needs `useTransition` and `useRouter` for the inline delete flow. Calls `DELETE /api/admin/artworks/[id]`, then `router.refresh()` re-runs the parent Server Component so the row disappears without a full page reload. Errors render inline.

### `src/components/admin/ArtworkForm.tsx`

The most substantial component. Handles both create and edit via a discriminated union prop (`mode: "create" | "edit"`).

- **`uploadToCloudinary(file)`** — the two-step direct upload: GET the signature from our backend, then POST `file + signature + folder` directly to Cloudinary's REST API. Returns `{ publicId, url, width, height }`. The width/height come from Cloudinary's response — used for `next/image` aspect ratios and CLS prevention.
- **`handleSubmit`** — diverges by mode: `PATCH` the metadata in edit mode, or `uploadToCloudinary(file)` then `POST` the metadata in create mode. On success: `router.push("/admin")` then `router.refresh()` so the list reflects the change.
- **Image is fixed in edit mode.** Replacing the image would orphan a Cloudinary asset and add a lot of UX complexity for marginal gain. The user can delete + re-upload if they really need to swap an image.

---

## Common flows, end to end

### Visitor browses the gallery

1. `GET /` hits Next.js → renders `src/app/page.tsx` (Server Component).
2. `listArtworks()` calls `connectDb()` then `Artwork.find().sort({createdAt: -1}).lean()`.
3. Result is mapped to `ArtworkDTO[]` and passed to `<ArtworkGrid>` server-side.
4. HTML is sent to the browser; Cloudinary URLs in `<img>` tags are fetched directly from Cloudinary's CDN.
5. Page is cached for 60 seconds (`revalidate = 60`).

### Admin uploads a new piece

1. Admin signs in via Google → middleware lets them into `/admin/new`.
2. Admin picks a file in `<ArtworkForm>`. Local preview shown via `URL.createObjectURL`.
3. Admin clicks Upload → `handleSubmit` runs.
4. `uploadToCloudinary` calls `GET /api/admin/upload-signature` (gated by middleware, returns the signed payload).
5. Browser posts the file directly to `https://api.cloudinary.com/v1_1/<cloud>/image/upload` with the signed payload.
6. Cloudinary returns `{ public_id, secure_url, width, height }`.
7. Browser `POST`s metadata + Cloudinary fields to `/api/admin/artworks`.
8. Server validates, generates a unique slug, calls `Artwork.create(...)`, then `revalidatePath("/")`.
9. Admin is redirected to `/admin` → `router.refresh()` re-fetches the list.

### Admin deletes a piece

1. Admin clicks "delete" on a row → `window.confirm` then `DELETE /api/admin/artworks/[id]`.
2. Server fetches the doc to learn the Cloudinary `publicId`.
3. Server calls `cloudinary.uploader.destroy(publicId)` (logs and continues on failure).
4. Server calls `Artwork.findByIdAndDelete(id)`, then `revalidatePath("/")`.
5. Browser `router.refresh()` re-fetches the admin list, the row disappears.

---

## Things deliberately NOT included (and why)

- **No public API** for visitors. Reads happen via Server Components calling MongoDB directly. No `/api/artworks` to maintain or rate-limit.
- **No drag-and-drop reordering** in v1. Artworks are sorted by `createdAt desc`. Add later if the artist asks for manual ordering — the schema is ready (just add an `order: number` field and a sort).
- **No multi-image artworks** in v1. Single image per piece. Adding a `images: { url, publicId }[]` array later is additive.
- **No contact form / Resend integration.** The bio column links Gmail and Instagram directly, which is enough for a portfolio.
- **No drag-to-reorder of tags** or tag autocomplete. Tags are free-form comma-separated text. If a vocabulary emerges, add a `categories` collection later.
- **No image replacement on edit.** Forces a delete-and-re-upload, which keeps the Cloudinary library tidy and the code simple.

---

## Local setup

```bash
# 1. Install dependencies (one-time)
npm install

# 2. Copy the env template and fill in values
cp .env.example .env.local
# Then open .env.local and paste in your real Mongo URI, Google OAuth
# client, Cloudinary keys, and admin email.

# 3. Generate a NextAuth secret
openssl rand -base64 32
# Paste the output as NEXTAUTH_SECRET in .env.local

# 4. Run the dev server
npm run dev
# Visit http://localhost:3000  — homepage
# Visit http://localhost:3000/admin  — sign in with Google
```

> **Sandbox note:** The initial scaffold was generated in an environment that couldn't run `npm install` to completion. Run it locally before committing further changes — Next, Mongoose, NextAuth and Cloudinary all need to be present for typecheck and build.

> **Empty folders left over:** `src/app/admin/new/` and `src/app/admin/[id]/edit/` exist as empty directories from the initial scaffold. They're harmless but feel free to remove them locally:
> ```bash
> rmdir src/app/admin/new src/app/admin/\[id\]/edit src/app/admin/\[id\]
> ```

---

## Scripts

| Command          | What it does                                              |
| ---------------- | --------------------------------------------------------- |
| `npm run dev`    | Local dev server on `http://localhost:3000`.              |
| `npm run build`  | Production build (run before deploying).                  |
| `npm run start`  | Serves the production build locally.                      |
| `npm run lint`   | ESLint via Next's built-in config.                        |
| `npm run typecheck` | `tsc --noEmit` to catch type errors without building. |

---

## Git setup (one-time)

The scaffold was written without a working git repo (the sandbox that generated it couldn't complete `git init`). To set up the repo and push to GitHub:

```bash
cd "C:\Users\nicol\Documents\Projects\Manual Work\porto-digital-artist\Portofolio Digital Artist"

# Remove the broken .git/ left by the sandbox
rmdir /s /q .git    # PowerShell / cmd
# (or `rm -rf .git` on Git Bash / WSL)

git init -b main
git remote add origin https://github.com/Lucraison/portofolio-syloline.git
git add .
git commit -m "initial scaffold: Next.js + TS + MongoDB + NextAuth + Cloudinary"
git push -u origin main
```

---

## Deploying to Vercel

1. Push the repo to GitHub (the remote is already set to `https://github.com/Lucraison/portofolio-syloline`).
2. In Vercel, "Import Project" → pick the repo. Framework auto-detected as Next.js.
3. Add every variable from `.env.example` (with real values) under Settings → Environment Variables.
4. After the first deploy, copy the deployment URL into `NEXTAUTH_URL` (it must match the actual public URL or Google OAuth callbacks fail).
5. In Google Cloud Console, add `<vercel-url>/api/auth/callback/google` to the OAuth client's authorized redirect URIs.
6. Done — push to `main` to deploy.

---

## Lessons from the previous portfolio that this build addresses

The previous personal portfolio (Vite + React + JS) shipped with three documented weaknesses. Each is structurally fixed here:

1. **Auth via password + JWT in `sessionStorage`** → fixed via NextAuth + httpOnly session cookie. No client-readable token, no XSS path to the admin.
2. **`Admin.jsx` 538-line monolith** → split from day one into `layout.tsx`, `page.tsx`, `new/page.tsx`, `[id]/edit/page.tsx`, plus shared `<ArtworkForm>` and `<AdminArtworkRow>` components. Largest file in the admin tree is `ArtworkForm.tsx` (~190 lines).
3. **Unsigned Cloudinary uploads** → fixed via signed direct upload (`/api/admin/upload-signature`). The Cloudinary account isn't open to the public for spam.
