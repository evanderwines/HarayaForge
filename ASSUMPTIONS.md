# Technical Assumptions & Architectural Decisions

This document logs all engineering decisions and assumptions made during the decomposition of the monolithic `HarayaForge – Hero.html` into a modular static project.

---

### 1. Asset Extraction & Video Sources
- **Data URIs Extracted**: Exactly 8 data URIs were present in the source file:
  - 1 logo WebP (`assets/logo.webp`)
  - 1 video poster JPEG (`assets/video/machine-poster.jpg`)
  - 1 machine video MP4 (`assets/video/machine.mp4`)
  - 5 card icons WebP (`assets/icons/innovative.webp`, `professional.webp`, `creative.webp`, `reliable.webp`, `forward-thinking.webp`)
- **Video Fallback & WebM Source**: Copied `machine.webm` from workspace root to `assets/video/machine.webm`. In `index.html`, replaced the direct `src` attribute on `<video>` with dual `<source>` elements:
  1. `<source src="assets/video/machine.webm" type='video/webm; codecs="vp9"'>`
  2. `<source src="assets/video/machine.mp4" type="video/mp4">`
- **Video Attributes**: Maintained all original attributes (`autoplay`, `muted`, `loop`, `playsinline`, `preload="auto"`, `aria-hidden="true"`, `width="1920"`, `height="1080"`, and `poster="assets/video/machine-poster.jpg"`).
- **Zero Re-encoding**: All binary streams extracted from the base64 payload were written byte-for-byte directly without re-compression or alteration.

---

### 2. Favicon Generation
- The leftmost 24% of `assets/logo.webp` contains the Haraya flame "H" mark on a solid white background (RGB).
- To ensure optimal rendering in browser tabs across both dark mode and light mode OS environments, the white/near-white background was given a transparent alpha channel with anti-aliased edge blending, trimmed to its content bounding box, and scaled proportionately into a 64x64 PNG (`assets/favicon.png`).
- Linked via `<link rel="icon" href="assets/favicon.png">` in `index.html`.

---

### 3. CSS Decomposition & Design Tokens
- The `<style>` block from the original file was extracted byte-for-byte into `css/styles.css`.
- A concise header comment was added at the top documenting the `:root` design tokens:
  - `--ink`: `#030307`
  - `--nav`: `#1D2241`
  - `--navy`: `#111543`
  - `--muted`: `#64729D`
  - `--red`: `#F72703`
  - `--orange`: `#FF7A12`
  - `--grad`: `linear-gradient(90deg, #F72703, #FF7A12)`
- Documented the existing CSS architectural sections: `NAV`, `HERO`, `MACHINE`, `CARDS`, `INTRO`, `RESPONSIVE`.

---

### 4. JavaScript Decomposition & Loop Safety Net
- The `<script>` block was extracted into `js/main.js` and loaded via `<script src="js/main.js" defer></script>`.
- Preserved the existing IIFE and exact logic for mobile navigation toggle, intersection observer for visibility, and pointer-driven 3D parallax tilt.
- Added explicit comments demarcating:
  - Mobile menu
  - Video visibility
  - Loop safety net
  - 3D tilt
- Added a loop safety net listener `v.addEventListener('ended', function(){ v.currentTime = 0; v.play().catch(function(){}); });` to guarantee continuous playback across all browser rendering engines even if native video loop events stall.

---

### 5. Git & QA Hygiene
- Ensured `backup/` and `qa/` directories are explicitly unignored in `.gitignore`.
- Ignored transient OS and development artifacts (`node_modules`, `.DS_Store`, `Thumbs.db`).
- Original source file preserved unchanged at `backup/hero-original.html`.

---

### 6. Code Structuring & Cleanup of Unused Assets
- **Code Readability & Formatting**:
  - `index.html`: Formatted with clean indentation, semantic block grouping, and clear section dividers.
  - `css/styles.css`: Fully unminified and formatted with consistent 2-space indentation, expanded property blocks, and organized into 8 numbered sections matching the design system. All property values and design tokens remain 100% byte-for-byte exact.
  - `js/main.js`: Replaced minified single-letter identifiers (`n`, `b`, `v`, `g`, `h`, `tx`, `ty`, `cx`, `cy`, `raf`, `go`) with clear, descriptive names (`navMenu`, `burgerButton`, `videoElement`, `glowElement`, `heroSection`, `targetTiltX`, `targetTiltY`, etc.). Added comprehensive JSDoc comments.
