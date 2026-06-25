# Handoff: Memories — Family Photo Archive Portal

## Overview
**Memories** (production domain: `memories.bryanthayes.com`) is a warm, mobile-first web app whose
single job is to help non-technical family members **preserve old photos with as little friction as
possible**, then **collaboratively** add details over time.

The product is built on one core principle: **uploading and organizing are decoupled.**
You upload now (zero forms, zero required fields); anyone in the family organizes later. This kills the
"I'll upload them when I have time to fill everything out" problem.

The app is structured around **Memories** — each Memory is a private collection devoted to a
person/event (e.g. "Jeff Rice"). The shell is person/event-agnostic; a Memory is just the first thing
you pick. Each Memory is gated by a **password** (hard-coded server-side, shared out-of-band by the
owner). On entering a Memory the visitor **picks who they are** so contributions can be attributed;
that identity is remembered on the device.

Primary target is **mobile** (iPhone-class, one-handed, large touch targets); a **desktop** workspace
expands the library into a multi-select editing surface.

## About the Design Files
The file in this bundle (`Family Photo Archive.dc.html` + its runtime `support.js`) is a **design
reference created in HTML** — a prototype showing intended look, copy, and behavior. It is **not
production code to copy directly.**

Your task is to **recreate these designs in the target codebase's environment** (React/Next, Vue,
SwiftUI, etc.) using its established patterns, component library, and conventions. If no codebase exists
yet, choose the most appropriate framework for a small, mobile-first, image-heavy collaborative web app
(e.g. Next.js + a component lib, or plain React + Tailwind) and implement the designs there.

> The HTML opens as a **pannable canvas** showing all 13 screens side by side. Open
> `Family Photo Archive.dc.html` in a browser (keep `support.js` next to it). Drag to pan, scroll/pinch
> to zoom. Each frame is labeled.

## Fidelity
**High-fidelity.** Final colors, typography, spacing, copy, and component styling are intended to be
matched closely. Recreate the UI faithfully using your codebase's libraries. The sample photos are
**placeholder tone blocks** — swap in real images. Numbers/names/dates are sample data.

---

## Product Principles (read first — they drive every screen)
1. **Decoupled flows.** "Upload Photos" and "Photo Library (organize)" are two separate journeys.
   Uploading asks for **nothing** — no metadata, no Save button. Uploads start immediately on selection.
2. **Optimize for older, non-technical users on phones.** No small text (mobile body ≥ 16px, never
   below 13px even for labels), large hit targets (primary actions 60–64px tall; list rows ~62px;
   chips ≥ 38px), plain friendly language, minimal typing, sticky primary actions, one-handed reach.
3. **Collaboration with attribution.** Every metadata field is editable by anyone. Every edit autosaves
   instantly (no Save buttons). Contributions are attributed to the signed-in person.
4. **Date is the priority field.** Of all metadata, an approximate **time** is the most valuable. The
   date card is visually emphasized everywhere, and the "Photo Detective" defaults to dates first.
5. **Encourage, don't force.** Missing info shows as gentle badges/prompts ("Add date", "Needs story"),
   never as required-field blockers.

---

## Identity & Access Model (important — implement carefully)
- **Per-Memory password.** Hard-coded on the backend per Memory; owner shares it by text. The
  Password screen collects it and unlocks that Memory only. No accounts, no email.
- **Pick-your-name identity.** After unlocking, the visitor chooses their name from a list of people
  who have **already logged into that Memory** (so a returning user on a new device just taps their
  name), or taps **"I'm someone new"** to add themselves. The selected identity is persisted on the
  device (cookie / localStorage). If the cookie is gone, they re-pick from the same list — nothing is
  lost.
- **Contributors ≠ tagged people.** The "Contributors · who's helped" list and the per-photo activity
  timeline reflect **people who have logged in and edited/uploaded** — NOT everyone tagged in photos.
  Keep these two concepts separate in the data model: `contributors` (identities) vs `people` (tags).

---

## Design Tokens

