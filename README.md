# The Biology Universe

Video courses sold with manual bKash payments. Next.js 14 (App Router) · Prisma · PostgreSQL.

- **Landing page** lists published courses, explains bKash payment with an interactive slider that uses your real number, FAQ, footer.
- **Course page** with free preview lessons, lesson list and a Buy with bKash button.
- **Checkout**: student sends money to your bKash, enters the number they sent from and the TrxID. The payment waits as *pending*.
- **Admin**: approve or reject payments (approval opens the course instantly), create courses and lessons from unlisted YouTube or Google Drive links, build a quiz for every lesson with a pass mark, give or remove access by hand, set the bKash number in Settings.
- **Students**: My courses with progress, a lesson player, and a quiz under each video. The next lesson only opens after passing the quiz of the one before.

## Setup

Needs Node 18.18+ and a PostgreSQL database (local, Neon, Supabase, Railway, a VPS…).

```bash
npm install                 # also runs `prisma generate`
cp .env.example .env        # then set DATABASE_URL and SESSION_SECRET
npm run db:check            # tests the connection and says what's wrong if it fails
npm run db:migrate          # creates the tables (prisma migrate deploy)
npm run demo                # optional: sample courses, students and payments
npm run dev                 # http://localhost:3000
```

The first admin is created automatically on first start from `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env`
(default `admin@biologyuniverse.test` / `changeme123`). Change the password from the student side, or set new
values and run `npm run reset-admin`. Sample students use the password `student123`.

## Daily use

1. **Settings** → set your bKash number and account type (students see it on the course page and at checkout,
   never on the homepage), the homepage headline and introduction, an optional announcement for the top bar,
   a hero image, and your WhatsApp number and email.
2. **Courses → New course** → title, price (0 = free), category (becomes a topic on the homepage and a filter
   on /courses), instructor (shown under “Meet your teachers”),
   instructor, optional original price (shown crossed out), preview video and cover image.
3. **Add lessons**: paste each video’s link. See **Video sources** below for which kind to use.
4. Open a lesson → **Add a question** (2–6 answers, mark the right one). Set the pass mark (default 70%).
5. **Publish** the course. It appears on the landing page.
6. **Payments to check** → find each TrxID in your bKash statement → **Approve** (or Reject with a reason the student sees).

### Video sources

| Link you paste | How it plays | Branding |
| --- | --- | --- |
| `https://…/lesson.mp4` or `.webm` | Your own player | None |
| `https://…/playlist.m3u8` (HLS) | Your own player (hls.js) | None |
| Bunny Stream `iframe.mediadelivery.net/embed/…` | Bunny’s player | None |
| Vimeo `vimeo.com/123456789` | Vimeo’s player | Hidden on Vimeo’s paid plans |
| YouTube `youtu.be/…` (unlisted) | YouTube’s player, loads on play | YouTube’s logo and title stay (their terms require it) |
| Google Drive `drive.google.com/file/d/…/view` | Drive’s player | Google’s |

For a clean, branding-free course, upload videos to **Bunny Stream** (or Cloudflare Stream) and paste either
the HLS link (`…/playlist.m3u8`, shown in the video’s details) or the embed link. Both hosts can also restrict
playback to your domain, which unlisted YouTube links can’t. Our own player has play/pause, ±10 s, a seek bar,
speed (0.75–2×), volume, full screen, keyboard shortcuts (Space/K, J/L, ←/→, F, M) and remembers where each
student stopped. If you host files yourself, the server must allow your site’s domain (CORS) for HLS.

### Live classes

Open a course → **Live classes** tab → fill in the title, start time (Dhaka time), length and the Google Meet /
Zoom / Teams link → **Schedule class**. **Live classes** in the admin menu lists every class across courses.

- Only students enrolled in that course (and admins) ever receive the link. The public course page only says the
  course includes live classes and when the next one is.
- Students see upcoming classes on their dashboard and in the lesson page (a **Live classes** tab and a
  **Next live class** card), with an **Add to calendar** link.
- The **Join class** button appears 15 minutes before the start and disappears when the class ends. The page
  checks the clock every 30 seconds, so nobody has to refresh.
- After the class, open it again and paste the **recording link**: students then see **Watch recording**.

### Materials (PDFs, images, slides…)

Open a course → **Materials** tab → upload a file (PDF, image, Word, PowerPoint, Excel, text or zip, up to
25 MB) or add a link (for example a Google Drive folder). Choose **Whole course** or a specific lesson.

- Students find them in the lesson page's **Materials** tab: that lesson's files first, then the course-wide ones.
  PDFs and images open in the browser; there's also a Download link.
- Files are stored in `uploads/` (set `UPLOAD_DIR` to change it) and are never public: every download goes through
  `/api/materials/:id`, which checks that the person is signed in and enrolled. Back this folder up with your
  database. On hosts without a persistent disk (for example Vercel), use links instead of uploads.

## Production

```bash
npm run build && npm start
```

- Set a long random `SESSION_SECRET`. Serve over HTTPS (login cookies are `Secure` in production; set `COOKIE_SECURE="false"` only for plain HTTP).
- Run `npm run db:migrate` on every deploy. After changing `prisma/schema.prisma`, create a migration with `npx prisma migrate dev --name <change>`.
- `npm run db:studio` opens Prisma Studio to browse the data.

## Where things are

| Path | What |
| --- | --- |
| `prisma/schema.prisma`, `prisma/migrations/` | Database schema and migrations |
| `src/lib/data.ts` | Every database query (Prisma) |
| `src/lib/video.ts` | YouTube / Drive link → embed |
| `src/lib/time.ts` | Dhaka time, the live-class Join window, Google Calendar links |
| `src/lib/storage.ts` | Where uploaded materials are saved, allowed file types |
| `src/app/api/materials/[id]/route.ts` | Protected material downloads |
| `src/app/actions/` | Server actions: auth, checkout + quiz, admin |
| `src/app/page.tsx` | Landing page |
| `src/app/admin/` | Admin dashboard |
| `src/app/learn/` | Lesson player and quiz |
| `src/app/globals.css`, `site.css`, `app.css` | Design tokens, public site, app screens |

## Updating an existing install

Pull the new code, then run `npm install` and `npm run db:migrate`. New migrations (for example the course
category and instructor fields) are applied in order; your data stays.

## Troubleshooting

**"Unable to start a transaction in the given time"** or very slow first page loads mean the app couldn't get a
database connection quickly. Run `npm run db:check`. For a cloud database (Neon, Supabase, Railway) add
`?sslmode=require` to `DATABASE_URL`, and prefer a region close to Bangladesh (Singapore or Mumbai). The app waits
up to 15 seconds for a connection and keeps connections open, so only the first request after a restart is slow.

## Notes

- Fonts (Sentient, Switzer) load from Fontshare; the page falls back to Georgia and the system sans-serif if it’s unreachable.
- Course covers come from the cover image link, else the YouTube video’s thumbnail, else a cover drawn from the title.
- bKash is checked by hand on purpose: there’s no API call, so nothing to configure besides the number.
