# Hijraah MVP - Project TODO

## Phase 1: Foundation & Setup
- [x] Database schema for users, profiles, subscriptions
- [x] Database schema for chat history and conversations
- [x] Database schema for documents and checklists
- [x] Database schema for immigration knowledge base
- [x] Database schema for CRS calculator data
- [x] Database schema for SOP templates and generations

## Phase 2: Bilingual UI Framework
- [x] Arabic/English language context and provider
- [x] RTL/LTR layout switching
- [x] Language toggle component in header
- [x] Translation utilities and hooks
- [x] Arabic font integration (Google Fonts - Noto Sans Arabic)
- [x] RTL-compatible navigation and layout components

## Phase 3: Authentication & User Management
- [x] Supabase Auth integration with social providers
- [x] User profile page with editable fields
- [x] User settings page with language preference
- [x] Protected route wrapper component
- [x] User onboarding flow for new registrations
- [x] Profile completion tracking

## Phase 4: AI Chat Assistant
- [x] Gemini 2.5 Pro integration helper
- [x] Chat interface component with streaming support
- [x] Chat history storage and retrieval
- [x] Arabic prompt engineering for immigration context
- [x] Conversation context management
- [x] Chat page with bilingual UI

## Phase 5: RAG Engine & Knowledge Base
- [x] Immigration policy knowledge graph schema
- [x] Google embeddings integration for semantic search
- [x] Vector storage setup (using database or external service)
- [x] RAG query pipeline with Gemini 2.5 Pro
- [x] Knowledge base seeding with Canada immigration data
- [ ] Policy update tracking and versioning

## Phase 6: Express Entry Calculator
- [x] CRS score calculation logic (official formula)
- [x] Multi-step questionnaire form
- [x] Score breakdown visualization
- [x] Improvement recommendations engine
- [x] Recent draw cutoff comparison
- [x] Calculator results page with detailed analysis

## Phase 7: Document Management System
- [x] Country-specific document checklist templates (Tunisia, Jordan, Lebanon, Morocco, Egypt, Sudan, Syria)
- [x] Document checklist generator based on user profile
- [x] File upload system with S3 integration
- [x] Document status tracking (pending, uploaded, verified, rejected)
- [x] Document preview and download
- [x] Upload progress indicatorsn in Arabic/English

## Phase 8: AI-Powered SOP Writer
- [x] SOP questionnaire form (background, goals, motivation)
- [x] Gemini 2.5 Pro SOP generation with specialized prompts
- [x] Iterative improvement workflow
- [x] SOP version history and comparison
- [x] PDF export functionality
- [x] SOP quality scoring and suggestions

## Phase 9: User Dashboard
- [x] Dashboard layout with progress overview
- [x] Application timeline component
- [x] Next steps recommendations
- [x] Document status summary cards
- [x] CRS score display widget
- [x] Quick actions and shortcuts

## Phase 10: OCR & Document Translation
- [x] Mistral OCR API integration (replaced Gemini vision)
- [x] Arabic document OCR processing
- [x] Automatic translation to English
- [x] OCR results review and editing interface
- [x] Support for common MENA document formats (PDF, JPG, PNG)
- [ ] Batch document processing

## Phase 11: Content Management System
- [x] Immigration guides database schema
- [x] Content versioning system
- [x] Automated translation with Gemini 2.5 Pro
- [x] Content editor interface for admins
- [ ] Policy update notifications
- [x] Public-facing guides pages

## Phase 12: Subscription & Payment System
- [x] Stripe integration setup
- [x] Subscription tiers configuration (Free, Essential, Premium, VIP)
- [x] Payment checkout flow
- [x] Subscription management page
- [x] Feature gating based on subscription tier
- [x] Usage tracking and limits for free tier

## Phase 13: WhatsApp Support Integration
- [ ] WhatsApp Business API integration
- [ ] Automated response system with Gemini 2.5 Pro
- [ ] Human agent escalation logic
- [ ] Support ticket tracking
- [ ] Premium/VIP user verification
- [ ] Support chat history

## Phase 14: Polish & Testing
- [ ] Responsive design testing (mobile, tablet, desktop)
- [ ] Arabic RTL layout verification
- [ ] Cross-browser compatibility testing
- [ ] Performance optimization
- [x] Error handling and user feedback
- [x] Loading states and skeletons
- [ ] Accessibility improvements
- [ ] SEO optimization for landing pages

## Phase 15: Deployment & Launch
- [ ] Environment variables configuration
- [ ] Stripe API keys setup
- [ ] Gemini API key configuration
- [ ] Google embeddings API setup
- [ ] Supabase project configuration
- [ ] Initial checkpoint creation
- [ ] Production deployment to Vercel

## User Request: Expand Country Support
- [x] Add Egypt to supported source countries
- [x] Add Sudan to supported source countries
- [x] Add Syria to supported source countries
- [x] Update document checklists for Egypt-specific requirements
- [x] Update document checklists for Sudan-specific requirements
- [x] Update document checklists for Syria-specific requirements


## Continuation Phase: Complete MVP Features

### Stripe Payment Integration
- [x] Install Stripe SDK and configure environment variables
- [x] Create Stripe checkout session endpoint
- [x] Implement webhook handler at /api/stripe/webhook
- [x] Handle payment success events (checkout.session.completed)
- [x] Handle subscription events (customer.subscription.created, updated, deleted)
- [x] Store subscription data in database

### Subscription Management UI
- [x] Create pricing page with tier comparison
- [x] Build subscription management page (Stripe customer portal)
- [x] Add upgrade/downgrade functionality
- [x] Display current subscription status
- [x] Show payment history
- [x] Handle subscription cancellation

### Usage Tracking & Limits
- [x] Track chat message usage per user
- [x] Track SOP generation usage per user
- [x] Enforce tier limits with helpful error messages
- [x] Display usage stats in dashboard
- [x] Show upgrade prompts when limits reached
- [x] Reset monthly usage counters

### SOP Writer UI
- [x] Create multi-step SOP questionnaire page
- [x] Build SOP display page with markdown rendering
- [x] Add SOP refinement interface
- [x] Implement SOP download as PDF/DOCX
- [x] Show SOP history and versions
- [x] Add navigation from dashboard to SOP writer

## Bug Fixes
- [x] Fix nested anchor tag error in Home page
- [x] Fix profile.get query returning undefined
- [x] Fix nested anchor tag in Dashboard page
- [x] Fix invalid hook call in Chat page mutation callback
- [x] Fix nested anchor tag in Chat page

## New Feature: Profile Page
- [x] Create comprehensive profile form with all immigration fields
- [x] Add form validation for required fields
- [x] Implement profile creation and update functionality
- [x] Add bilingual labels and placeholders
- [x] Show profile completion progress

## Enhancement: Pre-fill Calculator from Profile
- [x] Update Calculator page to fetch user profile data
- [x] Auto-populate calculator fields from profile
- [x] Show indicator when fields are pre-filled
- [x] Allow users to override pre-filled values

## Feature: SOP Writer UI
- [x] Create /sop/new page with guided questionnaire
- [x] Multi-step form for background, goals, and motivation
- [x] Create /sop/:id page to display generated SOP
- [x] Add refinement/regeneration options
- [x] Show SOP generation progress indicator
- [x] Add download SOP button (copy to clipboard for now)

## Enhancement: Dashboard Widgets
- [x] Display most recent CRS score with trend
- [x] Show document completion progress
- [x] Add quick action buttons (Calculate CRS, Upload Documents, Chat with AI)
- [x] Display profile completion percentage
- [x] Show recent chat conversations