### Color
| Token | Hex | Use |
|---|---|---|
| `bg/page` | `#FAF6F0` | App background (warm cream) |
| `surface/white` | `#FFFFFF` | Cards, inputs |
| `surface/warm` | `#FFFDFA` | Bottom nav / top bars |
| `surface/sand` | `#FBF7F0` | Subtle panels (empty-state prompt, photo-details block) |
| `surface/accentTint` | `#FBF1EC` | Emphasized **date** card background |
| `ink` | `#2E2A26` | Primary text / headings |
| `text/body` | `#3D3833` | Long-form "About this photo" text |
| `text/body2` | `#5C554D` | Notes text |
| `text/muted` | `#7A7066` | Secondary paragraph text |
| `text/muted2` | `#8A8178` | Card meta |
| `text/faint` | `#A79C8E` | Uppercase labels, helper text |
| `text/placeholder` | `#B7AC9D` | Input placeholders, × icons |
| `text/chevron` | `#C4B9A8` | List chevrons |
| `accent/terracotta` | `#C4704F` | Primary actions, priority emphasis, active states |
| `accent/terracottaBorder` | `#EAC9B8` | Border of emphasized date card |
| `accent/sage` | `#7A8B6F` | Detective / success / confidence chips |
| `accent/sageDark` | `#6C7C62` | Detective gradient end, encouragement text |
| `tint/sage` | `#EEF1E9` | "Approximate" chip bg, encouragement banners |
| `chip/bg` | `#F0EAE0` | Tags, person chips, occasion |
| `border/card` | `#EBE1D2` | Card & input borders |
| `border/meta` | `#EFE6D8` | Metadata card borders |
| `border/button` | `#E3D8C8` | Outline button borders |
| `border/divider` | `#EEE5D7` | Nav top border, desktop dividers |
| `border/dashed` | `#D9CAB3` | "Add" affordances (dashed) |
| `device/bezel` | `#191613` | Phone bezel |

**Avatar colors** (cycle by person): `#C4704F`, `#7A8B6F`, `#B08A6B`, `#8C7BA0`, `#C9A14A`.

**Vintage photo placeholder tones** (use until real images load):
`#9FA487` olive · `#C9A28B` tan · `#94A3AC` dusty blue · `#C2B193` sepia · `#B59BA0` mauve ·
`#A8B69C` sage · `#BFA67E` gold · `#8E9A93` slate · `#A89A82` taupe.
Each block carries a sheen overlay: `linear-gradient(150deg, rgba(255,250,242,.25), rgba(45,35,25,.16))`.

### Typography
- **Family:** `Hanken Grotesk` (Google Fonts). Weights used: 400, 500, 600, 700, 800.
- **Scale (mobile, 390px screen):**
  - Screen hero `h1`: 31–34px / 800 / line-height 1.12 / letter-spacing −0.02em
  - Section title: 26–28px / 800
  - Card value (e.g. "Around 1962"): 24px / 800
  - Body / paragraph: 17–18px / 500 / line-height 1.5
  - Long-form story: 17px / 500 / line-height 1.55
  - Uppercase field label: 13px / 700 / letter-spacing 0.06–0.08em
  - Chips, buttons, list names: 15–19px / 700–800
  - Meta / timestamps: 13–15px / 500–600
  - Bottom-nav labels: 12px / 700
- **Minimum sizes:** mobile body never below 16px; labels never below 13px. (Older-user requirement.)

### Spacing, Radius, Elevation
- **Screen padding:** 20–26px horizontal.
- **Radius:** metadata cards 20px · feature cards 22–24px · chips/tags 11–13px · buttons 16–18px ·
  inputs 16px · photos 16–22px · phone screen 46px · bezel 56px · avatars 50%.
- **Touch targets:** primary buttons 60–64px tall · outline buttons 62px · identity/list rows 62–64px ·
  chips 38–42px · nav items full-width thirds with 24px glyph + label.
- **Shadows:** cards `0 6px 16px rgba(60,45,30,.04)` · feature cards `0 8px 20px rgba(60,45,30,.05)` ·
  primary button `0 12px 24px -6px rgba(196,112,79,.45)` · device `0 30px 60px -18px rgba(45,30,15,.4)`.

---

## Screens / Views (13 frames)

> Frames are grouped: **Entry flow** → **In-Memory app** → **Photo Detective** → **Reference views**.

