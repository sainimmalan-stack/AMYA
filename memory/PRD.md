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


## Changelog — 2026-07-10 (Cashew Brittle copy: whole roasted cashews + jaggery)
- Updated description (seed + live DB) to the exact new premium copy emphasising WHOLE cashews roasted before being dipped in jaggery (no "pieces"/"broken").
- Ingredients now exactly "Whole roasted cashews, jaggery." (removed butter, sugar, ghee). Allergen data updated to drop dairy (cashews/tree nuts only).
- short_description + homepage card copy updated to "Premium whole roasted cashews dipped in jaggery…".
- WhatsApp order message uses only name/pack/price — no stale product info. Prices/packs/images/ordering unchanged.
- Verified via API + DB + UI: ingredients + short desc display correctly; no butter/sugar/ghee/dairy/"cashew pieces" remain ("10/20 pieces" refers to brittle pieces per pack and is correct). NOT yet published.


## Changelog — 2026-07-10 (Cashew product page: mobile conversion restructure)
- Compact intro set to exact line "Whole roasted cashews coated in jaggery. Small-batch handcrafted goodness." (short_description seed + DB).
- Tightened spacing: smaller title, mobile image aspect-[4/3], reduced section padding/margins so the Order button is reachable with minimal scroll.
- Pack cards made compact; SELECTED pack now terracotta bg + ivory text (clear distinction); gifting tag + best-value note retained.
- Quantity is now a single horizontal row with a LIVE Total beside it (data-testid pd-total): 500g×1=₹500, 1kg×3=₹2,700.
- Full-width terracotta "Order on WhatsApp" button placed immediately below the quantity row. WhatsApp message now includes product, pack size, pieces, quantity and correct total (price×qty).
- Pre-launch notice (data-testid pd-prelaunch) + all detail accordions moved BELOW the order section.
- Verified via testing_agent (iteration_10.json — 100% pass): order flow correct, totals/message correct, ordering above pre-launch, no forbidden terms, no overflow at 375/390/430/1440, desktop two-column intact. NOT yet published.