- **Removal of Unused Root Files**:
  - Removed duplicate 3.4 MB monolithic `HarayaForge – Hero.html` from the workspace root (safely preserved in `backup/hero-original.html`).
  - Removed duplicate root video files (`machine.mp4`, `machine.webm`), as both are properly housed inside `assets/video/`.
  - Removed loose uncompressed raw PNG files (`complete_logo_transparent.png`, `creative_icon.png`, `forwardthinking_icon.png`, `innovative_icon.png`, `professional_icon.png`, `reference.png`, `reliable_icon.png`) and notes (`HarayaForge – Hero.md`).
  - Moved QA verification test runner to `scripts/verify_qa.py`.

---

### 7. Layout Refinements & "Start a Project" Button Styling
- **Typography & Element Scaling**:
  - Balanced feature card dimensions, card icons (`clamp(52px, 5.2vw, 82px)`), card headings, text, and hero typography.
- **Top Spacing**:
  - Added clean vertical breathing room between the navigation header and hero section (`margin-bottom: clamp(22px, 2.8vw, 48px);`).
- **Feature Cards Bottom Alignment**:
  - Anchored the 5 feature cards to the bottom of the viewport using flexbox container alignment (`main { display: flex; flex-direction: column; justify-content: space-between; }` and `.cards { margin: auto 0 0; }`).
- **CTA Button Relocation**:
  - Moved "Book a Free Consultation" button into `.hero-act` positioned left directly beneath the lead text (`We design and build websites...`).
- **Hero Vertical Alignment ("Mid")**:
  - Added vertical auto-margins (`margin: auto 0;`) to `.hero` on desktop so the entire hero section ("Forging Ideas into Digital Solutions" and the 3D machine) is balanced and vertically centered between the top navigation bar and the bottom cards. Reset to natural top flow (`margin: 0;`) for mobile viewport view.
- **Fixed Machine Video (No Hover Tilt)**:
  - Removed the pointer 3D parallax tilt listener from `js/main.js` and removed dynamic `will-change: transform` from `.machine video` in `css/styles.css`.
  - Machine video remains completely fixed and stationary in position without tilting, shifting, or reacting to cursor movement/hover.
- **Black "Start a Project" Button**:
  - Implemented `.btn.dark` styling with an obsidian dark aesthetic (`#090a10`), subtle dark borders (`rgba(17, 21, 67, 0.12)`), smooth hover transitions (`#191c2b`), and depth shadows (`rgba(9, 10, 16, 0.18)`).
- **Glassmorphic Feature Cards**:
  - Transformed the 5 feature value cards (`.card`) into glassmorphic components with dual-layer reflection sheen (`::before` angled edge reflection, `::after` vertical sheen overlay), frosted backdrop-filter blur (`blur(8px) saturate(60%)`), and translucent inner bevel glow (`inset 0px 0px 4px 2px rgba(255, 255, 255, 0.55)`).
- **Floating Transparent Glass Top Bar**:
  - Restyled `header` as an authentic, non-whitish translucent glass floating navigation island using the exact glass-nav parameters:
    - Background: `rgba(255, 255, 255, 0.08)` (ultra-sheer transparency without milky white haze)
    - Backdrop Filter: `blur(14px) saturate(140%)` with `-webkit-backdrop-filter` vendor prefix
    - Border: `1px solid rgba(255, 255, 255, 0.18)`
    - Border Radius: `16px`
    - Box Shadow: `rgba(0, 0, 0, 0.18) 0px 2px 4px;` (clean, compact elevation)
    - Removed previous milky gradient overlay `::before` pseudo-element to guarantee crystal glass transparency while preserving child layer interactivity (`position: relative; z-index: 1`).