### 1. Memories (hub) — `data-screen-label="Memories"`
- **Purpose:** Agnostic landing. Choose which Memory to open.
- **Layout:** Status bar → brand lockup (terracotta rounded-square mark + "Memories" /
  "memories.bryanthayes.com") → `h1` "Family Memories" → intro paragraph → vertical list of Memory cards
  → footer "🔒 Each memory is password-protected".
- **Memory card:** white, border `#EBE1D2`, radius 22, padding 13; 70×70 tone cover (radius 16) +
  name (21/800) + meta ("1938 – 2024 · 1,204 photos", 15/500 `#8A8178`) + 38px lock circle (`#F0EAE0`).
  Sample memories: **Jeff Rice** (1938–2024 · 1,204), **The Lake House** (Summers 1960–1989 · 318),
  **Jean's 90th** (2019 · 86).
- **Action:** tapping a card → Password screen for that Memory.

### 2. Password gate — `data-screen-label="Enter password"`
- **Purpose:** Unlock a private Memory.
- **Layout:** Status bar → back row "‹ All memories" → centered: 96px Memory cover (radius 24), name
  (25/800), meta, 60px lock circle, `h2` "This memory is private", paragraph "Enter the password a
  family member texted you.", **password input** (64px, white, 2px `#C4704F` border, focus ring
  `0 0 0 4px rgba(196,112,79,.12)`, dots + caret), **"Open Memory"** primary button (62px terracotta),
  helper "Didn't get a password? Ask whoever invited you to this memory."
- **Behavior:** validate against server-side password for that Memory; on success → Identity screen
  (first visit / no cookie) or straight into Home (returning, identity known).

### 3. Who are you? (identity) — `data-screen-label="Who are you"`
- **Purpose:** Attribute contributions; remember the user on this device.
- **Layout:** Status bar → context chip ("▢ Jeff Rice · unlocked") → `h1` "Who are you?" → paragraph
  "Pick your name so we can credit what you add. We'll remember you on this device." → list of
  **existing contributors** (62px rows: 40px avatar + name 18/800 + chevron) → primary
  **"＋ I'm someone new"** (60px terracotta) → footer "On a new phone or browser? Just pick your name
  again — nothing is lost." Sample people: Sarah, Grandma Jean, Uncle Mike, Bryant.
- **Behavior:** selecting a name (or adding new) writes identity to cookie/localStorage and enters Home.
  "Someone new" opens a single name field.

### 4. Home (in a Memory) — `data-screen-label="Home"`
- **Purpose:** The two decoupled entry points, scoped to the open Memory.
- **Layout:** Status bar → **Memory bar** (44px back-chevron tile + "MEMORY / Jeff Rice" + 42px cover
  avatar) → `h1` "Help us remember Jeff" → paragraph → **two big cards** → footer "🔒 Private to your
  family".
- **Cards:** (a) **Upload Photos** — filled terracotta, 62px icon tile, 23/800 white title, subtitle
  "Add photos from your phone". (b) **Photo Library** — white, "Browse & add details".
- These are the *only* navigation on Home (per brief).

### 5. Upload — in progress — `data-screen-label="Upload progress"`
- **Purpose:** Frictionless upload; begins immediately, no Save.
- **Layout:** Status bar → header "‹ Uploading" → **progress card** (white): "Uploading…" + "19%",
  "23 of 118 photos complete", 14px progress bar (terracotta fill on `#F0EAE0`) → "THIS BATCH" label →
  2-col thumbnail grid (150px tiles). Tile states: **uploading** = dark overlay + conic-gradient ring;
  **done** = 28px sage check badge top-right. (Production: also a per-tile remove ✕ before completion.)
- **Behavior:** uploads auto-start on selection; read EXIF date when present; detect duplicates;
  support single/multi/whole-camera-roll and desktop drag-drop.

### 6. Upload — success — `data-screen-label="Upload success"`
- **Layout:** Centered 108px sage check, `h1` "Your photos are safely saved", paragraph
  "118 photos added… Thank you for helping preserve them.", sticky buttons **Go to Library** (terracotta)
  + **Upload More** (outline), helper "Add dates, names, and stories anytime — no rush." No metadata asked.

