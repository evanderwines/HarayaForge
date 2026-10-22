# HarayaForge — Hero Project

A clean, editable, high-performance landing page project for HarayaForge. Converted from a monolithic inline data-URI file into a clean static architecture with zero build-step overhead.

---

## 🚀 Running Locally

You can serve this project with any local HTTP server:

```powershell
# Option 1: Python standard library
py -m http.server 5173

# Option 2: npx serve
npx serve .
```

Open your browser to:
- `http://localhost:5173` (Python) or `http://localhost:3000` (npx serve)

---

## 📁 File Map

```text
haraya/
├── index.html                   # Semantic, readable markup, meta tags, and structured content
├── favicon.ico                  # Root multi-resolution favicon (prevents 404s)
├── css/
│   └── styles.css               # Clean, indented stylesheet with design tokens & section headers
├── js/
│   └── main.js                  # Documented interactive modules: nav, observer, tilt, loop safety
├── assets/
│   ├── favicon.png              # 64x64 flame "H" mark favicon
│   ├── logo.webp                # HarayaForge brand logo
│   ├── icons/                   # Feature card icons (WebP)
│   │   ├── innovative.webp
│   │   ├── professional.webp
│   │   ├── creative.webp
│   │   ├── reliable.webp
│   │   └── forward-thinking.webp
│   └── video/                   # Hero machine presentation video
│       ├── machine.webm         # VP9 high-efficiency format (preferred)
│       ├── machine.mp4          # H.264 fallback format
│       └── machine-poster.jpg   # Video pre-load poster frame
├── backup/
│   └── hero-original.html       # Exact untouched original monolithic HTML backup
├── qa/                          # Visual diff proofs and regression test screenshots
├── scripts/
│   └── verify_qa.py             # Automated visual regression and interaction test suite
└── ASSUMPTIONS.md               # Technical notes and assumptions log
```

---

## 🎨 Customization Guide

### 1. Where to Change Text
All content is cleanly organized in `index.html`:
- **Navigation links**: `<header> <nav id="nav"> ... </nav> </header>`
- **Hero headline & subtext**: `<section class="hero">` inside `.txt`
- **Call-to-Action buttons**: Inside `.act` in `<header>`
- **Cards (Titles & Descriptions)**: `<ul class="cards">` inside `<li class="card">`

### 2. Where to Change Colors (Design Tokens)
All global color and gradient tokens are defined at the very top of `css/styles.css` in the `:root` selector:
```css
:root {
  --ink:    #030307;  /* Primary body text color */
  --nav:    #1D2241;  /* Navigation links and outline button borders */
  --navy:   #111543;  /* Card headings */
  --muted:  #64729D;  /* Lead paragraph and card descriptions */
  --red:    #F72703;  /* Accent brand red */
  --orange: #FF7A12;  /* Accent brand orange */
  --grad:   linear-gradient(90deg, #F72703, #FF7A12); /* Button and gradient accent */
}
```

### 3. Where to Update the Video
The hero machine video is located in `assets/video/`:
- Replace `assets/video/machine.webm` (VP9) and `assets/video/machine.mp4` (H.264 fallback).
- Replace `assets/video/machine-poster.jpg` with the first frame poster image (1920x1080).
- The `<video>` element in `index.html` already includes seamless looping, autoplay, muted, and responsive `mix-blend-mode: multiply` styling.

---

## 🌐 Deployment

Since this project uses vanilla HTML, CSS, and JavaScript with standard relative paths, it requires no build pipeline and can be deployed anywhere immediately:

### Netlify
1. Log in to [Netlify](https://app.netlify.com/).
2. Drag and drop the `haraya` folder directly into the Netlify "Sites" drop area.
3. Your site is instantly live with SSL and CDN caching.

### Vercel
1. Run `npx vercel` inside `C:\haraya` and follow the prompts, or:
2. Connect your Git repository to Vercel and set the root directory to `./` with no build command needed.

### GitHub Pages
1. Push this repository to GitHub.
2. In the repository settings, go to **Pages**.
3. Under **Branch**, select `main` and root `/`, then click **Save**.
