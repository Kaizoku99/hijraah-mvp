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
- [ ] User settings page with language preference
- [ ] Protected route wrapper component
- [ ] User onboarding flow for new registrations
- [x] Profile completion tracking

## Phase 4: AI Chat Assistant
- [ ] Gemini 2.5 Pro integration helper
- [ ] Chat interface component with streaming support
- [ ] Chat history storage and retrieval
- [ ] Arabic prompt engineering for immigration context
- [ ] Conversation context management
- [ ] Chat page with bilingual UI

## Phase 5: RAG Engine & Knowledge Base
- [ ] Immigration policy knowledge graph schema
- [ ] Google embeddings integration for semantic search
- [ ] Vector storage setup (using database or external service)
- [ ] RAG query pipeline with Gemini 2.5 Pro
- [ ] Knowledge base seeding with Canada immigration data
- [ ] Policy update tracking and versioning

## Phase 6: Express Entry Calculator
- [ ] CRS score calculation logic (official formula)
- [ ] Multi-step questionnaire form
- [ ] Score breakdown visualization
- [ ] Improvement recommendations engine
- [ ] Recent draw cutoff comparison
- [ ] Calculator results page with detailed analysis

## Phase 7: Document Management System
- [ ] Country-specific document checklist templates (Tunisia, Jordan, Lebanon, Morocco)
- [ ] Document checklist generator based on user profile
- [ ] Document upload to S3 with metadata
- [ ] Document status tracking (not started, in progress, complete)
- [ ] Document preview and download
- [ ] Document requirements explanation in Arabic/English

## Phase 8: AI-Powered SOP Writer
- [ ] SOP questionnaire form (background, goals, motivation)
- [ ] Gemini 2.5 Pro SOP generation with specialized prompts
- [ ] Iterative improvement workflow
- [ ] SOP version history and comparison
- [ ] PDF export functionality
- [ ] SOP quality scoring and suggestions

## Phase 9: User Dashboard
- [ ] Dashboard layout with progress overview
- [ ] Application timeline component
- [ ] Next steps recommendations
- [ ] Document status summary cards
- [ ] CRS score display widget
- [ ] Quick actions and shortcuts

## Phase 10: OCR & Document Translation
- [ ] Gemini 2.5 Pro vision API integration
- [ ] Arabic document OCR processing
- [ ] Automatic translation to English
- [ ] OCR results review and editing interface
- [ ] Support for common MENA document formats (PDF, JPG, PNG)
- [ ] Batch document processing

## Phase 11: Content Management System
- [ ] Immigration guides database schema
- [ ] Content versioning system
- [ ] Automated translation with Gemini 2.5 Pro
- [ ] Content editor interface for admins
- [ ] Policy update notifications
- [ ] Public-facing guides pages

## Phase 12: Subscription & Payment System
- [ ] Stripe integration setup
- [ ] Subscription tiers configuration (Free, Essential, Premium, VIP)
- [ ] Payment checkout flow
- [ ] Subscription management page
- [ ] Feature gating based on subscription tier
- [ ] Usage tracking and limits for free tier

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
- [ ] Error handling and user feedback
- [ ] Loading states and skeletons
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