- **Navigation Typography (Chillax-Semibold)**:
  - Staged `Chillax-Semibold.ttf` in [assets/fonts/Chillax-Semibold.ttf](file:///c:/haraya/assets/fonts/Chillax-Semibold.ttf) and registered `@font-face` for `Chillax` (`font-weight: 600`) with fallback to workspace root.
  - Applied `font-family: 'Chillax', system-ui, -apple-system, sans-serif;` with `font-weight: 600`, `font-size: clamp(12px, .86vw, 15px)`, `letter-spacing: .025em`, and uppercase styling to navigation links (`Home`, `Services`, `Projects`, `About`, `Contact`).
  - Added font preloading `<link rel="preload" href="assets/fonts/Chillax-Semibold.ttf" as="font" type="font/ttf" crossorigin>` in `index.html` to eliminate FOUT (flash of unstyled text).

---

### 8. Services Section Implementation ("What We Forge")
- **Content & Architecture**:
  - Implemented `<section id="services" class="services-section" aria-labelledby="services-title">` directly inside `<main>` after the 5 brand-value cards (`<ul class="cards">`).
  - Section header: Eyebrow label `"OUR SERVICES"`, title `<h2>What We Forge</h2>`, and lead text *"From your first idea to a working digital solution, we help bring your vision to life through technology, creativity, and practical expertise."*
  - Exactly three primary service cards:
    1. **(01) Software & Digital Solutions**: Custom business management systems, responsive websites & web apps, mobile app development, and workflow automation / API integrations.
    2. **(02) Consulting & Technical Guidance**: System consultation & requirements analysis, UI/UX design & prototyping, database architecture, debugging & QA, and deployment assistance & training.
    3. **(03) Academic Project Support**: Undergraduate, master's & doctoral guidance, system architecture mentoring & code review, validation & testing, documentation & technical writing, and demonstration / defense preparation.
  - Consultation CTA banner: *"Have an idea? Let's forge it."* with short description and **"Book a Free Consultation"** button.
  - Action links connected to `mailto:harayaforge@gmail.com` with pre-filled subject queries (`Inquiry regarding Software & Digital Solutions`, `Inquiry regarding Consulting & Technical Guidance`, `Inquiry regarding Academic Project Support`, `Consultation Request - HarayaForge`).
- **Styling & Design System Consistency**:
  - Scoped CSS rules (`.services-section`, `.services-header`, `.services-grid`, `.service-card`, `.services-cta-banner`) adhering to brand tokens (`--navy`, `--ink`, `--muted`, `--red`, `--grad`).
  - Background transition: Subtle 32px rounded top envelope with `linear-gradient(180deg, rgba(248, 249, 253, 0.75) 0%, rgba(255, 255, 255, 1) 100%)` and top border `1px solid rgba(17, 21, 67, 0.08)`.
  - Cards: Crisp `#ffffff` surfaces, rounded corners (`22px`), top gradient highlight line on hover, lightweight custom SVGs in 50px pill containers, and micro-transitions on action links (`translateX(4px)`).
- **Home Fold Preservation & Navigation Offset**:
  - Balanced `.hero` min-height on desktop (`min-height: max(25vw, calc(100svh - clamp(80px, 8vw, 110px) - clamp(210px, 15vw, 250px)))`) to ensure the 5 brand cards remain anchored to the bottom of the initial viewport fold on desktop, preventing any vertical collapse.
  - Updated Services navigation link from `href="#"` to `href="#services"`.
  - Configured `scroll-margin-top: clamp(80px, 8vw, 110px)` on `.services-section` and `scroll-behavior: smooth` on `html` (with `scroll-behavior: auto !important` for `prefers-reduced-motion: reduce`).
  - Added mobile menu auto-close on link click in `js/main.js`.
- **Feature Cards Slight Upward Lift**:
  - Calibrated `.hero` desktop min-height (`max(25vw, calc(100svh - clamp(80px, 8vw, 110px) - clamp(245px, 18vw, 290px)))`) and `.cards` padding (`clamp(14px, 1.4vw, 22px) 4.2vw clamp(24px, 2.4vw, 38px)`), lifting the five brand-value cards ~37px upward above the bottom viewport edge for cleaner visual clearance.

---

### 9. Dynamic Scroll Glassmorphism, Animated Sliding Nav Indicator & Modern Scrollbar
- **Dynamic Fixed-Sticky Header Glassmorphism (`header.scrolled`)**:
  - Implemented `position: fixed` with exact floating margins (`top: clamp(10px, 1.1vw, 20px); left: 0; right: 0; width: calc(100% - 2 * 4.2vw); max-width: calc(1800px - 2 * 4.2vw); margin: 0 auto; z-index: 1000;`) coupled with precise top padding on `<main>` (`calc(clamp(10px, 1.1vw, 20px) + clamp(58px, 4.8vw, 82px) + clamp(24px, 2.5vw, 44px))`), eliminating the known CSS Grid / `overflow-x` bug where native `position: sticky` within grid tracks would stop sticking and scroll off-screen.
  - Starts in sheer floating glass state (`rgba(255, 255, 255, 0.12)`, `blur(14px)`).
  - When scrolling down past 30px, transitions smoothly into a rich, luminous frosted glassmorphism effect (`background: rgba(255, 255, 255, 0.78); backdrop-filter: blur(24px) saturate(190%); border: 1px solid rgba(255, 255, 255, 0.88); box-shadow: 0 16px 40px -8px rgba(17, 21, 67, 0.12), 0 4px 14px -2px rgba(17, 21, 67, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.95), inset 0 -1px 0 rgba(17, 21, 67, 0.04);`).
  - Specular highlight rim and multi-layer soft shadows ensure high legibility and contrast across both light hero elements and colorful card content.
  - Smoothly reverts to sheer state upon scrolling back to top.
- **Sliding Active Navigation Indicator (`.nav-indicator`) & Scrollspy**:
  - Engineered a shared sliding underline indicator (`<span class="nav-indicator"></span>`) styled with HarayaForge's brand gradient (`linear-gradient(135deg, #FF7A12, #F72703)`), rounded capsule ends (`border-radius: 999px`), and a vibrant ambient glow (`box-shadow: 0 0 10px rgba(247, 39, 3, 0.45)`).
  - Silky physics-based sliding animation using `transition: transform 0.38s cubic-bezier(0.16, 1, 0.3, 1), width 0.38s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease`.
  - Coordinates calculated dynamically via `getBoundingClientRect()` relative to `navMenu`, perfectly matching the exact text width and horizontal offset of the active link.
  - Interactive hover preview: gliding to any hovered desktop menu link and snapping back to the active section when mouse leaves.
  - Scrollspy dynamically triggers active indicator relocation between **Home** and **Services** as user scrolls through sections.
  - Smooth click navigation scrolls with sticky header offset (`scroll-padding-top` and `scroll-margin-top: clamp(80px, 8vw, 115px)`).
  - Mobile responsiveness: hides horizontal sliding indicator on mobile drawers (`max-width: 900px`) and displays an elegant left-accent bar with font emphasis (`border-left: 2.5px solid #F5360A`).
  - Full accessibility compliance with `prefers-reduced-motion: reduce` disabling transitions.
- **Modern Minimalist Scrollbar — Gradient Orange**:
  - Slim 7px vertical pill scrollbar for WebKit/Chromium/Blink engines (`::-webkit-scrollbar`).
  - Default thumb styled in HarayaForge's signature flame gradient (`linear-gradient(180deg, #FF7A12 0%, #F72703 100%)`) with a soft ambient warm glow (`box-shadow: 0 0 6px rgba(247, 39, 3, 0.35)`).
  - Hover state intensifies to radiant flame (`linear-gradient(180deg, #FF9431 0%, #FF3814 100%)`) with enhanced neon glow (`box-shadow: 0 0 12px rgba(247, 39, 3, 0.6)`).
  - Active drag state deepens to `#F72703 -> #D81E00`.
  - Cross-browser compatibility with Firefox standard `scrollbar-width: thin; scrollbar-color: #FF7A12 rgba(245, 247, 250, 0.4);`.

---

### 10. Dynamic Cursor-Triggered Pixelated Particle Trail Animation
- **Pure White Idle Background**:
  - By default, the website background remains 100% clean and pristine white.
  - Zero static dots, zero permanent grid patterns, and zero continuously running background canvas loops when the cursor is idle (0% idle CPU/GPU usage).
- **Cursor-Triggered Emergence**:
  - Animation activates strictly when the cursor moves across the hero area.
  - Generates an organic trail of circular pixel dots and distinctive hollow rings inspired directly by the reference image.
  - Dynamic lateral wave dispersion perpendicular to cursor velocity:
    - **Core particles** (near cursor path): Vibrant HarayaForge flame gradient (`#FF7A12` / `#F72703`) with subtle ambient glow and larger radii (`2.4px - 4.5px`).
    - **Mid particles**: Warm golden amber transitions.
    - **Outer particles**: Subtle tech gray (`rgba(148, 163, 184)`) with smaller radii (`1.2px - 2.0px`).
    - **Hollow rings**: ~12% distribution of open circular rings with clean outline strokes (`lineWidth: 1.3px`), matching the distinctive graphic detail of the reference image.
- **Particle Lifecycle & Decay**:
  - Particles quickly bloom to full size upon birth, float with subtle momentum, and smoothly shrink, fade out, and disappear completely over ~0.9s to 1.3s.
  - Once all particles fade away, the canvas clears completely and `requestAnimationFrame` automatically pauses.
- **Integration & Accessibility**:
  - Positioned via `.dot-wave-canvas` with `pointer-events: none` and `z-index: 0` behind website text and 3D graphics, ensuring zero interference with link clicks, button actions, or scrolling.
  - Touch support via `pointerdown` and `pointermove` drag interactions.
  - Respects `prefers-reduced-motion: reduce` by disabling particle generation for users with motion sensitivity.
  - Leaves all approved Home/Hero section, Services cards, navigation, typography, and existing layouts 100% unchanged.

---

### 11. Multi-Section Particle System Extension (Hero + Services)
- **Modular Factory Architecture**:
  - Refactored particle canvas logic into a reusable `setupParticleCanvas(canvasId, containerId)` instance manager.
  - Instantiated for both `#home` (`dot-wave-canvas`) and `#services` (`services-dot-canvas`).
  - Each section maintains its own independent context, particle pool, and event listeners that only activate when the cursor moves within that specific section's boundaries.
- **Services Section Visual Harmony**:
  - The canvas sits behind `.services-container` (`z-index: 1`), allowing the glowing orange particles, hollow rings, and gray periphery dots to organically emerge through section margins, headers, and card gaps.
  - Service cards remain 100% legible on solid white elevated surfaces with smooth hover lifts, shadows, and pill tags.
  - Clean bounds clipping with `.services-section { overflow: hidden; }` respecting the 32px top corner radius.
- **Zero-Overhead Idle State**:
  - When idle, both canvases remain 100% pure clean white with no remaining dots.
  - `ResizeObserver` and window resize/load listeners guarantee responsive canvas dimensions even during dynamic layout shifts.

---

### 12. Sticky Cover-Reveal Scroll Transition (Home -> Services)
- **Architecture & Technique**:
  - Pinned Home container: `.hero-pinned-container` positioned at `position: sticky; top: 0; height: 100svh; height: 100vh; z-index: 1;`.
  - Services section: `.services-section` positioned at `position: relative; z-index: 2; min-height: 100svh; background: #ffffff; border-radius: 0;`.
  - Header: `header` positioned at `position: fixed; top: ...; z-index: 1000;`.
- **Cover Effect**:
  - As the user scrolls down, native scrolling brings the opaque Services section up from below the fold (`y = 100svh`), sliding over the pinned hero like a sheet of paper.
  - Straight top edge (`border-radius: 0`) and pure opaque white surface (`background: #ffffff`) ensure zero transparency or bleed-through.
  - Physical elevation shadow (`box-shadow: 0 -24px 48px -8px rgba(17, 21, 67, 0.10), 0 -1px 0 rgba(17, 21, 67, 0.08)`) enhances depth separation.
- **GPU-Accelerated Depth Polish**:
  - Subtle depth scale (`1.0 -> 0.96`) and dark overlay (`0.0 -> 0.35`) driven by scroll progress.
  - Uses CSS scroll-driven animations (`@supports (animation-timeline: scroll())`) for zero-JS GPU execution in modern Chromium.
  - Automatic `requestAnimationFrame` + passive scroll listener fallback for Safari, Firefox, and legacy browsers.
  - Respects `prefers-reduced-motion: reduce`: scales and overlays are suppressed while maintaining the clean sticky layout.
- **Mobile Adaptability (360px, 768px, 1440px)**:
  - Mobile containers use horizontal scrolling for `.cards` (`overflow-x: auto; scrollbar-width: none`) so all 5 cards remain interactive without vertical clipping or layout shift.
  - `main` has `padding-top: 0` so the sticky hero is flush with `top: 0` on all viewports.

---

### 13. Clean White Placeholder Sections (Process, About, Contact)
- **Structure & Layout**:
  - Added `<section id="process" class="blank-section" aria-label="Process"></section>`
  - Added `<section id="about" class="blank-section" aria-label="About"></section>`
  - Added `<section id="contact" class="blank-section" aria-label="Contact"></section>`
- **Styling**:
  - Pure opaque white surface (`background: #ffffff`), zero text, buttons, or placeholder content.
  - `min-height: 100svh; min-height: 100vh; position: relative; z-index: 2;` so scrolling through each section continues seamlessly above the pinned hero.
  - `scroll-margin-top: clamp(80px, 8vw, 115px)` for exact sticky header offset alignment.
- **Navigation Integration**:
  - Header links updated to `#process`, `#about`, `#contact`.
  - Dynamic scrollspy in `js/main.js` expanded to automatically slide the indicator to Process, About, and Contact as the user scrolls into each respective section.




