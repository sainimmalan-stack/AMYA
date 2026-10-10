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


## Changelog — 2026-07-10 (Premium pricing selector + 1kg price → ₹1,000)
- Cashew Brittle 1kg price updated ₹900 → ₹1,000 per explicit user request (backend seed + live MongoDB). 500g stays ₹500. 250g remains removed.
- Redesigned the product-page pack-size selector (ProductDetail.jsx) into two equal side-by-side premium options: serif pack size (500 g / 1 kg), prominent terracotta price (₹500 / ₹1,000 with Indian comma formatting), piece-count subtext, thin borders, warm-ivory selected state + terracotta dot. Side-by-side on mobile, no wrap/overflow. Order on WhatsApp button remains full-width below.
- Verified via self-test: selection toggles, default 500g, WhatsApp order message reflects selected pack+price (500 g ₹500 / 1 kg ₹1000), no horizontal overflow at 390px. NOT yet published.


## Changelog — 2026-07-10 (1kg → ₹900 + gifting tag + qty in message)
- Reverted Cashew Brittle 1kg price back to ₹900 (seed + live MongoDB) per user. 500g stays ₹500; 250g removed.
- Added a terracotta "PERFECT FOR GIFTING" pill at the top of the 1kg pack option (absolute, keeps both options equal height; data-testid gifting-tag).
- Confirmed WhatsApp order message includes the chosen quantity, e.g. "Cashew Brittle — 1 kg (₹900) × 3" (orderMessage already passes qty).
- Verified via self-test: equal side-by-side options, prices ₹500/₹900, gifting tag renders, qty reflected in message, no overflow at 390px. NOT yet published.


## Changelog — 2026-07-10 (Best-value per-gram note on 1kg)
- Added a subtle terracotta "Best value · ₹0.90/g" caption directly under the 1kg option (computed from price/grams; 500g = ₹1.00/g so the 1kg saving is obvious). Placed below the options grid so both options keep equal height. data-testid best-value-note.
- Prices unchanged: 500g ₹500, 1kg ₹900; 250g removed. Gifting tag + qty-in-message retained.
- Self-test verified: note shows ₹0.90/g, no overflow at 390px, ordering intact. NOT yet published.


## Changelog — 2026-07-10 (BUGFIX: Our Collection blank on mobile)
- Root cause: homepage 'Our collection' heading + product cards started at opacity:0 and only revealed via framer-motion `whileInView` (IntersectionObserver). With Lenis smooth-scroll active, the observer could fail to fire on mobile, leaving the section an invisible tall blank ivory block.
- Fix (root cause): `Reveal.jsx` now uses `useInView` + a 700ms mount fallback so content always becomes visible even if the in-view trigger never fires; `Home.jsx` CollectionCards now animate on mount instead of `whileInView`.
- Verified via testing_agent (iteration_8.json — 100% pass): heading + both cards at opacity 1 within ~1.5s WITHOUT scrolling at 375/390/430; no blank gap; image/prices (From ₹500, 500g ₹500 / 1kg ₹900)/CTA intact; all reveal sections visible on full scroll; no overflow; desktop two-column intact; product-detail regression clean. NOT yet published.
- Note: inline `whileInView` still used on other non-homepage components (ProductCard/CashewFeature/HomeBooking/OilCallout/LivePress) — not reported broken; could get the same mount-fallback treatment later if needed.


## Changelog — 2026-07-10 (Website-wide terracotta identity, black removed)
- New palette (tokens in index.css + tailwind): terracotta #B95040, dark terracotta #A64032, light terracotta #D88A76, warm ivory #FFF1E3 / #FBE7D8, light-terracotta tint beige #F3DACB, dark-brown body text #42251F. `noir`/`choco` repointed to terracotta.
- Header: now rich terracotta on EVERY page with the ivory AMYA logo, ivory nav + ivory hamburger (was translucent ivory header). Logo is ivory-on-terracotta wherever prominent (header + footer).
- Footer: reverted from black to rich terracotta with ivory logo/headings/links (no black footer anywhere).
- Removed all dark/black sections: homepage 'Why AMYA' is now light ivory (dark-brown text, terracotta accents); AMYA Oils callout is now terracotta (was bg-ink). Btn outline hover now terracotta (not dark).
- Product collection on light ivory with dark-brown names/prices and terracotta accents; cards ivory / warm-ivory tones. Prices unchanged (500g ₹500 / 1kg ₹900, no 250g).
- Verified via testing_agent (iteration_9.json — 100% pass) across all 9 public routes: header+footer terracotta everywhere, no black/white sections, collection renders without scroll, mobile menu + floating WhatsApp + pricing + forms intact, no overflow at 375/390/430/1440. NOT yet published.