## Changelog — 2026-07-10 (Hero/header visual separation)
- Homepage hero changed from terracotta to warm cream (bg-ivory-warm #FBE7D8) with a subtle bottom border, so it clearly separates from the terracotta header above and the lighter ivory 'Our collection' (#FFF1E3) below.
- Hero text now dark brown (#42251F heading/body), eyebrow 'HANDMADE · SMALL BATCHES' in terracotta, and 'SHOP OUR PRODUCTS' is a solid terracotta button with ivory text. Decorative desktop image framed on ivory with ink/10 border.
- Header unchanged (terracotta + ivory logo + border-b). Logo/content/prices/ordering untouched.
- Self-tested on mobile (390) + desktop (1440): header #B95040 vs hero #FBE7D8 clearly distinct, heading wraps naturally, button visible, no horizontal overflow. NOT yet published.


## Changelog — 2026-07-10 (+91 country code on all phone numbers)
- Added helpers in lib/api.js: formatPhoneIN(num) → "+91 9675334567" and telHref(num) → "tel:+919675334567" (normalise to last 10 digits; no +91 duplication).
- Applied across Header (desktop + mobile menu), Footer, Contact, Home (About call), OurStory, ProductDetail (Call support): displayed numbers now show "+91 9675334567" and tel links use tel:+919675334567.
- WhatsApp links unchanged (already wa.me/919675334567). Contact form's customer "Phone" input left as-is (user's own number).
- Verified via DOM: contact-call "CALL +91 9675334567" / tel:+919675334567; footer-call "+91 9675334567"; header-call tel:+919675334567; floating-wa wa.me/919675334567. NOT yet published.


## Changelog — 2026-07-10 (Removed pre-launch announcement banner)
- Removed the AnnouncementBar (pre-launch strip) from Header.jsx entirely (component + render) — gone on every page with no leftover gap. Header now starts cleanly at the top (sticky terracotta + ivory logo + border-b).
- Hero unchanged (warm cream, dark-brown heading/body, terracotta eyebrow + solid terracotta button). No functional changes; prices/products/WhatsApp/tel untouched.
- Verified: announcement-bar absent in DOM, no blank gap, no overflow at 390px; clean header→hero→collection transition. NOT yet published.


## Changelog — 2026-07-10 (Official domain → amyafoods.in)
- Fixed footer domain typo amayafoods.in → amyafoods.in ("© 2026 AMYA Artisanal Foods · amyafoods.in").
- index.html: added canonical https://amyafoods.in/, og:url, og:site_name, og:image, twitter:title/description/image, and JSON-LD Organization (url/logo https://amyafoods.in, founder Amulya Nimmala, +91-9675334567) — all referencing the official domain.
- Added public/robots.txt (allows all, disallows /admin, Sitemap: https://amyafoods.in/sitemap.xml) and public/sitemap.xml (all public routes on https://amyafoods.in). Verified served at /robots.txt and /sitemap.xml.
- Left admin login email (amulya@amayafoods.in in backend/.env) unchanged — it's an auth credential, not a website URL; changing it would break the seeded admin account.
- NOTE for go-live: serving the site at https://amyafoods.in requires connecting/verifying the custom domain in deploy settings (preview backend URL/config untouched per instructions).
- Verified via curl + DOM: footer + canonical/OG/JSON-LD + robots/sitemap all use amyafoods.in. NOT yet published.


## Changelog — 2026-07-10 (Premium product expansion: Spices + Pickles)
- Backend: Product model gained `origin`, `highlights[]`, `diet` (veg/non-veg). Catalog now 13 products. seed() made IDEMPOTENT (upsert by slug + delete obsolete) so preview AND production get the full catalog on every startup/deploy.
- New Signature Spices (category "spices", availability "enquire", no prices): Guntur Sannam Chilli Powder (S4), Lakadong Turmeric Powder — with origin + highlights, veg.
- New Traditional Pickles (category "pickles", all "coming-soon", no prices): Avakai, Maagai, Allam Sweet (veg); Chicken, Mutton, Prawn (non-veg). Removed old generic "homemade-pickle".
- Cashew Brittle preserved (available, 500g ₹500 / 1kg ₹900, gifting tag, best-value note, jaggery copy). Oils retained (coming-soon) but not in primary nav.
- Frontend: Home hero → "Rooted in Tradition. Crafted with Care." + Explore/Our Story buttons; hero image = Indian spices. OurCollection now renders featured ProductCards (cashew, chilli, turmeric) + a "Traditional Pickles. Authentic Flavours." section (6 cards). New nav: Home, Our Story, Spices, Pickles, Cashew Brittle, Contact.
- ProductCard standardised (aspect-4/5, rounded-xl, object-cover, badge top-left, DietMark top-right, status-aware CTA); mount-based reveal (no blank bug). New DietMark component; Availability gained "enquire" → muted-gold "Signature Spice" badge. Added `gold` token #B08D57.
- ProductDetail shows origin (MapPin), highlights list, diet; object-cover for spice/pickle photos; status-aware CTA (Order / Enquire / Enquire for launch updates); product-specific WhatsApp enquiry messages. No cart/checkout.
- Images are illustrative stock photos (improved turmeric w/o flowers, mango/ginger pickle shots). SEO: homepage title/description updated to premium multi-category copy.
- Verified via testing_agent (iteration_11.json — backend 25/25, frontend 100%, no issues). NOT yet republished with new catalog.

### Still required from founder
- Authentic product photography (chilli pouch/jar, Lakadong turmeric, each pickle, esp. clearly-identifiable chicken/mutton/prawn pickles) to replace illustrative stock images.
- Confirmed pack sizes + prices for spices and pickles (currently none shown).
- Any verified claims (e.g. Lakadong curcumin %, certifications) before adding — intentionally omitted.
- REDEPLOY required so the live site (amyafoods.in) serves the new 13-product catalog (idempotent seed runs on deploy).


## Changelog — 2026-07-10 (Pickle cards: packaging mockups, no food photos)
- Removed all pickle food stock photos. Created PicklePackMock.jsx — a premium CSS packaging concept (terracotta-lidded cream jar + "AMYA / ARTISANAL FOODS / <name>" terracotta label, gold hairline, "Packaging concept" caption). Rendered on pickle cards AND pickle detail gallery whenever the product has no real image.
- Pickle `images` cleared in seed + DB. Seed now sets `images` via `$setOnInsert` only, so genuine photos uploaded later (admin) persist across restarts/redeploys and simply replace the mockup — no redesign needed.
- Only the pickle section changed: chilli, turmeric, cashew, oils, hero, logo, theme, prices, WhatsApp all untouched. All 6 pickles stay Coming Soon with "Enquire for Launch Updates"; veg/non-veg marks correct.
- Verified on mobile (390): 6 consistent mockups on homepage + pickle detail pages, no overflow, no food imagery.

### Still required from founder
- Genuine pickle product photographs — upload per product (image field already wired) to auto-replace the mockup.


## Changelog — 2026-07-10 (Real chilli & turmeric pouch photos)
- Founder supplied a combined studio image of two AMYA pouches (chilli + turmeric). Cropped into two separate e-commerce images (730x1008 JPG q92), full pouch/label preserved, no distortion/recolour.
  - `/app/frontend/public/products/guntur-sannam-chilli-powder.jpg` (left crop)
  - `/app/frontend/public/products/lakadong-turmeric-powder.jpg` (right crop)
- Updated seed (server.py) + DB docs for slugs `guntur-sannam-chilli-powder` and `lakadong-turmeric-powder` to reference these paths (replacing unsplash placeholders).
- Image fit: spices now use `object-contain` (ProductCard + ProductDetail) so the full pouch shows on the ivory-warm container; cashew/oils unchanged (`object-cover`/existing).
- Verified on preview: both images serve 200, display correctly on cards + detail pages, blend into ivory bg. Prices, descriptions, ordering, cashew image untouched. REDEPLOY required to serve on amyafoods.in.

## Changelog — 2026-07-10 (Spice image fit fix + cashew "Most popular" tag)
- Chilli/turmeric pouches were cropping on hover (group-hover scale-105 inside overflow-hidden). Fixed: spice images now `object-contain object-center` with balanced padding (cards p-4 sm:p-6; detail p-6 sm:p-10), no hover-zoom — full pouch + label always visible on mobile and desktop, on ivory-warm bg. Cashew/oils keep object-cover; pickles unchanged.
- Added subtle gold "• Most popular" tag above the Cashew Brittle title (ProductCard, slug-gated to cashew-brittle). data-testid="most-popular-tag".
- Verified on preview (cards + detail pages for both spices). No prices/descriptions/logo/functionality changed.

## Changelog — 2026-07-10 (Restore Oils section — regression fix)
- Root cause: homepage-redesign commit 6c5994d removed the "/shop/oils" nav link and dropped oils from the homepage (oils products were never deleted — still in DB and at /shop & /shop/oils).
- Restored "Oils" link in Header NAV (shows on desktop + mobile menu, between Cashew Brittle and Contact) → /shop/oils.
- Added an "AMYA Oils." section to the homepage (data-testid="oils-section") mirroring the pickles section: all 4 oils (Groundnut, Sesame, Coconut, Sunflower) with COMING SOON badges + "Enquire for launch updates". Pickles section bg switched beige→ivory for alternation (oils=beige).
- Chilli/turmeric object-contain images and all other categories untouched. Verified on preview (nav + homepage oils grid).

## Changelog — 2026-07-10 (Homepage section reorder)
- Reordered homepage product sections to exact sequence: Cashew Brittle → AMYA Oils → Signature Spices (Guntur Sannam chilli, then Lakadong turmeric) → Traditional Pickles.
- Split the old combined "featured" grid: section 1 now shows only Cashew Brittle (eyebrow "Our signature"); added a dedicated "Signature Spices." section (data-testid="spices-section") between Oils and Pickles for chilli + turmeric.
- Backgrounds alternate ivory/beige/ivory/beige. Nav, footer, products, prices, images (gold cashew box, object-contain chilli/turmeric pouches), pickle mockups and WhatsApp CTAs all unchanged. No duplicated sections. Verified DOM order + preview screenshot.

## Changelog — 2026-07-10 (Removed "Perfect for gifting" badge)
- Removed the "Perfect for gifting" badge (and its isGift logic) from ProductDetail.jsx pack-size buttons — the only place it appeared. Applies to all products (cashew, oils, chilli, turmeric, pickles) on desktop + mobile.
- Badge was absolutely positioned, so removal leaves no empty space. Pack sizes, prices, quantity, totals, descriptions and WhatsApp ordering unchanged. Verified: no "gifting" references remain in src; DOM check confirms tag absent.

## Changelog — 2026-07-10 (Mobile product card refinement)
- Compact cards: image containers reduced to aspect-[5/6] (cashew keeps aspect-[4/5] as the prominent full-width signature card). All sections 2-col on mobile, tighter gaps, bottom-aligned buttons (h-full + mt-auto), responsive title text.
- Oils: switched to object-contain + p-4/p-6 padding so bottles are smaller, fully visible and centered (photo cream bg ≈ ivory-warm, blends). COMING SOON badge top-left no longer overlaps the bottle.
- PicklePackMock simplified: single lid (removed second choco bar), removed jar-body border + label gold border (no duplicate borders), bg solid ivory-warm, jar shrunk to 52%/max-136 with pt-9 top clearance so the COMING SOON badge sits clear above the jar. Names rendered uppercase.
- Availability badge made more compact (px-2.5, responsive text/tracking, rounded-sm). WhatsApp CTA buttons slightly smaller (py-2/2.5, text-[9px]/[11px]). Pickle descriptions line-clamp-2.
- Verified on 390px mobile: cashew, oils x4, chilli, turmeric, pickles x6 — no overlap, no horizontal scroll (scrollWidth=390=viewport), branding intact. Logic/WhatsApp links unchanged.

## Changelog — 2026-07-10 (Our Story refinement)
- OurStory.jsx: removed "traditional wooden chekku oil-pressing experience you can watch live" from the story paragraph; reworded to focus on handcrafted small-batch homemade food, carefully chosen ingredients and traditional recipes.
- Replaced the elderly-woman founder photo (FOUNDER_IMG) with a premium editorial image of herbs + red chillies in a rustic bowl on warm wood (Unsplash photo-1769424052115) — no identifiable people, warm earthy tones matching brand. alt text updated. Kept the existing aspect-[4/5] rounded container + object-cover (no empty space/cropping).
- Unchanged: Amulya Nimmala · M.Tech eyebrow, "A simple goal." heading, call/WhatsApp buttons, all product sections/images/prices, AMYA Oils section. Chekku references elsewhere (About/LivePress/Transparency) left as-is since out of Our Story scope. Verified desktop + mobile.
