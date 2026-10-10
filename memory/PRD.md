# AMYA Artisanal Foods — PRD

## Original problem statement
Premium pre-launch e-commerce website for AMYA Artisanal Foods (domain amayafoods.in), a founder-led Indian artisanal food brand by Amulya Nimmala (M.Tech). Brand always spelled **AMYA**. Starts with a small range: wood-pressed cooking oils (traditional wooden chekku/ghani), cashew brittles and homemade pickles. Signature feature: **AMYA Live Press** — customers book a live WhatsApp video call to watch their cooking oil being pressed (oils only). Terracotta (#B94F40) + warm ivory (#FFF5E8) only. Pre-launch mode: checkout disabled; bookings, enquiries and WhatsApp active.

## Architecture
- **Backend**: FastAPI + MongoDB (`/app/backend/server.py`). JWT admin auth (bcrypt, Bearer token + httpOnly cookie). Collections: users, products, bookings, enquiries, batches, settings. All routes under `/api`.
- **Frontend**: React (CRA/craco) + Tailwind + framer-motion + lenis smooth scroll + shadcn/ui. Terracotta/ivory design system, Cormorant Garamond serif + Outfit sans.
- **Auth**: single seeded admin (founder). Credentials in `/app/memory/test_credentials.md`.

## User personas
- **Customer**: browses products, books AMYA Live Press for oils, sends enquiries, contacts via WhatsApp/phone.
- **Founder/Admin (Amulya)**: manages products, availability, prices, bookings, enquiries, batches, policies and site settings.

## Core requirements (static)
- Pre-launch: NO commercial checkout until approvals confirmed (admin toggle `checkout_enabled`).
- Live Press for **oils only**; bookings never shown as confirmed until admin confirms.
- No fabricated licences, certifications, GST, lab reports, reviews, or business history.
- Two-colour brand identity; premium, mobile-first, responsive.

## Implemented (2026-06)
- Homepage: kinetic terracotta hero with masked line reveal, parallax oil image, editorial marquee, brand intro, Live Press feature, featured products, transparency band.
- Shop + category pages (oils/pickles/cashew-brittles) with availability badges (Available / Coming Soon / Temporarily Unavailable).
- Product detail: pack-size + quantity selectors, prominent allergen notice, storage/delivery/returns/food-label accordions, WhatsApp enquiry, Book Live Press (oils only), pre-launch notice instead of checkout.
- AMYA Live Press page: 4-step journey + functional booking form → POST /api/bookings + prefilled WhatsApp click-to-chat to +919675334567; recording-request option; honest "live call ≠ purity proof" note.
- Our Story (founder), About, Transparency Promise (+ future-ready batch records), Contact (form + call/WhatsApp + international shipping note), editable Policy pages.
- Admin dashboard: products CRUD + availability, bookings confirm/reject, enquiries status, batch records, settings (announcement bar, pre-launch/checkout toggles, manual bank/UPI fields, editable policies).
- SEO meta/OG tags, custom SVG favicon, generated AMYA logo + product photography.
- Original logo + favicon designed; AMYA-branded oil photography generated (groundnut/sesame/coconut).
- Verified: 23/23 backend tests pass; admin login + all public forms verified end-to-end.

## Backlog / remaining
- **P1**: Real AMYA product photos (replace stock/generated via admin); founder to supply verified bank/UPI details; confirm FSSAI/GST before enabling checkout.
- **P1**: Brute-force lockout on /api/auth/login (playbook) before go-live.
- **P2**: Commercial checkout + payment reconciliation (manual UTR → pending) once approvals + payment provider confirmed.
- **P2**: Verified international shipping-rate integration (currently "quoted individually").
- **P2**: Image upload for products/batches (object storage) instead of URL paste.
- **P3**: Restrict CORS to known origins for production.

## Next tasks
- Await founder's real photos, bank/UPI details and food-business approvals to progress payments/checkout.

## Changelog — 2026-07-10 (Mobile fixes round)
- Removed 250g/₹300 Cashew Brittle pack everywhere (backend seed + live MongoDB). Packs now: 500g ₹500 (10 pcs), 1kg ₹900 (20 pcs). Default selected = 500g. Homepage shows "From ₹500".
- Homepage "Our Collection" now single-column on mobile, two-column on desktop (`grid-cols-1 sm:grid-cols-2`). Fixed CTA button clipping ("SHOP CASHEW BRITTLE" / "DISCOVER AMYA OILS") with wrap-safe styles.
- Reduced empty vertical space between hero and products on mobile.
- Verified no horizontal overflow at 375/390/430px; images remain object-contain (uncropped). Video-call enquiry stays a text WhatsApp link. Tested via testing_agent (iteration_4.json — 100% pass).


## Changelog — 2026-07-10 (Colour balance + homepage redesign)
- New palette tokens: terracotta #B95040, deep #963C2E, warm ivory #FFF3E5, soft beige #F0DFC9, dark chocolate #301812 (added `beige`, `choco` Tailwind colours; `ivory-warm` now #F0DFC9).
- Deliberate section-background rhythm on homepage: terracotta hero → ivory product showcase → beige "how ordering works" → deep-chocolate "Why AMYA" brand story → terracotta About/footer. Reduced dominant cream.
- Product cards: rounded, soft shadow, alternating tones (Cashew = cream/white, Oils = beige); reduced empty image space on mobile (aspect-[5/4] mobile, 4/5 desktop) with tinted studio backdrop; images stay object-contain (uncropped).
- Preserved logo, typography, prices (500g/1kg only), WhatsApp ordering, and text video-call enquiry (no video player/placeholder). No allergens section restored.
- Verified via testing_agent (iteration_5.json — 100% pass): no overflow at 375/390/430/1440, functional regression intact. NOT yet published (awaiting user review of preview).


## Changelog — 2026-07-10 (Premium refinement: black accents + 60/30/10 balance)
- Palette finalised: terracotta #B94F3F, deep #963C2D, warm ivory #FFF3E6, soft beige #F0DEC5, dark chocolate #351D18, black #0A0A0A (added `noir` Tailwind token; `ink`/`choco` now dark chocolate).
- Footer converted to sophisticated BLACK (#0A0A0A) with terracotta accents (terracotta top border, terracotta-soft "EXPLORE/REACH US" headings), ivory logo + ivory text for readability (no black-on-black). All links/contact preserved.
- Softened product card corners (rounded-xl) for a minimal premium feel; header logo unchanged.
- Achieves ~60% ivory/neutral, 30% terracotta, 10% dark balance. Section rhythm: terracotta hero → ivory collection → beige info → chocolate brand story → terracotta CTA → black footer.
- Verified via testing_agent (iteration_6.json — 100% pass): no overflow at 375/390/430/1440, footer black site-wide, functional regression intact. NOT yet published (awaiting user review).


## Changelog — 2026-07-10 (Mobile: bigger product image + floating-button overlap fix)
- Cashew Brittle homepage card: image now fills a consistent 4:3 container with `object-cover` (photo is 3:2 landscape) — removes the large beige bands, makes the gold gift-box photo large/prominent without hiding the product. Oils card stays `object-contain` (full bottle). Name/prices (From ₹500) unchanged.
- Floating WhatsApp button (Layout.jsx) now AUTO-HIDES whenever it would overlap an on-page CTA/WhatsApp button (elements tagged `data-wa-cta`: collection CTAs, video-call link, home/shop/product WhatsApp buttons), via a scroll/resize bottom-right overlap check; reappears when clear. Smaller on mobile (h-12) with safe-area bottom inset. Both WhatsApp actions remain functional.
- Verified via testing_agent (iteration_7.json — 100% pass): no overflow at 375/390/430/1440, FAB never covers CTAs, prices/packs/WhatsApp intact, header/footer regression clean. NOT yet published (awaiting user review).

