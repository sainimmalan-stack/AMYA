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

## Kaju Bites product image (2026-10-13l) — preview only, NOT yet published
- Generated a premium photorealistic Kaju Bites product image from the user's reference photo: clear ~250ml transparent glass jar, matte black lid, realistic handmade golden-brown jaggery-coated cashew clusters, small proportionate terracotta AMYA label (AMYA / ARTISANAL FOODS / KAJU BITES), warm ivory+terracotta studio, 3/4 elevated angle, few bites beside, square 1:1.
- Wired into kaju-bites product (images ["/products/kaju-bites.jpg?v=1"], added to FORCE_IMAGE_SLUGS). Availability "available" with no pack_sizes/price -> renders as enquire-only ("Enquire for price and pack sizes" + WhatsApp). No invented weight/price.
- Verified card renders on /shop/cashew-brittles (Artisanal Sweets). No other changes.


- Replaced recipe_story on ALL 6 pickles (chicken, mutton, prawn, allam-sweet, avakai, maagai) with a single legacy story: heading "A LEGACY OF FLAVOUR, FROM MOTHER-IN-LAW TO DAUGHTER-IN-LAW" + body "Inspired by Leela's 30+ years of cooking experience, our pickles bring the authentic taste of Andhra family traditions to your table — lovingly prepared and shared through AMYA." Eyebrow stays "Recipes with a story" (renders uppercase).
- Podi/spice/oil/cashew recipe_story untouched (Nuvvula still "LEELA'S TRADITIONAL RECIPE"). Names, ingredients, prices, pack sizes, stock status and serving suggestions all unchanged.
- pd-recipe-story card made compact: mt-5->mt-4, py-4->py-3.5, heading text-lg/sm:xl -> text-base/sm:lg + leading-snug + [text-wrap:balance] so the long heading wraps neatly and stays smaller than the product title.
- Verified Maagai Pickle on mobile: story displays correctly, compact, neat wrap, out-of-stock preserved.