### 7. Photo Library — `data-screen-label="Library"`
- **Purpose:** The shared, browsable, filterable grid (Google-Photos-like).
- **Layout:** Status bar → header ("Family Library"→ shows Memory name "Jeff Rice" + count) → 52px
  **search** ("🔍 Search photos & people") → **Photo Detective banner** (sage gradient, 🔍, "42 photos
  need your help", "Start") → **filter chips** (horizontal, 40px: All[active] · Needs info · 🏷️ Tags ·
  People · Has date) → **2-col photo grid** (172px tiles) → **bottom nav** (Upload / Library[active]).
- **Grid tiles:** tone block + sheen. Missing-info badge bottom-left (dark pill, e.g. "📅 Add date",
  "📝 Needs story", "👤 Who's this?"); favorite tiles show ❤️ top-right. Complete tiles: no badge.
- **Filters (full set to implement):** Needs Information · Has Date · Has People · Has Story · Tags ·
  Recently Uploaded · Recently Updated · Decade · Albums · Contributor · Favorites.

### 8. Photo detail (compact) — `data-screen-label="Photo detail"`
- **Purpose:** Everything about one photo; each field independently editable; autosaves.
- **Layout:** Status bar → header (back · "Photo" · ❤️) → large photo (248px, radius 22) → autosave note
  "✓ Changes save automatically…" → metadata cards → bottom home indicator.
- **Cards (in order):**
  1. **When was this taken? — EMPHASIZED.** Tinted bg `#FBF1EC`, border `#EAC9B8`, label in terracotta,
     value "Around 1962" + sage "Approximate" chip, sub-line "⭐ The most helpful thing to add".
  2. **Who's in this photo?** person chips (avatar + name + ×) + dashed "＋ Add person".
  3. **Where was this?** — shown here as a dashed **empty-state prompt** ("📍 Add a location — Do you
     know where this was taken?") to demonstrate the encourage-don't-force pattern.
  4. **✍️ About this photo** — free-form description (replaces the old separate Story/Occasion/Albums).
  5. **🏷️ Tags** — user-driven keyword chips (Lake house, Summer, Fishing) + dashed "＋ Add tag".
  6. **Contributors · who's helped** — attributed activity timeline (avatar + "Sarah uploaded this
     photo" + date). Uploaders/editors only.

### 9. Full Photo view (reference) — `data-screen-label="Photo view full"`
- **Purpose:** A single tall, uncropped render showing **every** section of the photo page (use as the
  master spec for the detail page). Same as #8 plus: photo action row (❤️ Favorite · ⤴ Share · ⊞ Album),
  **Where was this?** filled ("Lake Tahoe, California"), **🗒️ Notes** (optional free text),
  **Photo details** block (Added / Source / File / Photo ID), and a longer Contributors timeline
  (adds "Bryant tagged the location"). Field order: Date → People → Location → About → Tags → Notes →
  Photo details → Contributors.

### 10–13. Photo Detective (gamified completion)
A focused, almost game-like mode for filling gaps. Four views:
- **10. Mission picker** (`Detective missions`): `h1` "Let's solve some mysteries" → mission cards with
  tinted icon tiles: **Add dates** (42) · **Name people** (18) · **Tell stories** (27) · **Add places**
  (9), each "›". Dashed **"🎲 Surprise me"**. Footer streak "🔥 3-day streak · 64 details added".
  *Dates are listed first by design.*
- **11. Name people** (`Detective people`): close ✕ · title · "5 / 18" + 8px progress bar → photo →
  `h2` "Do you recognize anyone?" → 2-col suggested-person buttons (avatar + name) → "＋ Add new" /
  "No one I know" → encouragement banner.
- **12. Tell a story** (`Detective story`): progress → photo → `h2` "What do you remember?" → large
  text field with placeholder + **🎤 mic** (voice-to-text) → **Save memory** (terracotta) / "Skip for
  now" → encouragement.
- **13. All done** (`Detective done`): scattered confetti dots → 104px terracotta 🏆 → `h1` "You're on a
  roll!" → paragraph → progress card ("Jeff Rice memory · 68% complete" bar + stats: 🔥 3 day streak /
  64 details added / 🥇 top helper) → **Keep going** / **Done for now**.

