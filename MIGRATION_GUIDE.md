# Next.js 16 Migration Guide

## Quick Start

After completing all file changes, run these commands:

```bash
# 1. Rename package.json files
mv package.json package.vite.json
mv package.next.json package.json

# 2. Rename tsconfig files  
mv tsconfig.json tsconfig.vite.json
mv tsconfig.next.json tsconfig.json

# 3. Install dependencies
pnpm install

# 4. Run development server
pnpm dev
```

## Files Created

### App Directory Structure
```
src/
├── app/
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Home page
│   ├── globals.css          # Global styles
│   ├── providers.tsx        # Client providers
│   ├── not-found.tsx        # 404 page
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   ├── dashboard/page.tsx
│   ├── chat/page.tsx
│   ├── calculator/page.tsx
│   ├── documents/
│   │   ├── page.tsx
│   │   └── ocr/page.tsx
│   ├── profile/page.tsx
│   ├── sop/
│   │   ├── page.tsx
│   │   ├── new/page.tsx
│   │   └── [id]/page.tsx
│   ├── pricing/page.tsx
│   ├── guides/
│   │   ├── page.tsx
│   │   └── [slug]/page.tsx
│   └── api/
│       ├── trpc/[trpc]/route.ts
│       ├── ai/chat/route.ts
│       ├── auth/callback/route.ts
│       └── stripe/webhook/route.ts
├── lib/
│   ├── trpc.ts
│   ├── supabase.ts
│   └── utils.ts
├── hooks/
│   └── useAuth.ts
├── contexts/
│   ├── LanguageContext.tsx
│   └── ThemeContext.tsx
└── const.ts
```

## Manual Steps Required

### 1. Copy Components
Copy the following directories from `client/src/` to `src/`:
- `components/` (all UI components)

### 2. Create Page Components
Create wrapper components in `src/components/pages/` for dynamic imports:
- ChatPage.tsx
- CalculatorPage.tsx
- DocumentsPage.tsx
- DocumentOcrPage.tsx
- ProfilePage.tsx
- SopListPage.tsx
- SopNewPage.tsx
- SopDisplayPage.tsx
- PricingPage.tsx
- GuidesPage.tsx
- GuideDetailPage.tsx

### 3. Update Imports in Components
Replace in all component files:
- `from "wouter"` → `from "next/link"` and `from "next/navigation"`
- `<Link href="...">` stays the same (Next.js Link)
- `useLocation()` → `usePathname()` from `next/navigation`
- `setLocation("/path")` → `router.push("/path")` using `useRouter()`
- `import.meta.env.VITE_*` → `process.env.NEXT_PUBLIC_*`

### 4. Add 'use client' Directive
Add `'use client'` at the top of all components that use:
- React hooks (useState, useEffect, etc.)
- Browser APIs
- Event handlers

### 5. Update Environment Variables
Rename in `.env`:
```
VITE_SUPABASE_URL → NEXT_PUBLIC_SUPABASE_URL
VITE_SUPABASE_ANON_KEY → NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### 6. Update Server Context
Update `server/_core/context.ts` to work with Next.js fetch API adapter.

## Files to Delete (After Migration)

- `vite.config.ts`
- `vitest.config.ts`
- `client/` directory
- `server/_core/index.ts` (Express server)
- `server/_core/vite.ts`

## Key Differences

| Vite | Next.js 16 |
|------|------------|
| `import.meta.env.VITE_*` | `process.env.NEXT_PUBLIC_*` |
| `wouter` routing | File-based routing |
| Express backend | API Routes |
| Manual SSR | Automatic SSR/SSG |
| Vite dev server | Turbopack |

## Testing the Migration

1. Start dev server: `pnpm dev`
2. Test each route works
3. Test authentication flow
4. Test tRPC calls
5. Test AI chat streaming
6. Test Stripe webhooks