- Top eyebrow line -> "Made to order · Prepared in small batches" (reduced mobile tracking 0.28em->0.16em for natural wrap).
- Hero description replaced with the Andhra pickles/podis/spices/cashew "made to be shared" copy; mobile size 17px->15px to avoid excess height. Headline "Tradition You Can Taste." unchanged.
- Primary CTA "Shop Our Collection" changed from Link to /shop -> button that smooth-scrolls to the on-page product collection (#collection). Secondary CTA "Our Story" unchanged (-> /our-story).
- Brand strip -> "Traditional Recipes · Made to Order · Pan-India Delivery" (pan-India retained; domestic courier dispatch supports this).
- Copy/behaviour only. Design, logo, colours, fonts, buttons, images and all other sections unchanged. Verified mobile incl. CTA scroll.


- Renamed nav labels: "Cashew Brittle" -> "Artisanal Sweets", "Spices" -> "Spices & Podis" (Header NAV, homepage category chip, and cashew category page title). Links/category/URLs unchanged (still /shop/cashew-brittles, /shop/spices).
- Nav order: Home, Our Story, Spices & Podis, Pickles, Artisanal Sweets, Oils, Contact.
- Mobile menu made compact/premium: link font text-4xl->text-3xl, removed inter-item gap, subtler dividers (ivory/15->ivory/10), menu header h-20->h-16, Call/WhatsApp buttons py-3->py-2.5 pill rounded, added overflow-y-auto. Fits iPhone without scrolling. Serif/ivory/terracotta preserved.
- Added slugify() for clean data-testids (nav-spices-podis, mobile-nav-artisanal-sweets, etc.). Functionality/destinations preserved.


- TASK 1: Rewrote OilRefillOffer into ONE compact card (heading + two short icon lines for the ₹60 refill & ₹60 return benefits + combined "Hyderabad only — message before visiting" line + WhatsApp button). Much shorter on mobile; oil products appear sooner. Both benefits retained.
- TASK 2: Oils show only "1 litre" (seed override already enforced; also cleaned dead 500ml refs in INITIAL_PRODUCTS). Verified API returns ['1 litre'] for all 3 oils.
- TASK 3: Shortened the "AMMU'S PICKLE SPECIALITIES" recipe_story body (chicken/mutton/prawn) to the exact short copy; tightened pd-recipe-story padding (px-5 py-5 -> px-4 py-4, smaller heading).
- TASK 4: Added a subtle "Serving Suggestion" section (exact sentence "Best enjoyed with hot rice and a generous spoon of ghee.") on all 6 pickles + 3 podis (Nuvvula/Karivepaku/Nallakaram) via frontend logic (category==='pickles' || podi slug). Suppressed the old "How to enjoy" block for those to avoid duplication. NOT shown on spices/garam masala/oils/cashew.
- Strict change control respected: no new/changed images, logos, labels, prices, stock, checkout. Responsive verified (mobile).


- ISSUE 1: Removed the entire "PRE-LAUNCH / Online checkout isn't active yet…" notice block from ProductDetail.jsx (gone on ALL product pages, no reserved gap). Also removed the now-unused `checkoutEnabled` var.
- ISSUE 2: Cleaned oil descriptions/short-descriptions of unverified claims ("our own oil-/cold-extraction setup", "cold-extracted") for Groundnut, Sesame, Coconut; cleared each oil's `extraction_method` to "". Also fixed Shop.jsx oils hero eyebrow/sub ("cold-extracted … using our own setup" removed).
- ISSUE 3: Removed the "Extraction method" accordion from ProductDetail.jsx (only oils populated it, so effectively oil-only). Description/Ingredients/Storage/Delivery/Returns/Food-Label sections preserved.
- Verified (mobile, /product/groundnut-oil): no pd-prelaunch, no "Extraction", no "our own", no "pre-launch", clean accordion with no gaps. Prices/availability/images unchanged. No payment gateway touched.


- ISSUE 1: Compacted the OilRefillOffer promo card on mobile — reduced outer padding (py-7->py-5), heading/desc margins (mt-2->1.5), grid gap/margin (gap-4 mt-6 -> gap-3 mt-4), sub-card padding (py-5->py-4), bottom margin (mb-8->mb-6). Wording/colours/offers unchanged.
- ISSUE 2: Oils now show ONLY "1 litre" — seed oil pack override (server.py ~L856) changed from [500 ml, 1 litre] to [1 litre]. Affects cards, detail pages and selectors. Pickle/spice/podi quantities untouched.
- ISSUE 3: Pickle glass was reading as CLEAR (amber came only from contents). Regenerated all 6 with a new master jar that has thick DARK GOLDEN-BROWN AMBER GLASS visible in the empty headspace/neck/shoulders/walls (not just contents). master+edit approach for consistency; cache bumped to ?v=5. Availability/prices preserved (Avakai/Maagai out-of-stock). Spice pouches, podi, oils, cashew images untouched.
- Verified on mobile (390px): compact card, "1 litre" only (no "500 ml"), six consistent amber jars.


- Added an elegant terracotta/ivory promo card (`OilRefillOffer.jsx`) at the top of the oils section on /shop/oils only: "Bring Your Own Bottle & Save ₹60" with two distinct blocks — Refill & Save (₹60 bottling-charge saving) and Return Your AMYA Bottle (₹60 refund), clearly separated.
- Hyderabad-only; "Contact Us on WhatsApp" button → wa.me/919675334567 (pre-filled msg); fine print: message before visiting + not auto-applied to online orders. No business address shown.
- Oil prices/availability unchanged; oils stay at bottom of catalogue; no other section/design changed. Verified desktop + mobile (390px).


- Regenerated all 6 pickle images to ONE consistent amber jar using a master-jar + edit approach: a single straight-sided rich dark-amber glass jar, same glossy black screw cap, same terracotta AMYA square label (AMYA / ARTISANAL FOODS / divider / pickle name, no invented claims), same ivory-linen background, same straight-on angle and lighting. Only the contents + product-name differ per product.
- Contents: Chicken (boneless chicken), Mutton, Prawn (curled prawns), Allam Sweet (ginger+jaggery), Avakai (mango cubes+mustard), Maagai (cut mango). Glass is clearly amber yet pickle remains visible.
- Cache bumped to ?v=4 (seed loop). Availability/prices/descriptions/cart unchanged: Chicken/Mutton/Prawn/Allam available; Avakai/Maagai OUT OF STOCK (not orderable).
- Verified desktop + mobile (390px, 2-col grid): uniform jar size/shape/cap, correct gating (4 Add-to-Cart, 2 Currently Unavailable), correct From-prices (₹400/₹500/₹600/₹200). Oils and spice/podi packaging untouched.


- **Oil bottles regenerated** from the user's actual bottle reference photo (IMG_9509): tall SQUARE amber-glass bottles with flat sides, defined corners, short neck and ribbed black screw cap, warm golden highlights — Groundnut, Sesame, Coconut. Clean warm-neutral studio backgrounds, AMYA terracotta label with correct oil name. Cache bumped to ?v=3.
- **Sunflower Oil removed completely**: product block deleted from INITIAL_PRODUCTS, removed from FORCE_IMAGE_SLUGS, image file deleted; delete_many drops it from DB (total products 20 -> 19). GET /api/products/sunflower-oil = 404; no references anywhere in code/data; no broken links.
- Oil section stays last; other oils' prices/capacities/availability unchanged (all coming-soon, not orderable). No checkout/payment changes.
- Verified desktop + mobile (390px): 3 oil cards aligned/responsive, bottles render, logo intact.
- NOTE: earlier label-shrink request (Task 3 of prior round) on the 6 REAL approved photos was left pending the user's decision (brand-safety); Cumin/Coriander labels already fixed + slightly smaller.


- **Pickle prices verified correct** on preview (no change needed; already matched): Chicken 400/750/1400 (in-stock), Avakai 200/300/500 (out-of-stock), Maagai 200/300/500 (out-of-stock), Allam 200/300/500 (in-stock), Mutton 500/900/1700 (in-stock), Prawn 600/1000/1900 (in-stock). "From ₹" and cart totals confirmed accurate (Prawn 1kg x2 = ₹3,800). NOTE: live amyafoods.in still shows old data until deployed.
- **Oil images regenerated** as distinctly SQUARE amber glass bottles with black caps (previous versions looked tall/narrow). Cache bumped to ?v=2. Oils remain coming-soon / not orderable, kept at end.
- Catalogue consistency re-checked: 20 products, no duplicates, correct order, all images 200 (Kaju Bites intentionally image-less placeholder).

## Brand-story & policy round (2026-10-13) — preview only, NOT yet published
- **Made-to-order philosophy**: new homepage section "Prepared With Care, After You Order" (id `prepared-with-care`) + short "Made to order, with care" note near the order button on every orderable product page (third-day = prep+dispatch, distinct from carrier delivery).
- **Family story**: homepage "The Heart Behind AMYA" (Amulya/Ammu + Leela) with closing line, honest/non-exaggerated copy.
- **Ingredient sourcing**: "Good Food Starts With Good Ingredients" block integrated into the family section (Leela sources raw materials across India; no invented suppliers/farms/certs).
- **Recipes with a story**: homepage 3-card summary + per-product `recipe_story` (backend field) on detail pages with correct attribution — Leela: Nuvvula Podi, Avakai, Magai; Ammu: Chicken/Mutton/Prawn pickles; Ammu's Ammamma: Sweet Allam Pickle. Products without a story omit the block.
- **Refund & Replacement Policy**: new page `/refund-policy` (AMYA Quality Guarantee — 24h window for damaged/incorrect, quality + food-safety concerns, 4-step resolution, WhatsApp CTA, consumer-law safe wording). New `RefundPolicy.jsx`, route in App.js.
- **Quality Promise**: compact "The AMYA Quality Promise" block on every product page linking to /refund-policy (`pd-quality-promise` / `pd-refund-link`).
- **Footer**: added Prepared with Care (`/#prepared-with-care`, hash-scroll in Home) and Refund & Replacement (`/refund-policy`); Our Story retained.
- Logo, palette, prices, images, availability, cart/WhatsApp flow all preserved. Verified: frontend 100% (iteration_17.json, 56 assertions).


- Renamed **Jeera Powder → Cumin Powder** (slug `cumin-powder`); no duplicate; pack sizes 250 g/500 g/1 kg, prices pending → "Enquire for price".
- Added **Cumin Powder** & **Coriander Powder** premium kraft-pouch AI mockups (distinct powder colours) matching chilli/turmeric/podi style.
- Regenerated all **6 pickle images** as AMBER glass jars + black cap (chicken, mutton, prawn, allam-sweet, avakai, maagai). Bumped cache `?v=3`.
- Regenerated all **4 oil images** as AMBER square 1L glass bottles + black cap (groundnut, sunflower, sesame, coconut); now local `/products/amya-*-oil.jpg`, added to FORCE_IMAGE_SLUGS.
- **Reordered** homepage grid via sort_order 0..19: Cashew Brittle, Kaju Bites, Pickles (Chicken, Mutton, Prawn, Allam, Avakai, Maagai), Podis/spices (Nuvvula, Karivepaku, Nallakaram, Garam Masala, Chilli, Turmeric, Cumin, Coriander), **Oils last**.
- Added pack sizes 250 g/500 g/1 kg (pending prices) to **Chilli & Turmeric** → enquire-only.
- Pickle availability preserved: Chicken/Mutton/Prawn/Allam = in-stock; Avakai/Maagai = out-of-stock (not orderable).
- Kaju Bites kept separate (transparent-jar copy retained; no invented weight/price/image).
- Verified: frontend testing 100% pass (iteration_16.json); all /products images 200; no "Jeera" remnants.
- PENDING user input: real prices for Chilli/Turmeric/Cumin/Coriander; real photos for Cumin/Coriander/pickles/oils; Kaju Bites final photo+weight+price. Cashfree NOT integrated (WhatsApp-only, per user).

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

## Changelog — 2026-07-10 (Catalogue compactness pass 2)
- Added xl:grid-cols-4 to Home product sections (oils/spices/pickles) and Shop grid → 2-col mobile / 3-col lg / 4-col xl for a tighter catalogue with less scrolling. Verified Shop desktop renders 4 columns.
- Reduced vertical spacing: Home product sections py-9→py-8 sm:py-11 lg:py-14; cashew section pt-7 pb-8; "how ordering" py-10 lg:py-12; "Why AMYA" py-11 lg:py-14 (mb-10→mb-8, gap-8→gap-6); About+Contact py-11 lg:py-14. Shop section py-10 sm:py-14 lg:py-20.
- All prior compact-card work retained (aspect-[5/6] cards, cashew aspect-[4/5] full-width signature, object-contain oils/spices with centered images, cleaned pickle mockups, compact COMING SOON badge top-left, line-clamp-2 descriptions, smaller WhatsApp buttons, no "Perfect for gifting").
- Verified: mobile 2-col no horizontal scroll (scrollWidth=390=viewport), desktop 4-col, badges clear of images, veg/non-veg marks intact, prices/availability/logo/colours unchanged.

## Changelog — 2026-07-10 (Added 2 new Signature Spices: Nuvvula & Karivepaku Podi)
- Added AMYA Nuvvula Podi (Traditional Sesame Powder) and AMYA Karivepaku Podi (Traditional Curry Leaves Powder) to the spices collection (seed INITIAL_PRODUCTS + DB via idempotent upsert).
- Product images created by EDITING the existing chilli pouch photo (image_generation_tool, gemini-3.1-flash-image) so packaging matches exactly: same clear zip-lock pouch, terracotta square label (AMYA / ARTISANAL FOODS / product name / subtitle), cream studio bg. Only the powder (sesame=toasted golden-brown; curry-leaf=greenish-brown) and label text changed. Saved to /app/frontend/public/products/amya-nuvvula-podi.jpg and amya-karivepaku-podi.jpg.
- Fields: category=spices, diet=veg, featured=true, availability="enquire" (Signature Spice badge + "Enquire on WhatsApp"; NOT purchasable, no invented prices/weights/ingredients), pack_sizes=[]. sort_order 8 & 9 (after chilli 6, turmeric 7). Pickles renumbered to 14-19 to keep catalogue grouped on /shop.
- Descriptions + serving suggestions from user (hot rice & ghee / idli & dosa). Verified desktop (4-across) + mobile (2-col, no horizontal scroll) + detail page. No unrelated products/prices/images changed.

## Changelog — 2026-07-10 (Added AMYA Nallakaram spice)
- Added AMYA Nallakaram (Traditional Andhra Spice Powder) to spices collection. Image created by editing the chilli pouch photo (gemini-3.1-flash-image): same pouch/terracotta label/cream bg, powder = dark reddish-brown coarse nallakaram podi, label "AMYA / ARTISANAL FOODS / NALLAKARAM / TRADITIONAL ANDHRA SPICE POWDER". Saved /app/frontend/public/products/amya-nallakaram.jpg.
- Fields: spices, diet=veg, featured=true, availability="enquire" (Signature Spice, Enquire on WhatsApp, not purchasable, no invented prices/ingredients), pack_sizes=[], sort_order 10 (after karivepaku 9; pickles remain 14-19).
- Verified: DB + image 200, mobile 2-col card consistent with chilli/turmeric/podis, no horizontal scroll. No unrelated products/packaging changed.

## Changelog — 2026-07-10 (Availability restructure + turmeric origin fix)
- AVAILABILITY: set 6 products to "available" (Cashew, Nuvvula Podi, Karivepaku Podi, Nallakaram, Guntur Sannam Chilli, AMYA Turmeric). Oils + pickles remain "coming-soon" (enquiry-only CTA "Enquire for launch updates", no buy/order button). Availability badge "Available" relabelled to "Available to order".
- HOMEPAGE restructured (Home.jsx OurCollection) from category sections to availability sections: "Shop Our Products." (subtitle "Discover handcrafted favourites from AMYA.") lists available products via explicit AVAILABLE_ORDER [cashew, nuvvula, karivepaku, nallakaram, chilli, turmeric]; then "Coming Soon." (subtitle "More of AMYA is on its way.") lists non-available (oils+pickles) by sort_order. 2/3/4-col responsive grid.
- TURMERIC rename: slug lakadong-turmeric-powder → amya-turmeric-powder, name "AMYA Turmeric Powder", origin "Srikakulam, Andhra Pradesh, India". Removed all Meghalaya/Lakadong refs from DB (desc/highlights/ingredients/food_label), Shop.jsx category sub, index.html meta+og. Regenerated pouch image (edited old one) → label now "AMYA / ARTISANAL FOODS / TURMERIC POWDER", saved /products/amya-turmeric-powder.jpg. Old lakadong slug auto-removed by seed delete_many.
- Cashew pricing preserved (500g ₹500 / 1kg ₹900). No invented prices/pack sizes for podis/chilli/turmeric (WhatsApp order/enquiry used). Verified: 6 available cards w/ Order on WhatsApp, coming-soon enquiry-only, turmeric detail shows Srikakulam & no Meghalaya/Lakadong, mobile 2-col no horizontal scroll, desktop section order correct.

## Changelog — 2026-07-10 (Pre-order model + podi serving suggestions)
- Added homepage pre-order band (data-testid="preorder-band") before product listings: eyebrow "Pre-order · small batch", heading "Small Batches. Unforgettable Taste.", the limited-quantities description and the brand-confidence line (verbatim from brief).
- Availability badge "Available to order" -> "Available for pre-order"; Shop Our Products eyebrow + added note "Made in limited quantities. Place your enquiry or pre-order to check availability."
- Added model fields `serving` + `serving_highlight` (Product + ProductIn). Updated 3 podis (seed+DB): new short_description/description per brief; serving = how-to-enjoy; serving_highlight = "Best enjoyed with very hot rice + ghee" (all 3). Nallakaram renamed to "AMYA Nallakaram Podi" and its serving mentions dosa as an ADDITIONAL option alongside hot rice + ghee.
- ProductDetail: new prominent "HOW TO ENJOY" callout (data-testid pd-serving) below description/highlights and just above the order button — includes a terracotta flame pill with the hot rice + ghee highlight. Mobile compact.
- Cashew pricing (500g ₹500 / 1kg ₹900) and gifting description untouched; oils + pickles remain Coming Soon (enquiry-only). No invented prep times/dispatch/delivery/MOQ claims. Verified desktop + mobile (incl. Nallakaram detail).

## Changelog — 2026-07-10 (WhatsApp cart + availability/pack-size overhaul)
- Built persistent WhatsApp cart: CartContext (localStorage amya_cart_v1), CartDrawer (shadcn Sheet), header cart icon+badge. Add-to-cart on cards (quick-add first pack) and detail pages (full pack+qty). Dynamic wa.me/919675334567 message lists every item/pack/qty, subtotals only for priced items, grand total only when ALL priced (else "To be confirmed"). Tested by testing agent: iteration_12.json — all 10 scenarios (A-J) PASS.
- Cashew = availability "ready" (READY FOR DELIVERY), added 10 kg ₹8,500 variant (500g ₹500 / 1kg ₹900 kept). Podis/chilli/turmeric = "available" (pre-order). Oils + pickles = coming-soon (NOT addable; card shows "Coming soon", detail shows pd-coming-soon). Availability badge adds "ready" status.
- Pack sizes: podis 250g/500g/1kg (no price), oils 500ml/1 litre (no price), pickles 250g/500g/1kg (no price) via seed category normalization. No prices invented; null price shows "Enquire for price".
- Chilli storage tip = refrigerator wording. Podi serving texts updated per brief (highlight "Best enjoyed with very hot rice + ghee"; Nallakaram mentions dosa).
- Small cashew-page tweaks: removed "Best value ₹/g" note; removed the big product-name H1 on the cashew detail page only (name retained in nav/cards/cart/order message/metadata) — description now flows neatly under the category label.

## Changelog — 2026-10-10 (Homepage product ordering fix)
- Fixed: Cashew Brittles was missing from "SHOP OUR PRODUCTS" — the section filtered only `availability === "available"`, excluding Cashew (which is `"ready"`), so it fell into the wrong group. Updated Home.jsx OurCollection to include BOTH "ready" and "available" in the in-stock grid (IN_STOCK set), and "Coming Soon" now shows only the remaining (coming-soon) items.
- Explicit order enforced via AVAILABLE_ORDER: Cashew Brittle → Nuvvula Podi → Karivepaku Podi → Nallakaram Podi → Guntur Sannam Chilli → AMYA Turmeric Powder. Verified on mobile (390px) preview — Cashew first with READY FOR DELIVERY badge, active ADD TO CART, prices 500g ₹500 / 1kg ₹900 / 10kg ₹8500. No DB/image/price/cart changes. Oils + pickles stay Coming Soon (not addable).

## Changelog — 2026-10-10 (Confirmed podi prices + prep/dispatch/delivery info)
- Podis (Nuvvula/Karivepaku/Nallakaram): prices set 250g ₹250 / 500g ₹450 / 1kg ₹800 (seed + live DB). New availability status "order" → badge "Available to order" (distinct from chilli/turmeric "available" → "Available for pre-order"). Cart/WhatsApp calcs verified (1kg×2 = ₹1,600).
- Cashew: badge label changed "ready" → "Ready to order"; prices preserved (500g ₹500 / 1kg ₹900 / 10kg ₹8,500).
- New Product model fields: preparation, dispatch, delivery_details[{region,text}] (+ DeliveryRegion model). ProductDetail renders "PREPARATION & DISPATCH" (podis only) and "DELIVERY INFORMATION" (podis + cashew) blocks near ordering controls. Podi delivery: Hyderabad (may be possible 3rd day), Other India (dispatch 3rd day, no guaranteed date), USA&UK (subject to confirmation). Cashew delivery: Hyderabad same-day possible, Outside Hyderabad dispatch 2nd day, USA&UK subject to confirmation.
- Frontend "order" status wired into Home IN_STOCK set, ProductCard + ProductDetail orderable, Availability map. Oils/pickles remain coming-soon (not addable).
- WhatsApp cart note updated to: "Please confirm product availability, delivery location, shipping charges if applicable, and the expected delivery or dispatch date." Verified on mobile preview.

## Changelog — 2026-10-10 (Our Story image replacement)
- Replaced OurStory.jsx FOUNDER_IMG (old unsplash dark-bowl-of-herbs photo) with a newly generated premium editorial still-life (cashews, sesame seeds, dried red chillies, curry leaves, turmeric + chilli powder on ivory linen & natural wood). Portrait 848x1264 fits existing aspect-[4/5] container; brand palette aligned; no people/text/machinery/packaging. Founder text "AMULYA NIMMALA · M.TECH" and layout unchanged. Verified on desktop; object-cover renders same on mobile.

## Changelog — 2026-10-10 (Product card layout consistency + content tweaks)
- ProductCard: unified image container to aspect-[4/5] for ALL cards (was cashew 4/5 vs others 5/6) — all 6 image boxes now equal height (350px), so names/prices/availability badges/ADD TO CART buttons align consistently per row. Mobile 2-col grid (grid-cols-2 base) retained.
- Home "Shop Our Products" intro reworded to: "Small-batch products, prepared in limited quantities. Order or pre-order depending on availability."
- Chilli storage text -> "Refrigerate after opening to help preserve its colour and freshness." (seed + live DB). Turmeric origin confirmed "Srikakulam, Andhra Pradesh, India" (no Meghalaya/Lakadong).
- Layout.jsx floating WhatsApp FAB: overlap-hide detection broadened to also include [data-testid^='add-cart-'] and [data-testid='pd-add-cart'] so the FAB fades out whenever it would cover an Add-to-cart button. Verified on preview; image heights measured equal (350px x6).

## Changelog — 2026-10-10 (New product: AMYA Garam Masala)
- Added product "AMYA Garam Masala" (slug amya-garam-masala, category spices, availability "order" → Available to order). Packaging image generated by editing the turmeric packshot (same pouch/sticker/AMYA logo, label changed to "GARAM MASALA", warm-brown powder); saved to /app/frontend/public/products/amya-garam-masala.jpg.
- Pack sizes/prices: 250g ₹300 / 500g ₹550 / 1kg ₹1000 (no others). Description (verbatim): "AMYA Garam Masala — a traditional Indian spice blend crafted to bring warmth, aroma and depth to your everyday cooking." No invented ingredients/sourcing/health/cert/shelf-life claims. Same prep/dispatch/delivery blocks as other available-to-order spices.
- Home AVAILABLE_ORDER updated: Cashew → Nuvvula → Karivepaku → Nallakaram → Garam Masala → Chilli → Turmeric. sort_order 11.
- Verified on mobile: order, 3 prices, pack-size price switching (500g=₹550, 1kg×3=₹3,000), cart totals, WhatsApp message to 919675334567, card fits layout. No duplicate products.

## Changelog — 2026-10-10 (WhatsApp order reference code)
- CartContext: added auto-generated short order reference "AMYA-XXXXXX" (6 unambiguous alphanumeric chars). Persisted in localStorage (amya_cart_ref_v1), included as "Order reference: AMYA-XXXXXX" near the top of the WhatsApp order message. Rotates to a fresh code via newOrderRef() after the order is sent (Send on WhatsApp onClick) and on Clear cart.
- CartDrawer: shows "Order reference" row in the footer above Order total (data-testid cart-order-ref). Verified: drawer code matches WA message code, valid format. No backend changes.

## Changelog — 2026-10-10 (Homepage final mobile polish)
- Hero description replaced with: "Discover authentic Indian flavours through carefully selected ingredients, traditional recipes and handcrafted artisanal foods. Every batch is made with care, in limited quantities." Heading + Explore/Our Story buttons unchanged.
- Small-batch section: heading kept; first paragraph reworded to "At AMYA, we prepare our products in limited quantities, focusing on freshness, flavour and traditional recipes rather than mass production." Confidence line unchanged.
- Mobile vertical spacing reduced ~20% (hero pt-8/pb-8→pt-6/pb-6; pre-order band py-10→py-8; collection pt-7/pb-8→pt-5/pb-6). Desktop sm/lg spacing preserved.
- ProductCard: removed the green veg DietMark square from cards (+ removed unused import). Added prep note "Prepared in small batches. Dispatch on the third day." on availability=="order" cards (3 podis + Garam Masala). Buttons stay bottom-aligned (mt-auto); image heights consistent (aspect-[4/5]).
- Order/status/prices/cart unchanged. Verified on mobile preview: copy present, 0 diet marks, notes on 4 items, correct order.

## Changelog — 2026-10-10 (Chilli powder rebrand → AMYA Chilli Powder)
- Renamed product (slug kept as guntur-sannam-chilli-powder for URL stability) name "Guntur Sannam Chilli Powder (S4)" → "AMYA Chilli Powder". Flows everywhere via DB (homepage card, detail H1, cart, WhatsApp message). No "Guntur" in name/heading.
- Description replaced with "THE AMYA CHILLI BLEND" story (20% Guntur + 80% other varieties, 20-year blending tradition). Highlights: 20% Guntur chillies / 80% carefully selected red chillies / Balanced colour and flavour / A blending tradition spanning over 20 years. Ingredients: blend 20/80. Origin changed Guntur,AP → Andhra Pradesh, India. Storage: "Refrigerate after opening to help preserve the chilli powder's colour and freshness."
- Packaging image regenerated (edited existing) so sticker label reads "CHILLI POWDER" (removed "Guntur Sannam (S4)"), same pouch/logo/red powder; overwrote /app/frontend/public/products/guntur-sannam-chilli-powder.jpg (DB path unchanged).
- ProductDetail description AccordionContent now uses whitespace-pre-line so multi-paragraph descriptions render properly.
- No health claims; 20/80 proportions preserved; availability/prices/pack-sizes/cart unchanged; other products untouched. Verified on mobile preview.

## Changelog — 2026-10-10 (Homepage conversion polish: remove band, simplify product section)
- Removed the "Small Batches. Unforgettable Taste." pre-order band section from Home (repetitive with hero; pushed products down). Hero now flows directly into the product section.
- Product section header simplified: eyebrow "Shop AMYA", heading "Our Products", single description "Authentic flavours. Carefully crafted in small batches." (removed the two extra intro paragraphs). data-testid shop-products-section retained.
- Availability "order" badge label changed "Available to order" → "Made fresh · Dispatch in 3 days" (podis + Garam Masala). Cashew stays "Ready to order"; Chilli/Turmeric stay "Available for pre-order". Removed the now-redundant on-card prep note.
- Order unchanged (Cashew first via IN_STOCK incl. "ready" + AVAILABLE_ORDER). Prices/pack sizes/images/cart/WhatsApp/availability untouched; Our Story page+nav preserved. Verified on mobile preview.

## Changelog — 2026-10-10 (Unified explicit product ordering across homepage + Shop)
- sort_order is now the single source of truth for display order on ALL surfaces. Backend seed sort_order reassigned: Cashew 0, Nuvvula 1, Karivepaku 2, Nallakaram 3, Garam Masala 4, AMYA Chilli 5, Turmeric 6, Groundnut Oil 7, Sesame 8, Coconut 9, Sunflower 10, Avakai 11, Maagai 12, Allam 13, Chicken 14, Mutton 15, Prawn 16. (Applied via ordered Python script with count==1 assertions.)
- Home OurCollection rewritten: removed availability-based filtering (IN_STOCK/AVAILABLE_ORDER) and the separate "Coming Soon" section. Now renders ALL products in one grid sorted by sort_order — identical to Shop.jsx (which already renders backend order). Availability no longer determines display order; all products (ready/order/available/coming-soon) stay visible with accurate badges.
- Backend GET /products sorts by sort_order, so homepage and /shop ("Explore Our Collection") show the exact same sequence. Prices/pack sizes/images/cart/WhatsApp untouched. Verified: homepage (mobile) and /shop (desktop) both list the 17 products in the required order, Cashew first, podis+spices before oils before pickles.

## Changelog — 2026-10-11 (Homepage content + product naming + badge/description refinements)
- Hero paragraph replaced (spices/recipes/sweets/oils copy). OUR STORY button already outlined (variant="outline") vs solid Explore button — no change needed.
- Re-added "Small Batches. Unforgettable Taste." section (was removed earlier) with new paragraph, placed BELOW the product grid so products still appear right after the hero. data-testid small-batch-section.
- Product names: removed "AMYA " prefix from Nuvvula/Karivepaku/Nallakaram Podi, Chilli Powder, Turmeric Powder, Garam Masala (DB name field → flows to cards, detail, cart, WhatsApp). Oils/pickles already had no prefix.
- Removed the "MADE FRESH · DISPATCH IN 3 DAYS" overlay badge from "order" products (ProductCard hides Availability overlay when status=="order"). Added compact note below price on those cards: "Prepared fresh against your order · Dispatch on Day 3." Other statuses keep their overlay badge (READY TO ORDER / AVAILABLE FOR PRE-ORDER / COMING SOON).
- Podi+Garam prep wording updated in detail blocks: preparation "Prepared fresh against your order. Please allow 2 days for preparation.", dispatch "Dispatch on Day 3.", Hyderabad delivery "Hyderabad delivery may be available on Day 3, subject to delivery location and order timing." Prices unchanged (podis 250/450/800; garam 300/550/1000).
- Cashew: new description (Hyderabad same-day / outside 2nd-day courier / intl enquiries); REMOVED 10 kg pack — now only 500g ₹500 and 1kg ₹900. Oils untouched (coming-soon, no prep message). Verified on mobile + detail page.

## Changelog — 2026-10-11 (Remove status badge overlays except Coming Soon)
- ProductCard: Availability overlay now renders ONLY when availability=="coming-soon". Removed overlays for ready/order/available (Cashew "READY TO ORDER", podis/garam, Chilli/Turmeric "AVAILABLE FOR PRE-ORDER"). Images now clean/unobstructed with AMYA logo visible.
- ProductDetail: same — availability overlay on the product image only for coming-soon.
- Prep/dispatch info retained in card description note + detail-page blocks (not overlaid). Names/prices/descriptions/images/Add-to-Cart unchanged. Coming Soon preserved for oils & pickles. Verified on mobile homepage; applies to collection + detail via shared components.

## Changelog — 2026-10-11 (Hide prices on product cards)
- ProductCard pack-size line now renders labels only (e.g. "250 g · 500 g · 1 kg"; cashew "500 g · 1 kg") — removed ₹/prices from cards. Shared component → applies on homepage + collection consistently. Prices still shown on ProductDetail pack-size selector + totals (unchanged). No DB/price/pack/image/description/cart changes. Verified on mobile (no ₹ in card section).

## Changelog — 2026-10-11 (Product card premium redesign)
- ProductCard refined for a consistent premium look: reduced packshot padding (p-4/p-6 → p-2.5/p-3) to cut empty space while keeping full image + AMYA label (object-contain, no crop). Uniform aspect-[4/5] rounded-xl containers retained.
- Consistent layout per card: image → name (serif, prominent) → pack sizes (small, "250 g · 500 g · 1 kg") → subtle "From ₹X" (min pack price, data-testid from-price-<slug>) → short prep note (order status only) → Add to Cart.
- Prep note shortened to "Freshly prepared to order · Dispatch on Day 3" (podis + Garam only; Cashew excluded). Removed the "Most popular" promo tag for layout consistency. Coming Soon overlay retained for oils/pickles only.
- Prices shown subtly on cards as "From ₹…" (not hidden) and remain full on detail pages / pack selector. No product data invented; Chilli/Turmeric (no configured prices) show no From line. No prices/pack/images/descriptions/ordering changed. Verified on mobile.

## Changelog — 2026-10-11 (Hero copy + The AMYA Difference trust section)
- Hero heading → "Tradition You Can Taste. / Quality You Can Trust." (MaskedLines 2 lines). Description replaced with 2 concise paragraphs (space-y, text-sm/base) to stay compact on mobile. Eyebrow + Explore (solid) / Our Story (outline) buttons unchanged.
- Added compact "THE AMYA DIFFERENCE" trust band between Hero and products (data-testid amya-difference): 4 points (ChefHat/Leaf/Package/Clock icons) — Traditional Recipes, Carefully Selected Ingredients, Small-Batch Preparation, Made Fresh to Order ("dispatch typically on Day 3 where applicable"). grid-cols-2 mobile / 4 desktop. No invented reviews/awards/claims.
- Product section (Shop AMYA / Our Products / subtitle) and cards already compliant (status banners removed, names w/o AMYA, weights shown, "From ₹…" price, prep in description, working cart). Verified hero + trust + products on desktop & mobile.

## Changelog — 2026-10-11 (Hero + trust copy tightening, mobile conversion)
- Hero description shortened to 2 concise paragraphs ("Discover the flavours of India with AMYA..." / "Made in small batches..."). Heading/eyebrow/buttons unchanged.
- THE AMYA DIFFERENCE shorter copy: Traditional Recipes "Familiar Indian flavours inspired by tradition."; title "Carefully Selected Ingredients"→"Selected Ingredients" "Chosen for flavour, aroma and quality."; Small-Batch "Prepared in limited quantities with care."; Made Fresh to Order "Prepared to order, with dispatch typically on Day 3 where applicable."
- Mobile spacing reduced: hero container pt-6/pb-6→pt-4/pb-5; button block mt-5→mt-4; trust band py-8→py-7 (desktop lg values preserved). Products reachable sooner (hero image hidden <lg). No price/weight/image/cart changes. Verified desktop + mobile.

## Changelog — 2026-10-11 (Cashew Brittle detail page conversion polish)
- Cashew short_description → persuasive copy: "A little sweetness. A lot of crunch.\n\nMade in small batches with premium cashews and jaggery... festive gifting, sharing..., or enjoying as your own special treat." (jaggery accurate per ingredients). Accordion description generic opener removed → "Made in small batches with premium cashews and jaggery for a rich caramelised crunch. + delivery lines".
- ProductDetail: added order-confidence microcopy below purchase buttons (data-testid pd-confidence-note) "Freshly prepared to order · Dispatch typically on Day 3" shown for availability in {ready, order} (cashew + podis/garam; excluded chilli/turmeric to avoid inventing a schedule). Small elegant text, not an image badge.
- PRE-LAUNCH notice now hidden for orderable products (condition `!checkoutEnabled && !orderable`) — removes conflicting pre-launch messaging on cashew/podi/garam/chilli/turmeric pages; still available for coming-soon.
- Pack selector unchanged (two-option, terracotta active, 500g ₹500/10pc, 1kg ₹900/20pc). Cart/qty/price calc intact. Verified on mobile: desc, packs, totals (₹500/₹900), microcopy, no pre-launch.
- NOTE: microcopy "Day 3" is general; cashew Delivery Information block still states Hyderabad same-day / outside 2nd-day (owner's exact wording kept for both).

## Changelog — 2026-10-11 (Compact premium pack selector + Cashew 10kg re-added)
- ProductDetail pack selector redesigned compact: flex flex-wrap, flex-1 min-w-[84px] equal-width cards in one row (wrap only if needed); reduced padding (py-3.5→py-2) and fonts (label text-xl/2xl→base/lg, price text-lg/xl→sm/base, note →[9px]). Selected = terracotta bg / ivory text; unselected = bg-ivory-warm, border-beige, text-ink. Applied to ALL products via shared component.
- Cashew Brittle pack_sizes: re-added 10 kg — now 500 g ₹500 (10 pieces), 1 kg ₹900 (20 pieces), 10 kg ₹8,500 (200 pieces). 10kg exists ONLY on cashew; no other product changed. Card "From ₹" stays ₹500 (min). Homepage card weights now "500 g · 1 kg · 10 kg".
- Verified mobile: cashew 3 options one row, 10kg total ₹8,500; podi 3 options (250/500/1kg) total ₹800, no 10kg. Price/total/cart calculations correct; legible, no clipping.

## Changelog — 2026-10-11 (Nuvvula Podi page refinement + serving box cleanup)
- Nuvvula Podi: short_description → "Bring home the comforting taste of traditional Andhra cooking with AMYA Nuvvula Podi. This sesame-based podi pairs beautifully with hot rice and ghee, making everyday meals feel special." Benefit #3 → "A familiar, home-style flavour". serving → "Enjoy with hot rice and ghee, or serve alongside idli and dosa."; serving_highlight cleared.
- ProductDetail "How to enjoy" box redesigned (shared component): now cream (bg-ivory-warm, border-beige) with small heading + body text only — removed the duplicate terracotta serving-suggestion button + Flame icon (import removed). Applies consistently to all products with a serving note.
- Tightened mobile spacing: highlights mt-4→mt-3 (gap-2→1.5), serving box mt-5→mt-4 (py-4→py-3), pack size mt-5→mt-4. Prices/packs/qty/cart unchanged. Verified Nuvvula on mobile.

## Changelog — 2026-10-11 (Homepage hero + spacing + trust-section refinement)
- Hero: eyebrow → "Authentic Indian flavours · Made with care"; headline single line "Tradition You Can Taste." (MaskedLines 1 line); description → single new paragraph ("Discover AMYA's signature cashew brittles..."). Primary button text → "Shop Our Collection →" (solid, to /shop); secondary "Our Story" → new subtle Btn variant (text-ink-soft, no border/bg). Hero padding pt-4/pb-5→pt-3/pb-4 (lg 16→14).
- THE AMYA DIFFERENCE trimmed to exactly 3 items (removed "Made Fresh to Order" + Clock import): Traditional Flavours / Carefully Selected Ingredients / Small-Batch Preparation with new concise copy. Grid lg:grid-cols-4→lg:grid-cols-3 (2-col mobile), padding py-7→py-6, gaps tightened.
- Our Products: heading-to-grid gap mb-6/8→mb-4/6, section padding pt-5/pb-6 sm:py-11→pt-6/pb-6 sm:py-10, subtitle mt-3→mt-2. Btn.jsx: added `subtle` variant. Product cards/prices/packs/cart/links unchanged. Verified on mobile; primary CTA → /shop.

## Changelog — 2026-10-11 (Final homepage polish + Nuvvula blank-image bug fix)
- BUG FIX: Nuvvula Podi (and all non-pickle) product images appeared blank on mobile due to lazy-loading timing. ProductCard now: eager-loads first-row images (loading=index<4?eager:lazy), decoding="async", and uses React state (imgError) to show an AMYA text placeholder on genuine load failure (no blank/broken box). Verified by testing_agent (iteration_13.json): all 7 non-pickle images render naturalWidth>0 on mobile+desktop; pickles intentionally use CSS PACKAGING CONCEPT mockup.
- Hero compacted ~15-20% more (eyebrow mb-2.5, para mt-2.5/3.5, buttons mt-3/5). The AMYA Difference: 3rd item spans full width on mobile (col-span-2 lg:col-span-1) so it's not isolated; section pt-6/pb-5; product section pt-5 to reduce gap. Btn subtle variant used for Our Story.
- Verified (testing_agent, frontend, ALL PASS): hero-shop-btn→/shop, hero-story-btn→/our-story, 3 AMYA Difference items, no FAB/text overlap, cart wa.me/919675334567, Cashew 3 packs (500g ₹500/1kg ₹900/10kg ₹8,500). No prices/packs/cart/links changed. Non-blocking notes: console scroll warning, 3rd-party asset 401, Radix aria-describedby.

## Changelog — 2026-10-11 (Homepage copy tightening)
- Hero: removed the repetitive 2nd sentence ("Made in small batches and inspired by the flavours of home"); kept the concise single supporting sentence. Headline + Shop Our Collection (solid) + subtle Our Story unchanged.
- The AMYA Difference: benefit #1 title "Traditional Flavours"→"Traditional Recipes" with line "Familiar Indian flavours for everyday meals." (3 compact items, 3-col desktop / 2-col mobile retained).
- Our Products supporting line punctuation: "Authentic flavours. Carefully crafted..." → "Authentic flavours, carefully crafted in small batches."
- NOTE: compact product cards, refined pack-size tiles, Cashew 10kg (₹8,500), consistent aspect-[4/5] image containers, eager-load image fix — all implemented in prior iterations and verified by testing_agent (iteration_13); unchanged here. No price/pack/cart/link changes. Verified on mobile.

## Changelog — 2026-10-11 (Compact product-card image height)
- ProductCard image container aspect-[4/5] → aspect-square (uniform ~280px on mobile) so images are less dominant and name/price/pack sizes sit within view. Card text padding pt-3/pb-3 → pt-2.5/pb-2.5. Cashew (object-cover) and spice pouches (object-contain) share identical square containers → matching heights + aligned text, no distortion, labels preserved.
- Verified mobile (390px): image boxes all 280px, no horizontal overflow, name + "From ₹..." + pack sizes visible below image, Add-to-Cart aligned. Pack selectors / Cashew 10kg / cart unchanged (verified earlier). No price/pack/image/data changes.

## Changelog — 2026-10-11 (Homepage restructure + catalogue correctness)
HOMEPAGE (Home.jsx): header height h-20→h-16; hero description updated to exact approved copy ("From signature cashew brittles to traditional podis, spices and cooking essentials, discover familiar Indian flavours made with care."); REMOVED the 3-card "AMYA Difference" section, replaced with a single compact trust line (TRADITIONAL RECIPES · SMALL-BATCH PREPARATION · MADE WITH CARE); product grid now appears immediately after hero+trust line; supporting line → "Thoughtful ingredients. Familiar flavours. Made with care."; added category quick-links row (Cashew Brittle, Podis & Spices, Pickles, Cooking Oils → /shop/<cat>); consolidated lower sections into: concise brand story → 3-step ordering → terracotta contact (removed repetitive "Why AMYA" grid). 2-col mobile grid retained.
CATALOGUE CORRECTNESS:
- Cashew Brittle: removed the incorrect 10 kg pack. Now only 500 g (₹500, 10 pieces) & 1 kg (₹900, 20 pieces); shows "From ₹500".
- Nuvvula Podi: cleared unconfirmed pack sizes/prices (pack_sizes=[]) and cleared dispatch/preparation/delivery_details. Card shows "Enquire for price and pack sizes"; detail page shows an "Enquire on WhatsApp" button (no pack/qty), no "Day 3" promise.
- Removed the hardcoded "Dispatch on Day 3 / Dispatch typically on Day 3" promise text from ProductCard and ProductDetail (unconfirmed).
- ProductCard & ProductDetail now have a 3-way action: Coming soon (coming-soon) / Enquire on WhatsApp (orderable but no confirmed price — Nuvvula, Chilli, Turmeric) / Add to cart (confirmed price). This also fixed Chilli & Turmeric which previously had a broken price-less Add-to-cart.
- Enquire button → wa.me/919675334567 with a per-product pre-filled enquiry message.
- WhatsApp cart flow kept for priced items (functional, routes to WhatsApp, no fake online payment).
Verified: backend API re-seeded (cashew 500g/1kg only; nuvvula packs=[], dispatch cleared); homepage cards render correctly (DOM extraction); Nuvvula detail page shows Enquire on WhatsApp, no Day 3 text. Previous full regression: iteration_14.json (homepage layout, cart, category links all PASS).

## Changelog — 2026-10-11 (Pack-size catalogue update)
- Cashew Brittle: re-added 10 kg (₹8,500) as a 3rd selectable pack → 500 g ₹500 (10 pieces), 1 kg ₹900 (20 pieces), 10 kg ₹8,500. From ₹500. 10 kg is exclusive to Cashew. Verified: selecting 10 kg updates detail-page total to ₹8,500; Add to cart active.
- Nuvvula Podi: added 3 selectable pack sizes 250 g / 500 g / 1 kg with price=None (no invented prices). Detail page shows a selectable pack grid (each "Enquire"), quantity hidden, primary action "Enquire on WhatsApp" (wa.me/919675334567). Homepage/shop card shows "250 g · 500 g · 1 kg" + "Enquire for price" + Enquire on WhatsApp button. ProductCard enquire-only display now shows pack labels + "Enquire for price" when packs exist, else "Enquire for price and pack sizes".
- Karivepaku Podi & Nallakaram Podi: unchanged (250g ₹250 / 500g ₹450 / 1kg ₹800) — confirmed via API.
- No 10 kg on any non-cashew product. Branding, fonts, images and 2-col mobile layout preserved. Verified via API + DOM extraction + screenshots on desktop & product pages.

## Changelog — 2026-10-11 (Nuvvula pricing confirmed)
- Nuvvula Podi pack prices set to match Karivepaku exactly: 250 g ₹250, 500 g ₹450, 1 kg ₹800. Now fully orderable (card "From ₹250" + Add to cart; detail pack selector updates total; "Enquire" text removed). Cashew Brittle 10 kg (₹8,500) verified end-to-end in cart (₹8,500/pack, order total ₹8,500). No other product/image/style changes.

## Changelog — 2026-10-11 (Premium mobile hero/spacing polish)
Home.jsx only (no branding/image/price/category changes):
- Hero: padding → px-6 (24px) mobile, pt-6 pb-7; eyebrow mb-3; actions mt-6 with connected rhythm.
- Headline: text-[2.625rem] (42px) mobile with [text-wrap:balance] + leading-[1.08] → two balanced lines ("Tradition You" / "Can Taste."). sm:text-5xl lg:text-6xl unchanged.
- Description: text-[17px] leading-[1.6] [text-wrap:pretty], max-w-md on mobile.
- Primary button: passed className py-[20px] + full-width on mobile → ~56px tall, prominent. "Our Story" converted from Btn(subtle) to a subtle link-underline text link beneath, tighter gap.
- Trust strip: flex row with nowrap phrase spans; responsive micro-type text-[8.5px]/min-[400px]:9.5px, px-3 band padding, gap-x-1.5 → single line at 375/390 (overflow 0), no phrase/hyphen split, no dangling punctuation. sm+ wraps naturally at text-xs.
- Product header: tightened margins (mb-2.5), "Our Products" desc text-[15px] max-w-xs [text-wrap:balance] → balanced 2 lines, no orphan "care."; category row mb-4.
Verified via viewport measurement + screenshots at 360/375/390/414px. Pure layout/typography; backend untouched.

## Changelog — 2026-10-11 (Hero image swap + cashew purchase typography)
1. Homepage hero image: replaced the unrelated tea/ginger/lemon Unsplash image with a premium, AI-generated portrait editorial image built from the REAL AMYA cashew brittle gold gift-box reference (preserves the AMYA terracotta label), adding small bowls of golden podi/spice + loose cashews, warm studio lighting, terracotta/ivory/brown palette. Saved to /app/frontend/public/products/amya-hero.jpg; HERO_IMG now = "/products/amya-hero.jpg". Desktop-only hero image (mobile unchanged/compact). Layout/text/buttons untouched.
2. ProductDetail purchase section typography unified (affects all products' detail pages, data unchanged): pack cards now use a single sans font system — label (semibold), price (bold, tabular-nums, terracotta/ivory when active), piece count (smaller, uppercase, same family). Cards use CSS grid auto-fit minmax(88px) for even equal-width/height alignment; note row has min-h so 10 kg (no piece count) keeps equal height. Quantity value and Total switched to font-sans bold tabular-nums terracotta to match pack price style. Verified equal card dimensions and correct total updates at 375/768/1280 (500g ₹500, 10kg ₹8,500, 10kg×2 ₹17,000).
Note: changes are post an earlier deploy initiation — a redeploy is needed to reflect them live.

## Changelog — 2026-10-11 (Hero image v2 — real products)
- Replaced the homepage hero image again per feedback: removed the gold gift-box composition (looked empty/artificial). New AI-generated premium editorial portrait shows a bowl of cashew brittle (caramelised jaggery + visible whole cashews) with small terracotta bowls of Guntur chilli powder, turmeric and roasted podi, on warm walnut wood with ivory/terracotta backdrop. No boxes, no labels/logos, no loose cashews on powders, no unrelated props. Overwrote /app/frontend/public/products/amya-hero.jpg; HERO_IMG = "/products/amya-hero.jpg?v=2" (cache-bust). Desktop-only hero image; layout/headline/buttons/nav unchanged. Verified on desktop (1280) — crops correctly in the 4:5 container.

## Changelog — 2026-10-11 (Our Story founder line refinement)
- OurStory.jsx: changed the founder eyebrow from "Amulya Nimmala · M.Tech" (uppercase, tracking-[0.3em]) to a refined "Founded by Amulya Nimmala" — font-sans text-sm/15px, tracking-wide (subtle), muted terracotta, normal case, smaller than the "A simple goal." heading (heading mt tightened to mt-3 for connection). Removed M.Tech. Heading and story paragraphs unchanged; no other site changes.

## Changelog — 2026-10-11 (Real product photographs replaced)
- Replaced the six products' images with the founder's REAL original photographs from uploaded Amya.zip (matched 1:1 by on-pack AMYA labels): cashew-brittle (gold gift boxes 500g/1kg), guntur-sannam-chilli-powder, amya-turmeric-powder, amya-nuvvula-podi, amya-karivepaku-podi, amya-nallakaram.
- Converted PNG→optimised progressive JPG (cap 1400px, q88) into /app/frontend/public/products/ (overwriting the 5 spice/podi files; cashew now local at /products/cashew-brittle.jpg). Updated server.py seed image paths (?v=3 cache-bust) AND updated existing MongoDB docs directly (images use $setOnInsert so reseed alone wouldn't update them).
- No display-logic changes needed: spice/podi square photos render full via existing object-contain (no crop of AMYA label); cashew landscape via object-cover (both boxes/labels visible). Verified 0 broken images on shop grid, detail page (turmeric) and mobile homepage. Prices, pack sizes, cart, enquiry/WhatsApp/call, branding, logo all unchanged. Garam Masala photo was also in the zip but left untouched (not in the requested six). Uploaded source files preserved in /tmp/amya_zip.

## Changelog — 2026-10-11 (Fix: force-sync real images on deploy)
- Root cause the live site (amyafoods.in) still showed old/generated images: product `images` were written with `$setOnInsert`, so existing production docs were never updated on redeploy (preview DB had been updated directly last turn, production had not).
- Fix: added FORCE_IMAGE_SLUGS = {cashew-brittle, guntur-sannam-chilli-powder, amya-turmeric-powder, amya-nuvvula-podi, amya-karivepaku-podi, amya-nallakaram} in the seed loop; for these six, `images` is now in `$set` (force-synced on every deploy). All other products keep `$setOnInsert` (admin-uploaded images still persist). Garam Masala untouched.
- New optimised JPGs already in /app/frontend/public/products/ (ship with frontend build). Verified preview API returns the six ?v=3 local paths; Garam Masala unchanged. Requires REDEPLOY for the live site to pick up both the DB image paths (via seed) and the new image files (via frontend build).

## Changelog — 2026-10-11 (Garam Masala real photo)
- Replaced Garam Masala image with its REAL photo from the uploaded ZIP (Garam Masala.PNG → optimised JPG 1254px q88 at /products/amya-garam-masala.jpg?v=3). Added amya-garam-masala to FORCE_IMAGE_SLUGS so it force-syncs on deploy; updated seed path + MongoDB doc. Verified on preview detail page (src ?v=3, 0 broken, full label visible). Single images field => updates homepage/grid/detail/related automatically. All other products/images/prices/pack sizes/cart/Cashfree/WhatsApp/layout unchanged. Requires REDEPLOY for live site.

## Changelog — 2026-10-11 (Pickle pricing)
- Set confirmed prices for the six pickles in the data source (seed PICKLE_PRICES map + applied via $set, so existing docs update on restart/redeploy). Availability kept "coming-soon" (no checkout enabled per founder instruction).
  - Chicken Pickle (chicken-pickle): 250g ₹400 / 500g ₹750 / 1kg ₹1,400
  - Avakai Pickle: 250g ₹200 / 500g ₹300 / 1kg ₹500
  - Maagai Pickle: 250g ₹200 / 500g ₹300 / 1kg ₹500
  - Allam Sweet Pickle: 250g ₹200 / 500g ₹300 / 1kg ₹500
  - Mutton Pickle: 250g ₹500 / 500g ₹900 / 1kg ₹1,700
  - Prawn Pickle: 250g ₹600 / 500g ₹1,000 / 1kg ₹1,900
- Cards show "From ₹X" + Coming soon; detail pages show per-pack ₹ prices (en-IN format, e.g. ₹1,400), checkout remains disabled. Verified mobile + desktop. CSS pickle pack mockups, images, descriptions, other products, branding, layout all unchanged.

## Changelog — 2026-10-11 (Pickle stock states + ordering enabled)
- Introduced two availability states: "in-stock" (badge "Available to Order", orderable → Add to cart) and "out-of-stock" (badge "Out of Stock", prices visible, disabled "Currently Unavailable", no add-to-cart/qty, restock note). Added to Availability.jsx, ProductCard.jsx, ProductDetail.jsx, and both admin dropdowns (avail-<slug> quick select + pf-availability edit form).
- Pickle statuses: Chicken, Allam Sweet, Mutton, Prawn = in-stock; Avakai, Maagai = out-of-stock. Prices unchanged from previous turn (18 pack prices).
- Inventory now admin-managed & persistent: moved `availability` from $set to $setOnInsert in the seed (admin changes survive redeploy); added one-time migration "pickle_stock_v1" (db.migrations) to apply the initial pickle statuses to existing preview + production DBs exactly once. Admin can toggle stock anytime via /admin.
- Verified by testing agent (iteration_15.json): 100% frontend pass, 0 bugs — all 18 prices, badges, pack/qty totals, cart line+grand totals (multi-item ₹3,100), out-of-stock gating, admin toggle persistence, and no regressions (cashew/chilli/turmeric/oils intact). Out-of-stock items can't be added to cart. Ready to publish (redeploy runs the migration on production).

## Changelog — 2026-10-11 (Pickle glass-jar images)
- Replaced the CSS "PACKAGING CONCEPT" pickle mockups with premium glass-jar product images in the approved AMYA label style (terracotta square label, ivory serif "AMYA / ARTISANAL FOODS / <PRODUCT>", clear glass jar, matte black lid, realistic Andhra pickle visible, warm ivory background). NOTE: no real glass-jar photo existed in project assets (only pouches/cashew boxes), so these are AI-generated renders using the founder's approved label/brand style per their explicit request; awaiting founder review before deploy. Each product shows correct contents: Prawn (prawns), Chicken (boneless chicken), Mutton (mutton pieces), Allam Sweet (smooth chunk-free ginger paste), Avakai (cut mango), Maagai (traditional maagai).
- Files: /app/frontend/public/products/{prawn,chicken,mutton,allam-sweet,avakai,maagai}-pickle.jpg (1024², ~0.6MB). Seed sets pickle images in the category block (?v=1); added all 6 pickle slugs to FORCE_IMAGE_SLUGS so a restart/redeploy force-syncs images to existing docs. Verified: API returns image paths, all serve 200, grid + mobile render with 0 broken images, availability preserved (Chicken/Allam/Mutton/Prawn=in-stock, Avakai/Maagai=out-of-stock), prices/pack sizes/cart/labels/buttons unchanged. NOT published — preview only, pending founder approval.

## Changelog — 2026-10-11 (Authentic pickle contents v2)
- Corrected the pickle CONTENTS inside the glass jars via AI image EDITING (reference = each existing jar), preserving the jar, matte black lid, AMYA terracotta label/text, ivory background, framing and 1024² dimensions exactly. Updated 5: Prawn (curled prawns, garlic, mustard, red oily masala — pickle not curry), Chicken (fried boneless pieces, reddish-brown coating, garlic), Mutton (chunky boneless pieces, dark masala, spiced oil — not minced/gravy), Maagai (thin dried-mango strips in dark red-brown masala), Avakai/Aavakaya (firm raw-mango chunks, coarse chilli+mustard, oily). Allam Sweet left unchanged (not requested). Files overwritten at /app/frontend/public/products/<slug>.jpg; cache bumped to ?v=2 in seed; FORCE_IMAGE_SLUGS force-syncs on deploy. Verified grid + full-res: labels crisp/correct, branding preserved, 0 broken images, availability/prices/pack sizes/cart unchanged. Preview only — redeploy needed for live.

## Changelog — 2026-10-13 (Added 3 new products)
- Added to INITIAL_PRODUCTS (upsert inserts new slugs; delete_many keeps them):
  - Coriander Powder (slug coriander-powder, category spices, sort 17): pack sizes 250g/500g/1kg with price=None → card shows pack labels + "Enquire for price"; detail shows pack selector ("Enquire") + Enquire on WhatsApp. No checkout. availability "available", no image (AMYA placeholder tile).
  - Jeera Powder (slug jeera-powder, category spices, sort 18): same treatment as Coriander.
  - Kaju Bites (slug kaju-bites, category cashew-brittles, sort 19): no pack sizes/price → "Enquire for price and pack sizes" + Enquire on WhatsApp; detail shows "Details coming soon" copy + highlights (premium cashew snack, glass jar w/ glossy black lid, weight/pricing announced soon). No fake photo — elegant AMYA placeholder tile. No checkout.
- Placement: Coriander/Jeera live under the Spices category/nav; Kaju Bites under Cashew Brittle category/nav. All use the existing ProductCard/ProductDetail so styling/branding/mobile layout match. Existing products/prices/stock/images untouched. Verified on preview (spices + cashew pages, both detail pages, 0 broken images). Preview only — redeploy needed for live. Prices/pack details to be added later by founder (then enable checkout on approval).

## Changelog — 2026-10-13 (Kaju Bites image fix + catalogue/UX updates)
- Kaju Bites image: edited the existing jar photo (reference = founder's original sweet photo) so the sweets are the correct LIGHT GOLDEN-YELLOW jaggery-coated cashews (glossy coating, cashew pieces showing through), keeping the transparent jar, matte black lid, AMYA terracotta "KAJU BITES" label and warm ivory/terracotta background unchanged. File /app/frontend/public/products/kaju-bites.jpg, cache bumped ?v=2. Verified on product page.
- Product pages: removed the location pin + origin text (e.g. "India", "Andhra Pradesh, India") from ALL product detail pages (ProductDetail.jsx — removed origin block + unused MapPin import). Oils-page Hyderabad refill/return info is untouched.
- "AVAILABLE TO ORDER" badge: terracotta badge now shows on genuinely-orderable non-sweet products (Podis/Spices = "available"/"order", in-stock Pickles). Hidden on sweets (Cashew Brittle, Kaju Bites), out-of-stock (Avakai, Maagai → "Out of Stock") and coming-soon (Oils → "Coming Soon"). Logic in ProductCard.jsx + ProductDetail.jsx (isSweet + showBadge); Availability.jsx labels for ready/order/available/in-stock unified to "Available to Order".
- Removed "pre-order" wording: Availability.jsx "available" label changed from "Available for pre-order" → "Available to Order"; admin option labels "Available (pre-order)" → "Available to Order". Sweets use plain ordering (no pre-order badge). Made-to-order model/messaging retained for podis/spices/pickles/oils.
- Homepage order re-sequenced via sort_order (Home sorts by sort_order): Cashew Brittle(0) → Kaju Bites(1) → Podis(2-5: Nuvvula, Karivepaku, Nallakaram, Garam Masala) → Spices(6-9: Chilli, Turmeric, Cumin, Coriander) → Pickles(10-15) → Oils(16-18). No duplicates; verified via API.
- 10 kg Kaju Bites: Kaju Bites has NO pack sizes at all (empty []), so there is no 10 kg (or any) variant to remove — confirmed in data + UI. The only 10 kg is on Cashew Brittle (preserved per instruction).
- Verified: API product order/packs correct; screenshots of homepage (badges on podis, none on sweets), Chilli Powder detail (badge + no location) and Kaju Bites detail (no badge, no location, no pack sizes). Preview only — redeploy needed for live.


## Changelog — 2026-10-13 (Recipe stories + ownership attribution + Nuvvula signature)
- Rewrote recipe_story (heading + body) for all 9 relevant products using founder's exact copy, honouring the naming rule ("Amulya's mother-in-law, Leela" on first mention, "Amulya's mother-in-law" after):
  - Chicken / Mutton / Prawn Pickle → heading "PREPARED BY AMULYA" (attributed to Amulya, NOT Leela).
  - Allam Sweet Pickle → "A RECIPE FROM AMULYA'S AMMAMMA" (prepared by Amulya from her ammamma's recipe).
  - Avakai & Maagai → "A CHERISHED FAMILY RECIPE" (traditional recipe of Amulya's mother-in-law, Leela).
  - Nuvvula Podi → "AMYA SIGNATURE PODI" (signature hero; prepared by Amulya's mother-in-law, Leela).
  - Karivepaku & Nallakaram Podi → added new "A TRADITIONAL FAMILY RECIPE" stories (by Amulya's mother-in-law, Leela).
- Fixed contradicting attributions: podi description + highlights "Prepared by Amulya" → "Prepared by Amulya's mother-in-law, Leela" (Nuvvula, Karivepaku, Nallakaram).
- Nuvvula Podi "AMYA SIGNATURE": added signature:bool field to Product model + signature:True in seed; tasteful terracotta "AMYA SIGNATURE" eyebrow (Sparkles icon) on ProductCard (above name) and ProductDetail (next to category), rendered only when product.signature. No exaggerated/award claims.
- Homepage (Home.jsx) heritage text updated to naming rule: RECIPE_CREDITS "By Leela" → "By Amulya's Mother-in-Law" with relationship in body; "Ammu and Leela" → "Amulya and her mother-in-law"; sourcing "Leela helps..." → "Amulya's mother-in-law helps...". No standalone "Leela" left in body copy.
- Verified: API returns all 9 stories correctly + Nuvvula signature=True; screenshots of Nuvvula detail (signature badge + story + correct attribution) and spices grid (signature eyebrow on Nuvvula card only). Preview only — redeploy needed for live.


## Changelog — 2026-10-13 (Pickles: AMYA cold-pressed oils messaging)
- Added a subtle premium "Made with AMYA Cold-Pressed Oils" block to ALL pickle detail pages — rendered conditionally in ProductDetail.jsx when product.category === "pickles" (single source, no per-product data duplication). Contains: droplet-icon heading "Made with AMYA Cold-Pressed Oils", short highlight "AMYA Cold-Pressed Oils · Traditional Recipes · Small-Batch Preparation", the full supporting paragraph, and tagline "Clean Ingredients. Authentic Flavours. Made with Care." Styled in terracotta/ivory.
- Added a short highlight strip (same tagline line) above the Pickles collection grid in Shop.jsx (category === "pickles" only) — not repeated on each card.
- Existing recipe stories & attributions preserved (Chicken/Mutton/Prawn = Amulya; Avakai/Magai = Amulya's mother-in-law Leela; Allam = Amulya via ammamma's recipe). NOT added to podis/spices/cashew brittle/Kaju Bites. Prices, pack sizes, images and ordering unchanged. Used the trustworthy tagline (no unsubstantiated superlatives).
- Verified via screenshots: Chicken Pickle detail (block + correct story + prices) and /shop/pickles (highlight strip). Preview only — redeploy needed for live.


## Changelog — 2026-10-13 (Product detail page premium simplification)
- Rewrote ProductDetail.jsx info column to a minimal/premium editorial order: category eyebrow + small signature pill + diet → prominent product NAME (now shown for Cashew Brittle too) → short description (line-clamp-2 on mobile) → Pack Size → Quantity + Total → Add to Cart (or Enquire/Coming soon/Out of stock) → compact "Made to order" note → secondary actions.
- Moved ALL supporting content BELOW the purchase area into an 'Our Story & Ingredients' accordion (collapsed by default): Our Story (recipe_story), Serving Suggestion, Highlights, Description, Ingredients, Storage, Preparation & Dispatch, Delivery, Returns, Food-label. Removed the old between-image-and-pricing cards (highlights checklist, serving card, recipe-story card, big promo blocks). Location/origin already removed earlier.
- Pickles: kept cold-pressed-oils message but as ONE compact line (droplet icon) BELOW the Add to Cart button: "Made with AMYA cold-pressed oils and traditional Andhra recipes, prepared in small batches with care." Correct per-pickle recipe attributions preserved (in the accordion Our Story).
- Nuvvula Podi signature kept as a small pill next to the category (no large banner above pricing).
- Cashew Brittle: REMOVED the 10 kg pack per new instruction (now only 500 g ₹500, 1 kg ₹900); no pre-order messaging. (Note: this reverses the earlier 'preserve 10 kg' decision — user explicitly asked to remove it this session.)
- Verified by testing agent (iteration_18.json, frontend 100%): pack switching updates pd-total, qty +/- updates total, Add to Cart increments cart badge, pickle oil line below button, cashew brittle only 2 packs/no 10 kg/no pre-order, chilli shows Enquire, accordion expands, no 'India' text, pricing within fold, no new console errors. Preview only — redeploy needed for live.
- Known pre-existing (not a regression): /api/admin/* ping returns 401 on public pages (console noise only).


## Changelog — 2026-10-13 (Desktop/laptop audit + fixes)
- Audited rendered pages at 1280/1366/1440/1920 (+375/768) across home, shop grids, oils, product detail, cart, header, footer.
- Fix 1 — Product grid alignment (ProductCard.jsx): the "AMYA Signature" eyebrow pushed Nuvvula's name/price below its row-mates, and cards with fewer text lines left the price floating. Fix: reserved a fixed-height eyebrow slot (min-h-[14px]) so names align across every card; pinned pack/price to the bottom of the card (mt-auto) so prices sit on a common baseline; Link is flex-1 and buttons use mt-3 — names, prices and CTAs now line up across every row. Works at desktop/tablet/mobile.
- Fix 2 — PageHero.jsx: reduced excessive vertical whitespace (py-20/lg:py-28 → py-14/sm:py-16/lg:py-20) and trimmed oversized title (lg:text-7xl → lg:text-6xl) so short-title heroes (e.g. 'AMYA Oils.') aren't sparse and products appear higher.
- Verified already-correct (no change): max-w-7xl centered containers (no excessive stretch), NO horizontal overflow at any width, all footer links route to real pages, no 'AVAILABLE TO ORDER' badges anywhere, no location/'India' labels on product pages, product prices/pack-sizes/recipe attributions intact, Cashew Brittle has no 10 kg, no pre-order on sweets.
- Functional test (desktop): pack select updates price (₹250→₹450→₹800), qty updates total, Add to Cart → cart badge + drawer (item, qty, Order total ₹900, Send-on-WhatsApp, Clear cart) all work. WhatsApp links use wa.me/919675334567. No payment gateway exists (WhatsApp-order mode) — not tested/claimed.
- Not independently re-verified: true mobile pixel rendering via screenshot tool (it min-renders ~1568px); mitigated by scrollWidth overflow checks at 375/768 (all ok) and tablet-768 render confirming 2-col aligned grid.
- Preview only — redeploy needed for live.


## Changelog — 2026-10-13 (Our Story — real kitchen photo + Two Generations section)
- Used the founder's uploaded real kitchen photograph ("Rustic Kitchen Food Preparation Team.png") as-is: converted to web-optimized JPEG at original 3:2 proportions (1536x1024, 254 KB, quality 85 progressive) with NO colour/face alteration. Saved to /app/frontend/public/products/our-story-kitchen.jpg.
- Added a new "Our Story — Two Generations" editorial section to OurStory.jsx (/our-story), below the existing founder section: image-left/story-right on desktop (lg:grid-cols-2), image-first then story on mobile/tablet. Eyebrow "OUR STORY", heading "Two Generations. One Love for Homemade Food.", exact 4-paragraph body copy. Alt text: "Amulya and her mother-in-law, Leela, preparing traditional homemade food in a kitchen." Subtle rounded-xl, no heavy shadows/frames/animation; terracotta/ivory palette.
- Both women (Amulya, Leela) fully visible, 3:2 proportions preserved (no cropping of the two). Naming rule honoured ("her mother-in-law, Leela").
- Verified: image serves (200), renders correctly at desktop 1440 (two-column) and tablet/mobile 768 (stacked, image first). Preview only — redeploy needed for live.


## Changelog — 2026-10-13 (Homepage "Meet Amulya & Leela" teaser)
- Added a compact clickable teaser (data-testid home-meet-founders-teaser) in the homepage "The Heart Behind AMYA" (#our-family) section, after the Sourcing card: kitchen photo thumbnail (/products/our-story-kitchen.jpg) + "OUR STORY" eyebrow + "Meet Amulya & Leela" + "Read our story →", linking to /our-story. Terracotta/ivory palette, subtle hover. Verified render at desktop + href=/our-story. Preview only — redeploy for live.


## Changelog — 2026-10-13 (Premium product hero + Our Story copy)
- Homepage hero: replaced the old gift-box image with a NEW premium product composite generated from the actual approved product photos (kaju-bites.jpg, cashew-brittle.jpg, amya-nuvvula-podi.jpg, chicken-pickle.jpg) as references — features the Kaju Bites glass jar (black lid, terracotta label), Cashew Brittle gift packaging, Nuvvula Podi pouch + bowl, and an amber Chicken Pickle jar on warm ivory/terracotta. Labels legible & faithful, product names correct, no invented labels, no stray props. Saved to /products/amya-hero.jpg (136 KB), cache ?v=3.
- Hero layout (Home.jsx Hero): switched from lg:grid-cols-12 (7/5, image desktop-only, portrait rounded-t arch + parallax) to a balanced lg:grid-cols-2; landscape aspect-[3/2] rounded-2xl frame with subtle border/shadow; removed parallax (useRef/useScroll/useTransform) to avoid edge-reveal; image now also shows on mobile BELOW the headline/CTA (text-first) so the headline isn't pushed down. Headline "Tradition You Can Taste." and supporting copy/buttons preserved.
- Our Story (/our-story): kept the authentic uploaded kitchen photo; updated the final body paragraph to new wording ("AMYA is about preserving familiar flavours, honouring family traditions and sharing food made with care."). The "Two Generations" story exists ONLY on /our-story (homepage family section is different copy + a teaser link) — no verbatim duplication.
- Verified rendered: desktop 1440 balanced two-column hero; mobile 375/768 — no horizontal overflow, h1 at top (~118px), hero image below CTA (~461px). Cart/nav/footer/logo untouched. Preview only — redeploy for live.


## Changelog — 2026-10-13 (Image-loading issue on live desktop — diagnosed)
- Reported: hero + product images blank on desktop/laptop at amyafoods.in. Root cause: STALE PRODUCTION DEPLOY. The live site had been serving a build from before the new hero (amya-hero.jpg?v=3) + our-story-kitchen.jpg + corrected product images and before the hero was changed to render on all breakpoints. On that old build the hero was desktop-only (hidden lg:block), so desktop showed a blank hero while mobile hid it ("looked fine on mobile").
- Verified NOT a code bug: preview audit = 0 broken images across 12 pages @1440. Live image URLs all return 200 image/jpeg with real sizes. No path/case/CSS/lazy-load/srcset issues found. No code changes required.
- Resolution: the redeploy that ran at the start of this task published the current code + assets. Live audit now: amyafoods.in @ 1440/1280/768/390 across 7 pages (63 imgs each) = 0 broken images, 0 horizontal overflow; hero v3 composite loads. Issue resolved by deploy, confirmed on the rendered live site via a fresh headless browser (no cache).



## Changelog — 2026-10-13 (Removed "Our Transparency Promise" section)
- Removed the entire "Our Transparency Promise" section from the /transparency page component (Transparency.jsx): deleted the PageHero (eyebrow "Our transparency promise", title "Trust isn't a claim. It's a process.", subtitle) and all commitment cards (COMMITMENTS array incl. "Clear ingredient information") plus now-unused imports (PageHero, lucide icons). Removed from the component, not CSS-hidden.
- Kept the separate "Traceable batches" (Batch information) section; header/nav/cart/WhatsApp/footer and all other pages unchanged.
- Verified in preview @1440: target text fully absent, no horizontal overflow, no blank space (page flows header → Traceable batches → footer). Shared component → applies to all viewports. Preview only — redeploy for live.

## Changelog — 2026-10-13 (Order confirmation + PDF invoice system — Phase 1)
Backend (server.py + invoices.py + emailer.py):
- Order model + POST /api/orders: server-side price/qty re-validation against DB (never trusts client totals), unique order_number (AMYA-YYYYMMDD-XXXX) + invoice_number, computes subtotal/delivery/GST(optional)/total. Idempotent on client_ref (cart ref) → no duplicate orders.
- PDF invoice (ReportLab, invoices.py): AMYA logo (/brand/amya-logo-terracotta.png), terracotta/ivory, business legal block, order/customer/items/totals, payment method+status, thank-you. Clearly labelled "Order confirmation — not a tax invoice". Regenerated deterministically on demand (no disk dependency).
- GET /api/orders/{order_number}/invoice?token= (tokenised, non-guessable) + GET /api/orders/{order_number}?token= (confirmation fetch).
- Email (emailer.py, Emergent-managed Resend + full guardrail gate): customer confirmation (with secure invoice link) + business notification (if business_notify_email set). Best-effort, logged in order.notifications, never blocks the order. VERIFIED: send returns Resend message IDs.
- Admin: GET /api/admin/orders, PATCH /api/admin/orders/{on} (payment/order/preparation/dispatch status), GET .../invoice, POST .../resend-email.
- Settings extended with legal/business fields (legal_name, business_address, fssai_number, support_email, support_phone, business_notify_email, website, gst_enabled/gstin/gst_rate, delivery_charge, delivery_note) — admin-editable; blank => placeholders (NO invented legal data).
Frontend:
- /checkout (Checkout.jsx): name/mobile/email/address form + summary → POST /orders → redirect to confirmation. CartDrawer now "Proceed to Checkout" (primary) + "Order on WhatsApp instead" (hybrid).
- /order/:orderNumber (OrderConfirmation.jsx): thank-you, summary, COD/Payment Pending badge, Download Invoice + Confirm on WhatsApp.
- Admin Orders tab (OrdersPanel) + Settings invoice/business fields.
- Routes added in App.js; env EMERGENT_EMAIL_KEY + EMAIL_FROM_NAME in backend/.env; reportlab + httpx in requirements.txt.
Payment: no online gateway → default COD / Payment Pending; admin can set Paid/Refunded; cancellation via order_status (record preserved). Cashfree only when founder approves with keys.
NOT built (needs founder input): automated WhatsApp PDF (needs WhatsApp Business API provider + creds) — kept manual hybrid handoff. Real FSSAI/address/GSTIN pending founder (admin Settings).
Verified: full E2E — add-to-cart→checkout→order (server prices ₹900+₹400)→confirmation→invoice PDF (customer + admin, 200 application/pdf)→email (Resend ids)→admin list/status/resend; idempotency (no dup). Preview only — redeploy for live.


## Changelog — 2026-10-13 (Razorpay online payments)
- Backend: razorpay SDK; RAZORPAY_KEY_ID/SECRET/WEBHOOK_SECRET in backend/.env (server-side only). POST /api/orders accepts payment_method (cod|razorpay); for razorpay it creates a Razorpay order (amount in paise) and returns {razorpay_order_id, razorpay_key_id, amount}. GET /api/payments/razorpay/config (enabled + public key_id). POST /api/payments/razorpay/verify verifies the signature SERVER-SIDE (HMAC) → marks order PAID + confirmed + sends post-payment emails; bad signature → 400 (never trusts browser). POST /api/payments/razorpay/webhook (gated on webhook secret) for payment.captured/order.paid → PAID. COD stays cod_pending.
- Frontend Checkout: payment method selector (Pay online Razorpay / Cash on Delivery); Razorpay Checkout.js opens on submit, success→verify→confirmation (PAID), dismiss/fail→confirmation (Payment Pending). Confirmation badge reflects real payment_status.
- VERIFIED (no real charge): create razorpay order (live key, order_... created), valid signature→PAID, invalid signature→400, COD flow, admin list/status/invoice/resend, checkout UI shows both options.
- IMPORTANT: user supplied LIVE keys (rzp_live_...) but asked to test in Test Mode first. Did NOT run a real charge in preview. TODO before go-live: (1) ROTATE the exposed live key secret, (2) use rzp_test_ keys for a full test-card run, (3) optionally set RAZORPAY_WEBHOOK_SECRET + register webhook URL /api/payments/razorpay/webhook, (4) don't announce live until Razorpay account approved. WhatsApp auto-send still NOT built (no provider) — manual handoff remains.

## Changelog — 2026-07-11 (Admin Order Management Dashboard — forked session)
Scope: Built the complete, secure Admin Order Management Dashboard on top of the existing checkout/invoice/email/Razorpay backend. Customer-facing website, products, prices, checkout and branding intentionally UNCHANGED (only 2 extra status labels added to OrderConfirmation.jsx for accuracy). LIVE Razorpay keys untouched; no real charges/refunds triggered.

### Backend (server.py, emailer.py)
- Status taxonomy constants: ORDER_STATUSES = placed, confirmed, preparing, ready_to_dispatch, shipped, delivered, cancelled. PAYMENT_STATUSES = cod_pending, cod_collected, pending, paid, failed, refund_processing, refunded. Payment status kept SEPARATE from order status.
- Order docs now carry tracking_reference, courier_name, cancellation_reason, status_history[] (added in _build_order_doc; legacy orders get safe defaults via _admin_order()).
- PATCH /api/admin/orders/{order_number} rewritten: enum validation; GUARDRAIL rejects manual payment_status='paid' (only verified Razorpay signature/webhook can set paid) → 400; cancellation requires a non-empty cancellation_reason → 400 otherwise; every order_status/payment_status change appends an audit entry {field, from, to, by, by_email, at, note}; best-effort customer email on shipped/delivered (result returned as email_result).
- GET /api/admin/orders/{order_number} (new) — single order detail for admins.
- Business new-order notifications now fall back to Contactamyafoods@gmail.com when settings.business_notify_email is blank (create_order + _send_order_emails). Verified Resend accepted (ok=true).
- emailer.status_update_email_html() added for shipped/delivered customer emails (incl. tracking ref).
- Refunds are MANUAL tracking only (refund_processing → refunded); no automatic Razorpay refund API call. Razorpay webhook/verify signature enforcement unchanged (webhook returns 503 until RZP_WEBHOOK_SECRET set in this env).

### Frontend
- New /app/frontend/src/lib/orders.js: status/tone maps, inr, paymentMethodLabel, isRevenueOrder/revenueOf (revenue = order_status != cancelled AND payment_status in {paid, cod_collected}), withinRange date filter, ordersToCSV/downloadCSV, itemsSummary, formatDateTime.
- New AdminOrders.jsx (Orders tab): summary stat cards (Verified revenue accent + Total/New/Confirmed/Awaiting payment/Paid/Preparing/Shipped/Delivered/Cancelled/Refunded) with From/To date-range filter; search by order ID/name/phone; order-status + payment-status + method filters; Export CSV; responsive desktop table + mobile cards; row click → detail.
- New full-page route /admin/orders/:orderNumber (AdminOrderDetail.jsx): items w/ pack/qty/unit/line + subtotal/delivery/GST/total; customer & delivery; Invoice/Print + WhatsApp customer; status-history timeline; lifecycle buttons; Save tracking (courier+ref); Cancel-with-reason dialog (confirm-cancel disabled until reason entered); payment panel w/ Razorpay refs + COD-collected / mark-failed / start-refund / confirm-refund + guardrail note.
- Old inline OrdersPanel removed from AdminDashboard.jsx.

### Testing
- testing_agent iteration_19.json: backend 100% (22/22 pytest at /app/backend/tests/test_admin_orders.py), frontend 100%, no critical/minor issues. One LOW UX nit (confirm-cancel not disabled when reason empty) — FIXED.
- Razorpay successful real payment NOT tested (LIVE keys only; forbidden to charge). Only structural signature enforcement verified. Online webhook requires RZP_WEBHOOK_SECRET in production to reconcile payments.

### Remaining config for go-live
- Set RAZORPAY_WEBHOOK_SECRET in production env + configure the webhook URL (/api/payments/razorpay/webhook, events payment.captured/order.paid) in the Razorpay dashboard so online payments reconcile automatically.
- Optionally fill Admin → Settings business/invoice fields (FSSAI, address, GSTIN); business_notify_email already defaults to Contactamyafoods@gmail.com.
- Resend managed sending may land in spam until a domain is verified.

## Changelog — 2026-07-11 (Secure first-run admin bootstrap — no default password)
- REMOVED env/hardcoded admin seeding from seed() (no more ADMIN_EMAIL/ADMIN_PASSWORD default admin). Production starts with zero admins.
- Backend: GET /api/auth/setup-status {needs_setup}; POST /api/auth/setup (creates the FIRST admin only while zero admins exist, else 403; bcrypt + password strength: 8+ chars incl. letter & number; logs the new admin in via cookies+token); POST /api/auth/change-credentials (authenticated — verify current password, update own email and/or password, re-issue cookies). validate_password_strength() helper added.
- Frontend: new /admin/setup page (AdminSetup.jsx) for one-time secure account creation; /admin/login auto-redirects to /admin/setup when needs_setup; /admin (dashboard) → login → setup chain guides first-run founders; new "Account security" card in Settings tab to change own email/password. AuthContext gained setupAdmin().
- Admin authorization unchanged & enforced server-side on every /api/admin/* (401 without JWT); /admin is not security-by-obscurity.
- Verified (preview): setup-status=false (admin exists), /auth/setup→403, login OK, change-credentials 401/400 guards, /admin/setup→redirect to login, Account security card renders. Pytest: /app/backend/tests/test_admin_auth.py (7 passed).
- Production go-live note: first admin is created by the founder at /admin/setup on first launch; no default password ships anywhere.

## Changelog — 2026-07-11 (Password reset + cleared legacy admin for founder self-setup)
- Added secure password reset: POST /api/auth/forgot-password (generic response, no account enumeration; emails one-time link valid 1h, single-use via Resend) and POST /api/auth/reset-password (token + strength check, marks token used). TTL + unique indexes on password_reset_tokens. emailer.admin_reset_email_html() added.
- Frontend: AdminForgot.jsx (/admin/forgot-password), AdminResetPassword.jsx (/admin/reset-password?token=), "Forgot password?" link on login.
- DELETED the legacy preview admin so preview matches production (needs_setup=true) → founder creates the first account (Contactamyafoods@gmail.com) with a private password via /admin/setup. Customer orders preserved.
- Verified end-to-end (API): setup→auto-login→GET /admin/orders (200, 7 orders); setup blocked (403) once an admin exists; /admin/orders 401 without token; forgot→email→reset→login with new password; reused reset token rejected (400); weak password rejected. UI: /admin→/admin/setup redirect, setup/forgot/reset pages render, Settings "Account security" card. Pytest test_admin_auth.py = 6 passed / 2 skipped (non-destructive, state-aware).

## Changelog — 2026-07-11 (Secure order deletion: soft-delete / trash / restore / permanent)
- Soft delete model: orders carry deleted_at/deleted_by/deletion_log (backfilled deleted_at:null on legacy orders in seed). Active list GET /api/admin/orders now filters {deleted_at:null}; new GET /api/admin/orders/deleted lists trash.
- Endpoints (all admin-JWT only; 401 otherwise): DELETE /api/admin/orders/{on} (soft delete→trash), POST /api/admin/orders/bulk-delete {order_numbers}, POST /api/admin/orders/{on}/restore, DELETE /api/admin/orders/{on}/permanent, GET /api/admin/deletion-audit.
- Permanent delete GUARD: blocked (403) for orders with a retained financial/tax record (razorpay_payment_id OR payment_status in paid/cod_collected/refund_processing/refunded); also 400 if not in Trash first. Durable deletion_audit collection logs who/when for soft_delete/restore/permanent_delete (survives the order doc being removed).
- Deleted orders are excluded from dashboard counts and Verified Revenue (frontend computes from active list which now excludes trash).
- Frontend: AdminOrders has Active | Trash toggle, row checkboxes + select-all, "Delete selected" with confirmation (bulk >1 requires an extra acknowledgment checkbox); Trash view shows deleted date + Restore + Permanent-delete (strong confirm). AdminOrderDetail has a "Move to Trash" danger-zone (active) and, when in Trash, a banner with Restore + Permanent-delete (shows the retention warning when a financial record exists).
- Verified live (curl + UI): soft delete, bulk delete, restore, permanent delete (success for no-financial-record; 403 when cod_collected; 400 when not in trash), 401 unauthorized, audit entries, counts exclude trash. Pytest: test_admin_deletion.py 6/6 + test_admin_auth.py 6 pass/2 skip. All test data + temp admin cleaned; founder admin (contactamyafoods@gmail.com) + 7 orders preserved.

## Incident + Fix — 2026-07-11 (Production admin login recovery, amyafoods.in)
ROOT CAUSE: Preview and production use SEPARATE databases (prod = Emergent-managed Atlas, db "amya-artisanal-test_database"; confirmed by deployer). The founder created contactamyafoods@gmail.com only in the PREVIEW db. Production's db still had only the OLD env-seeded admin amulya@amayafoods.in (created by an earlier build before env-seeding was removed). So prod login with contactamyafoods@gmail.com returned 401 (no such account), and needs_setup=false (an admin already existed) blocked the setup page.
FIX (no code publish; live-API remediation on the deployed build which already had the setup/reset flow):
- Logged into prod with the existing admin and used POST /api/auth/change-credentials to RENAME the admin email amulya@amayafoods.in -> contactamyafoods@gmail.com (data preserved).
- Triggered POST /api/auth/forgot-password for contactamyafoods@gmail.com. Deployer confirmed from PROD: EMERGENT_EMAIL_KEY present; email provider ACCEPTED the reset (HTTP 202, log "email ok=True"); prod admin count=1 email=contactamyafoods@gmail.com; no amulya/other admins.
- Founder set their own private password via the emailed reset link; legacy password AmyaFounder@2026 now REJECTED (401) in production.
VERIFIED IN PRODUCTION (curl against https://amyafoods.in): correct login 200 + /auth/me session 200 + authorized /admin/orders 200; wrong password 401; unknown email 401; admin API without token 401; logout 200. Prod real orders = 0 (7 orders are preview test data). Nothing deleted/reset.

## Changelog — 2026-07-14 (Our Story section — photo-first editorial layout)
- Restructured ONLY the "Our Story" (Two Generations) section in OurStory.jsx from a 2-column (image-left/text-right) grid into a stacked, centered editorial layout: "OUR STORY" label → large rounded photo of Amulya & Leela (existing /products/our-story-kitchen.jpg, 1536x1024, shown w-full h-auto so both women are fully visible with no crop/stretch) → heading "Two Generations. One Love for Homemade Food." → unchanged story paragraphs.
- Story text unchanged; no duplicate section; logo/nav/header/bag/WhatsApp and all other sections untouched; terracotta/ivory palette preserved. Verified DOM order + visual on desktop & mobile in preview. (Redeploy to publish to amyafoods.in.)

## Changelog — 2026-07-14 (Checkout layout + payment-copy corrections)
Edited ONLY /app/frontend/src/pages/Checkout.jsx (no other sections/branding/backend changed; Razorpay config untouched).
- FIX 1: Changed from 2-column (form-left / summary-right) to a single-column max-w-2xl flow in the required order: Checkout heading + intro -> ORDER SUMMARY -> YOUR DETAILS -> PAYMENT METHOD -> PAY & PLACE ORDER -> confirmation note. No duplicate summary. Responsive on all breakpoints.
- FIX 2: Replaced misleading "We'll prepare your order... Payment is collected on confirmation / delivery." with heading "Your details" + "Enter your contact and delivery details so we can prepare your order. Your order total is shown in the order summary above." Added fields: Full name, Mobile, Email, Complete delivery address, City, State, PIN (all required, validated: 10-digit mobile, valid email, 6-digit PIN). City/State/PIN are composed into delivery_address ("addr, city, state - pin") so backend/invoice/Razorpay contract is unchanged.
- FIX 3: Payment copy now matches flow. Razorpay subtitle "paid securely now"; note "...marked PAID only after the payment is verified by our backend"; button "Pay & place order". COD subtitle/note "Pay in cash on delivery, as per the confirmed COD arrangement." COD never claims PAID (payment_status cod_pending).
- FIX 4: Preserved prices/packs/qtys; total correct (client grandTotal); no invented delivery fee (backend delivery_charge=0, confirmed later via note); duplicate submit guarded (submitting flag + early return) and idempotency client_ref retained.
- Verified in preview (screenshots + DOM + full COD e2e): summary above details; all 7 fields work; Razorpay note/button toggle correct; COD order AMYA-...-VXF7 created with correct composed address + ₹500 total + cod_pending, confirmation page correct; QA order then deleted (back to 7 orders). Live in PREVIEW — redeploy to publish to amyafoods.in.

## Changelog — 2026-07-14b (Our Story top photo + COD removal)
- OurStory.jsx: moved Amulya & Leela photo (/products/our-story-kitchen.jpg) to the very top of the page (above PageHero "Founder-led / The person behind AMYA."), responsive w-full h-auto rounded; removed the duplicate from the "Two Generations" section (now label+heading+story only). Verified: top_before_hero=true, kitchenPhotoCount=1.
- COD REMOVED: Checkout.jsx is online-only (no pay-cod radio/text; method fixed to razorpay; submit disabled + WhatsApp enquiry fallback when rzp not enabled/cart unpriced). server.py create_order rejects payment_method != 'razorpay' with 400; obsolete "choose COD" messages updated. Verified: COD->400, razorpay->200 (pending, not paid). Admin keeps COD statuses for HISTORICAL orders only.
- Order summary remains above payment (done earlier). Verified in preview (1280px). Live in PREVIEW — redeploy to publish.
- PENDING (needs user data, not built — do-not-invent): country selector + per-country state/postal validation; India Hyderabad vs AP/TS PIN eligibility lists; intl shipping (US tiers given; UK ₹520 ambiguous; AU metro postcode eligibility; EU rates not supplied); weight basis + courier rounding rules; FX/currency conversion API; Razorpay international card/currency capability verification.

## Changelog — 2026-07-14c (Country selector, shipping engine, currency estimates)
- New /app/frontend/src/lib/intl.js: COUNTRIES (IN/US/UK/AU + 15 EU, each with currency/symbol/dial/state+postal labels/regex), packWeightKg + cartWeightKg + roundUpHalfKg, computeShipping(region,postcode,weightKg), getFxRates() (open.er-api.com base INR, 6h localStorage cache, stale fallback), convertFromInr, fmtMoney.
- Checkout.jsx rebuilt: Country selector (native, type-to-search) default India; adaptive mobile dial-code prefix, State/Province + Postal labels & validation per country; order summary now shows Product subtotal / Shipping (or "Quote required") / Total (charged in INR) + currency estimate line with FX date (labelled estimate) for non-INR. Payment gating: online (Razorpay, INR) only when country=IN AND India PIN eligible AND rzp enabled AND priced; otherwise "quote required" + WhatsApp enquiry, submit disabled (no unconfirmed charge).
- Shipping rules (confirmed): IN Hyderabad(5000xx/5001xx)=₹100, TS/AP(50/51/52/53)=₹180, else quote. US weight bands up to 10kg (10kg=₹8,800 'subject to confirmation'), >10kg quote. UK 5-<10kg ₹850/kg, 10-<20kg ₹650/kg, <5kg & >=20kg quote. AU always quote (metro eligibility unverified). EU quote. Weight = sum of pack weights, rounded up to next 0.5kg, whole parcel.
- Backend server.py: OrderCreate gains country/postcode; india_shipping() computes delivery_charge into total; create_order rejects non-IN (400 international) and India quote-required PINs (400) — online charging restricted to eligible India destinations only. Razorpay INR unchanged; never auto-PAID.
- Verified (curl + mobile UI): IN Hyd 500081 total ₹600 online-eligible; IN AP 520001 ₹680; IN 110001 -> 400 quote; US -> 400 international + UI shows ₹2,900 est ($30.42) + enquiry; FX date shown; adaptive dial/labels. NOT exhaustively tested per-EU-country/every UK-AU weight tier (logic consistent). Live in PREVIEW — redeploy to publish.
- STILL AWAITING user confirmation: exact Hyderabad/AP/TS PIN lists (currently prefix rule), US 10kg rate confirmation, UK 20kg+ (₹600 vs ₹520), AU metro postcode eligibility, EU rates, Razorpay international enablement.

## Changelog — 2026-07-14 (International ZIP/PIN validation — verified; redeploy required)
- INVESTIGATED reported bug: live amyafoods.in rejected valid US ZIP (e.g. 11697) demanding a 6-digit PIN.
- ROOT CAUSE: the international checkout (country selector + country-aware postal validation) is correctly implemented in the codebase but was NEVER DEPLOYED. The LIVE site runs stale code that applies India's 6-digit PIN rule to every country. No code bug in current preview.
- VERIFIED on preview (actual tests, mobile 390 + desktop 1440):
  - US 11697 -> accepted, label "ZIP CODE", no 6-digit error; US 10001-1234 -> accepted; US 1234 -> rejected.
  - India 500081 -> accepted (online pay eligible, Hyderabad ₹100); India 50008 -> rejected (400 quote).
  - UK "SW1A 1AA" -> label "Postcode", accepted; AU 2000 -> label "Postcode", accepted.
  - COD blocked (frontend + backend HTTP 400). International (US/UK/AU/EU) -> online payment blocked, "Shipping quote required" + WhatsApp enquiry.
  - Order Summary renders FIRST (above the form). Our Story real Amulya & Leela kitchen photo at the very top (/products/our-story-kitchen.jpg, y≈65) — NOT replaced with AI imagery.
  - No horizontal overflow at 390 / 1440. Backend regression: test_admin_auth + test_admin_deletion = 12 passed, 2 skipped.
- ACTION REQUIRED: REDEPLOY so the live site serves the already-correct international checkout. No code change needed.

## Changelog — 2026-07-14 (Checkout: summary-before-payment + dual order options)
- Restructured /checkout flow to: (1) Your items → (2) Your details (name/country/mobile/email/address/city/state/PIN) → (3) Order summary with LIVE shipping (sits right after the address/PIN section, before payment) → (4) Two order options.
- Shipping updates live on PIN/ZIP entry (reactive). India supported PINs show the fee (Hyd ₹100 / AP-TS ₹180); unsupported India PIN now shows exact copy "Please contact AMYA to confirm delivery and shipping charges." and blocks online pay; international shows confirmed weight-tier rate (US/UK) or "Shipping quote required".
- Country change now clears state + postcode (revalidates) so India's 6-digit PIN rule never applies to US/UK/AU/EU. US ZIP (5 or ZIP+4) accepted; verified 11697 + 10001-1234.
- OPTION A "Pay Securely with Razorpay" shown only when India + confirmed shipping + Razorpay enabled + all items priced; sends exact final INR total (subtotal+shipping); server-side verify unchanged; duplicate protection via client_ref idempotency.
- OPTION B "Order on WhatsApp" (wa.me/919675334567) ALWAYS available; composes full readable message: customer name/mobile, full address+country+PIN, items/packs/qty/prices, product subtotal, shipping (or "Shipping quote required"), final total (only when confirmed), and clearly states WhatsApp is an enquiry that does not confirm payment. Email optional for WhatsApp, required for online pay.
- COD remains fully removed (frontend + backend 400). No prices/packs/stock/descriptions changed. Razorpay secret stays server-side.
- VERIFIED (actual tests, mobile 390 + desktop 1440): section order correct; IN 500081 → total ₹600 both buttons; IN 400001 → quote required + WhatsApp only + correct message; US 11697 → ZIP label, total ₹2,900, no Razorpay, WhatsApp only; country switch clears PIN; empty-field validation blocks WhatsApp; no horizontal overflow. NOT redeployed (awaiting user).

## Changelog — 2026-07-14 (International shipping breakdown + confirmed USA/UK per-kg rates)
- USA now FULLY CONFIRMED in computeShipping: flat brackets 0.5kg₹2400,1kg₹2900,2kg₹3400,3kg₹4300,4kg₹5000,5kg₹5800,6kg₹6500,7kg₹7000,8kg₹7800,9kg₹8200; 10–19kg ₹880/kg; 20kg+ ₹850/kg. Billable = 0.5kg min or rounded up to whole kg.
- UK confirmed: 5–9kg ₹850/kg, 10–19kg ₹650/kg. UK <5kg and 20kg+ (ambiguous "600 & 520") = QUOTE REQUIRED. Australia & Europe = QUOTE REQUIRED (no rates supplied).
- Order summary now shows an International shipping breakdown for US/UK/AU/EU: Parcel weight (billable), Shipping rate (₹/kg, only for per-kg tiers), Shipping charge, then Product subtotal + Final total (INR) + local-currency estimate with FX date. Quote states show "Quote required" and never a fabricated total.
- computeShipping returns structured { status, amount, billableKg, ratePerKg, note }. WhatsApp message now includes parcel weight + per-kg rate.
- Online Razorpay stays India-only (international payments not enabled on merchant account); international = WhatsApp enquiry. COD still removed. No prices changed. No fabricated rates.
- VERIFIED (node logic for all US/UK weight tiers + UI breakdown on preview mobile 390, US 11697 → 0.5kg/₹2,400/₹2,900/$30.42). NOT redeployed.
- STILL AWAITING CONFIRMATION: UK <5kg, UK 20kg+ (600 vs 520 conflict), Australia metro rates, Europe rates. Admin rate-management UI (requirement #6) NOT built yet — deferred as a separate task.
