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
- [x] Batch document processing

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
- [x] WhatsApp Business API integration
- [ ] Automated response system with Gemini 2.5 Pro
- [ ] Human agent escalation logic
- [ ] Support ticket tracking
- [ ] Premium/VIP user verification
- [ ] Support chat history

## Phase 14: Polish & Testing
- [x] Responsive design testing (mobile, tablet, desktop)
- [x] Arabic RTL layout verification
- [x] Cross-browser compatibility testing
- [x] Performance optimization
- [x] Error handling and user feedback
- [x] Loading states and skeletons
- [x] Accessibility improvements
- [x] SEO optimization for landing pages

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

---

## Phase 16: UX Improvements (from Comprehensive Audit)

### P0 - Critical Priority

#### Onboarding Wizard
- [x] Create 5-step onboarding wizard for new users
  - [x] Step 1: Welcome + language confirmation
  - [x] Step 2: Basic info (nationality, source country, current country)
  - [x] Step 3: Immigration goal selection (Express Entry, Study, Family)
  - [x] Step 4: Quick language ability self-assessment
  - [x] Step 5: First action prompt (Calculate CRS or Generate Checklist)
- [x] Add first-time user detection via localStorage
- [x] Auto-save onboarding progress
- [x] Show "Quick Start Guide" modal for returning incomplete users

#### Calculator Bug Fixes
- [x] Fix NaN validation errors (invalid input syntax for integer)
- [x] Add parseInt fallback values for all number inputs
- [x] Add min/max validation on number inputs
- [x] Prevent form submission with invalid values

#### Profile Multi-Step Conversion
- [x] Convert single-page profile form to 5-step wizard
  - [x] Step 1: Personal Information
  - [x] Step 2: Education
  - [x] Step 3: Work Experience
  - [x] Step 4: Language Proficiency
  - [x] Step 5: Immigration Goals
- [x] Add inline validation with real-time feedback
- [x] Implement autosave to localStorage + server
- [x] Add progress indicator bar between steps
- [x] Add "Save Draft" button functionality

### P1 - High Priority

#### SOP Writer Improvements
- [x] Implement localStorage autosave between steps
- [x] Add "Resume draft" option for returning users
- [x] Add character count with recommended range (150-300 words)
- [x] Add per-step validation before allowing "Next"
- [x] Add estimated generation time indicator
- [x] Pre-populate prompts with profile data where available

#### Calculator UX Enhancements
- [x] Add real-time score preview in sidebar/sticky header
- [x] Add IELTS-to-CLB conversion helper
- [x] Show point value next to each switch (e.g., "Provincial Nomination (+600)")
- [x] Add score improvement simulator ("If you improve IELTS to 7, gain +30 points")
- [x] Auto-scroll to results after calculation
- [x] Add "Points impact" tooltip on each field

#### Document Management Improvements
- [x] Add document preview thumbnail after upload
- [x] Show file name and size after successful upload
- [x] Add document specifications (size limits, formats, required info)
- [x] Rename "Verify" button to "Mark as Ready"
- [x] Show tier limits upfront ("3/5 checklists used on Free tier")
- [x] Integrate OCR as upload option ("Upload" vs "Scan & Upload")
- [x] Add upload progress indicator

#### Landing Page Trust
- [x] Add testimonials carousel with user stories
- [x] Add "Trusted by X users" counter
- [x] Add country flags for supported source countries
- [x] Add pricing tier comparison section
- [x] Complete or remove "24/7 support" claim if WhatsApp not ready

#### General UX Enhancements
- [x] Add 'Immigration Journey' timeline/roadmap component (Profile → CRS → Documents → Application)
- [x] Implement actionable document status badges (e.g., "Expired - Upload New")
- [x] Add specific recovery actions to error messages (not just "Error", but "Try X")

### P2 - Medium Priority

#### Chat Improvements
- [x] Generate context-aware follow-up suggestions based on conversation
- [x] Show sample conversation preview or efficient "What can I do?" explainer
- [x] Add thumbs up/down rating on AI responses
- [x] Add conversation rename option
- [x] Add "Ask in Arabic/English" quick toggle in chat
- [x] Implement fallback responses when RAG has no sources
- [x] Remove console.log debug statements from production

#### Document OCR & Translation
- [x] Integrate OCR as upload option ("Upload" vs "Scan & Upload")
- [x] Add auto-translate toggle with side-by-side comparison view
- [x] Add upload progress indicator

#### SOP Advanced Features
- [x] Add AI-generated prompt suggestions based on profile data
- [x] Show generation progress steps ("Analyzing background... Creating introduction...")
- [x] Allow inline editing of generated SOP sections
- [x] Add "Regenerate section" option for specific parts

#### Dashboard Focus Mode
- [x] Implement contextual CTAs based on user state
  - [x] No CRS → "Calculate Your Score First"
  - [x] Incomplete profile → "Complete Profile to Continue"
  - [x] Empty documents → "Start Your Document Checklist"
- [x] Reduce information density with collapsible sections
- [x] Highlight pricing tiers based on user's actual usage/needs

#### Profile Enhancements
- [x] Use proper date picker component for birth date
- [x] Add tooltips explaining field importance (CRS impact)
- [x] Weight progress calculation by required fields only
- [x] Mark required vs optional fields clearly with visual indicators

### P3 - Lower Priority

#### Chat Additional Features
- [x] Add conversation search and filters
- [x] Add conversation categorization/tagging
- [x] Clean up duplicate 'use client' directives in ChatPage.tsx

#### Authentication Improvements
- [x] Implement tabbed Login/Signup on single page
- [x] Add welcome animation after successful signup

#### Accessibility Improvements
- [x] Verify color contrast ratios (WCAG 2.1 AA)
- [x] Add visible focus states to custom components
- [x] Add explicit label associations for all form inputs
- [x] Add icons/text indicators to error messages (not just color)
- [x] Add skip navigation links for keyboard users

#### RTL-Specific Fixes
- [x] Audit all arrow icons for proper RTL rotation
- [x] Fix number input direction in RTL mode
- [x] Fix progress indicator animation direction in RTL
- [x] Mirror icons appropriately in RTL layout

#### Mobile Experience
- [x] Add sticky bottom navigation for mobile (Dashboard, Chat, Calculator)
- [x] Add collapsible sections for long forms on mobile
- [x] Consider swipe gestures for conversation navigation

### Technical Debt
- [x] Remove duplicate 'use client' directive in ChatPage.tsx (lines 1 and 3)
- [x] Remove console.log debug statements from production code
- [x] Fix 'any' types in checklist handling with proper TypeScript types
- [x] Ensure consistent query key format (arrays vs strings)
