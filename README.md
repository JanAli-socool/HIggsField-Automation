# Higgsfield AI Rebuild

A 1-day rebuild of [higgsfield.ai](https://higgsfield.ai) — an AI-native creative suite for video, image, and motion design.

## 🎯 Project Scope

This rebuild focuses on the core product experience:

- **Landing Page** — Hero, model showcase, effects preview, Cinema Studio teaser, pricing
- **Effects Gallery** — 20 cinematic AI effects with hover-to-play video previews
- **Unified Create Page** — Two modes:
  - **Prompt Mode**: Text-to-video with model selector, asset upload, resolution/aspect controls
  - **Template Mode**: Browse effects, select one, upload reference assets, generate

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS v4 |
| Animations | Framer Motion |
| State | Zustand |
| Routing | React Router v6 |
| Icons | Lucide React |
| Video | Native `<video>` + IntersectionObserver |

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📁 Project Structure

```
src/
├── components/
│   ├── layout/          # Header, Footer
│   ├── landing/         # Hero, ModelShowcase, EffectsPreview, etc.
│   ├── create/          # CreatePage, PromptMode, TemplateMode, etc.
│   ├── effects/         # EffectsGallery, EffectCard, EffectDetailDrawer
│   ├── ui/              # Button, VideoPlayer, Badge, Tabs, Drawer, etc.
│   └── common/          # Container
├── hooks/               # useVideoHover, useDrawer, useToast
├── stores/              # Zustand store (useCreateStore)
├── data/                # Mock data (effects, models, categories)
├── types/               # TypeScript interfaces
├── styles/              # Global styles (Tailwind v4)
├── App.tsx              # Routing & layout
└── main.tsx             # Entry point
```

## 🎨 Design System

- **Background**: `#0A0A0F`
- **Surface**: `#14141E`
- **Primary**: `#A855F7` (purple)
- **Secondary**: `#06B6D4` (cyan)
- **Fonts**: Space Grotesk (display) + Inter (body)

## 📦 Key Features Implemented

1. **Hover-to-play video previews** — IntersectionObserver + mouse events for performance
2. **Unified Create interface** — Single page for both prompt and template workflows
3. **Effect detail drawer** — Slide-up panel with full specs and "Use" action
4. **Generation queue** — Toast-style queue with progress simulation
5. **Responsive design** — Mobile-first, breakpoints at 640px, 1024px, 1280px
6. **Accessibility** — Keyboard navigation, ARIA labels, focus management

## 🌐 Deployment

Deployed on Vercel: `https://higgsfield-rebuild.vercel.app`

```bash
# Deploy to Vercel
vercel --prod
```

## 📝 License

MIT — Built for the 8x Assignment.