### Desktop — Library workspace — `data-screen-label="Desktop Library"`
- 1340×858 reference of the responsive desktop layout. **Top bar:** brand "Memories › Jeff Rice" +
  centered search + "Select" + "📷 Upload". **Left rail (230px):** filter list with counts (All 1,204 /
  Needs info 312 / Has people 540 / Has story 287 / Recently added 96) + Decade + Detective promo.
  **Center:** "All photos" + "3 selected · Edit together" + **masonry grid** (CSS columns, varied
  heights; selected tiles get a terracotta `outline` + check). **Right panel (330px):** multi-photo
  editing — "Editing 3 photos together", shared Date / People / Location, **"Apply to all 3 photos"**,
  "✓ Saved automatically". Keyboard shortcuts, drag-select, and bulk metadata are intended here.

---

## Interactions & Behavior
- **Navigation flow:** Memories → Password → (Identity, if needed) → Home → {Upload | Library}.
  Library tile → Photo detail. Library/Home → Photo Detective. Detail fields → inline edit popovers.
- **Autosave everywhere:** no Save buttons on metadata; every edit persists immediately with an
  unobtrusive "Saved automatically" confirmation. Provide **undo** for recent edits.
- **Upload:** selection triggers immediate upload; large top progress bar; per-item progress and
  removal; success state offers Upload More / Go to Library. Read EXIF dates; detect duplicates;
  optionally suggest dates from upload sequence.
- **Smart editing (library/desktop):** multi-select → apply the same date/location/people to many
  photos; duplicate metadata from a neighboring photo; bulk-tag.
- **Detective loop:** pick mission → one photo at a time → quick-answer chips (decades, suggested
  names) or text/voice → Skip advances → progress bar + streak → celebration on completion.
- **Empty/missing states are invitations,** not errors: dashed prompt cards and grid badges.
- **Voice input** on story fields (mic) to minimize typing for older users.
- **Responsive:** single-column mobile (bottom nav, sticky primary actions, swipe between photos) →
  desktop three-pane workspace (rail + masonry + edit panel).

## State Management
- `currentMemory` (id, name, cover, counts) — selected on the hub; gates everything below.
- `memoryUnlocked` (bool) — set after correct password; scope to the Memory.
- `currentUser` (identity: id, name, avatar color) — persisted to cookie/localStorage; chosen on the
  Identity screen; used to attribute every write.
- `contributors[]` per Memory — identities that have logged in (drives the Identity picker AND the
  attribution timelines). **Distinct from** `people[]` (tag subjects).
- Per-photo record: `dateValue` + `dateConfidence` (`exact | month-year | year | approx | unknown`),
  `people[]` (tags), `location`, `about` (text), `tags[]` (keywords), `notes`, `favorite`,
  `albums[]`, `activity[]` (who did what, when), plus immutable `meta` (added, source, file, id).
- `uploadQueue[]` with per-item progress/status; `filters` + `searchQuery` for the library;
  `selection[]` for desktop bulk edit; Detective `mission`, `queue`, `index`, `streak`, `completedToday`.

## Date confidence (priority field)
Capture an approximate time even when exact is unknown. Support: **Exact date · Month + Year · Year
only · Approximate timeframe** (e.g. "Early 1960s", "Late 1970s", "Around 1995") · **Unknown**. Derive
and display a confidence label automatically (e.g. "Approximate"). Surface this field with visual
priority (tinted card) and as the default Detective mission.

## Assets
- **Font:** Hanken Grotesk via Google Fonts (`https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700;800`).
- **Icons:** the prototype uses system **emoji** (📷 🖼️ 🔍 📅 👤 📍 ✍️ 🏷️ 🗒️ 🔒 🏆 🎤 ❤️ ⭐). These
  are intentional (friendly, legible for older users). In a codebase, you may keep emoji or substitute a
  consistent icon set with equivalent warmth/weight — keep them large.
- **Photos:** none included — all imagery is **placeholder tone blocks** (see token list). Replace with
  the family's uploaded images; the UI is designed so photos are the visual focus and chrome recedes.
- **No external image/logo assets** are required to build.

## Files
- `Family Photo Archive.dc.html` — the design reference (all 13 frames on a pannable canvas).
- `support.js` — runtime required to render the HTML prototype. Keep it beside the HTML; **do not port
  it** — it only powers the prototype, not the product.

> The HTML is authored as a streaming "Design Component"; treat it strictly as a **visual + behavioral
> reference**. Build the real app with your stack's idioms.
