# Hijraah MVP

Hijraah is a comprehensive, AI-powered immigration platform designed to simplify the migration journey for users in the MENA region targeting countries like Canada, Australia, and Portugal. It combines advanced tools like CRS calculators, application tracking, and document management with localized support to empower users to navigate complex immigration processes with confidence.

## 🚀 Features

Based on our current roadmap ([IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md)):

### Core Tools
- **CRS Calculator**: Advanced score calculation for Canada Express Entry.
- **Points Calculator**: Eligibility assessment for Australia skilled migration.
- **Application Tracking System**: End-to-end journey management with milestone tracking and progress visualization.
- **Document Management**: detailed checklists, OCR validation, and expiration tracking.

### AI Capabilities
- **AI Chat Assistant**: Powered by RAG (Retrieval-Augmented Generation) to answer immigration queries.
- **Document Intelligence**: OCR for data extraction and validation (consistency, completeness).
- **Express Entry DRAW Intelligence**: Real-time analysis of draw trends and score predictions.
- **SOP Generator**: Automated generation of Statement of Purpose documents.
- **Multi-Model Router**: Intelligent switching between Gemini, OpenAI, and Claude for optimal performance and cost.

### Localization & Support
- **Bilingual UI**: Full support for English and Arabic (RTL).
- **MENA Specialization**: Specific guidance for embassies, police certificates, and attestations in MENA countries.

## 🛠 Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/), [Shadcn UI](https://ui.shadcn.com/), Framer Motion
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **AI**: [Vercel AI SDK](https://sdk.vercel.ai/), Google Gemini
- **State Management**: Zustand, TanStack Query
- **PWA**: Supported (offline capabilities, installable)

## 🏁 Getting Started

### Prerequisites

- Node.js (v20.x or v22.x recommended)
- pnpm (Package Manager)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd hijraah-mvp
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Set up Environment Variables:**
   Create a `.env.local` file in the root directory. You can copy the structure below or refer to `server/_core/env.ts`.

   ```env
   # Database
   DATABASE_URL="postgresql://..."

   # Supabase (Public)
   NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"

   # Supabase (Private)
   SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

   # AI Providers
   GOOGLE_GENERATIVE_AI_API_KEY="your-gemini-key"
   # Optional: COHERE_API_KEY, MISTRAL_API_KEY, etc.

   # Stripe (Optional for payments)
   STRIPE_SECRET_KEY="sk_..."
   STRIPE_WEBHOOK_SECRET="whsec_..."
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_..."

   # Auth / App Config
   NEXT_PUBLIC_APP_ID="your-app-id"
   NEXT_PUBLIC_OAUTH_PORTAL_URL="https://auth.example.com"
   ```

4. **Run the development server:**
   ```bash
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📂 Project Structure

- `src/app`: Next.js App Router pages and layouts.
- `src/components`: React components (UI, features, layout).
- `src/actions`: Server Actions for form handling and data mutations.
- `src/lib`: Utility functions and shared logic.
- `src/hooks`: Custom React hooks (e.g., `useApplicationTracker`).
- `server`: Backend logic, database interactions, and AI services.
- `drizzle`: Database schema and migration files.
- `public`: Static assets (images, PWA manifest).

## 📜 Scripts

- `pnpm dev`: Start the development server with Turbopack.
- `pnpm build`: Build the application for production.
- `pnpm start`: Start the production server.
- `pnpm lint`: Run ESLint.
- `pnpm db:push`: Push Drizzle schema changes to the database.
- `pnpm test`: Run tests with Vitest.

## 🤝 Contributing

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes.
4. Push to the branch.
5. Open a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the `package.json` file for details.
