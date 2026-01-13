/**
 * Canada Immigration Knowledge Base Seed Data
 * 
 * This file contains comprehensive information about Canadian immigration programs
 * to be seeded into the RAG knowledge base.
 */

export const canadaImmigrationKnowledge = [
  // Express Entry
  {
    title: "Express Entry Overview",
    category: "express_entry",
    language: "en",
    content: `# Express Entry System - Canada

Express Entry is Canada's main application management system for skilled workers who want to become permanent residents.

## How Express Entry Works

1. **Create a Profile**: Submit your profile to the Express Entry pool
2. **Get a CRS Score**: Your Comprehensive Ranking System (CRS) score determines your ranking
3. **Receive an ITA**: If your score is high enough, you'll receive an Invitation to Apply (ITA)
4. **Submit Application**: You have 60 days to submit your complete permanent residence application
5. **Processing**: Most applications are processed within 6 months

## Express Entry Programs

### Federal Skilled Worker Program (FSWP)
- For skilled workers with foreign work experience
- Must meet minimum requirements for education, work experience, and language ability
- Selection based on a points system (out of 100)
- Minimum 67 points required to be eligible

### Federal Skilled Trades Program (FSTP)
- For skilled tradespeople who want to become permanent residents
- Must have valid job offer or certificate of qualification
- Required work experience in eligible skilled trade

### Canadian Experience Class (CEC)
- For skilled workers who have Canadian work experience
- Must have at least 1 year of skilled work experience in Canada within the last 3 years
- Work experience must be in NOC TEER 0, 1, 2, or 3

## CRS Score Factors

Your CRS score is based on:
- **Core/Human Capital Factors**: Age, education, language skills, Canadian work experience
- **Spouse/Common-law Partner Factors**: Education, language skills, Canadian work experience
- **Skill Transferability Factors**: Combinations of education, work experience, and language
- **Additional Points**: Provincial nomination (600 points), job offer, Canadian education, French language skills, siblings in Canada

## Current CRS Cutoff Trends

Recent Express Entry draws have had cutoffs ranging from 470-520 points for all-program draws. Category-based draws for specific occupations may have different cutoffs.

Source: Immigration, Refugees and Citizenship Canada (IRCC)
https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry.html`
  },

  {
    title: "CRS Score Calculation Guide",
    category: "express_entry",
    language: "en",
    content: `# Comprehensive Ranking System (CRS) Score Guide

The CRS is a points-based system used to rank Express Entry candidates. Maximum possible score is 1,200 points.

## Core/Human Capital Factors (Maximum 500 points for single applicants, 460 for those with spouse)

### Age (Maximum 110 points)
- 20-29 years: Maximum points (110 for single, 100 with spouse)
- Points decrease after age 30
- 0 points at age 45 or older

### Education (Maximum 150 points)
- PhD: 150 points (single) / 140 points (with spouse)
- Master's degree: 135/126 points
- Two or more post-secondary credentials (one 3+ years): 128/119 points
- Bachelor's degree: 120/112 points
- One-year post-secondary: 90/84 points
- Secondary school: 30/28 points

### Language Skills (Maximum 136 points for first language, 24 for second)

CLB Level Points (First Official Language - Single):
- CLB 10 or higher: 34 points per ability (136 total)
- CLB 9: 31 points per ability (124 total)
- CLB 8: 23 points per ability (92 total)
- CLB 7: 17 points per ability (68 total)

### Canadian Work Experience (Maximum 80 points)
- 1 year: 40 points (single) / 35 points (with spouse)
- 2 years: 53/46 points
- 3 years: 64/56 points
- 4 years: 72/63 points
- 5+ years: 80/70 points

## Skill Transferability Factors (Maximum 100 points)

### Education + Language Combination
- Post-secondary + CLB 9+: 50 points
- Post-secondary + CLB 7-8: 25 points

### Education + Canadian Work Experience
- Post-secondary + 2+ years Canadian experience: 50 points
- Post-secondary + 1 year Canadian experience: 25 points

### Foreign Work Experience + Language
- 3+ years foreign experience + CLB 9+: 50 points
- 1-2 years foreign experience + CLB 9+: 25 points

### Foreign + Canadian Work Experience
- 3+ years foreign + 2+ years Canadian: 50 points
- 1-2 years each: 25 points

## Additional Points (Maximum 600 points)

- Provincial Nomination: 600 points
- Valid job offer (TEER 0): 200 points
- Valid job offer (TEER 1, 2, 3): 50 points
- Canadian education (3+ years): 30 points
- Canadian education (1-2 years): 15 points
- French language ability (CLB 7+) + English CLB 4 or less: 50 points
- French language ability (CLB 7+) + English CLB 5+: 25 points
- Sibling in Canada (citizen or PR): 15 points

Source: IRCC CRS Tool
https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/eligibility/criteria-comprehensive-ranking-system/grid.html`
  },

  {
    title: "Study Permits Canada",
    category: "study_permit",
    language: "en",
    content: `# Study Permits in Canada

A study permit is a document that allows foreign nationals to study at designated learning institutions (DLIs) in Canada.

## Eligibility Requirements

1. **Acceptance Letter**: You must have a letter of acceptance from a designated learning institution (DLI)
2. **Proof of Financial Support**: Demonstrate you can support yourself and any accompanying family members
3. **Clean Criminal Record**: Provide a police certificate if required
4. **Good Health**: Complete medical examination if required
5. **Intent to Leave**: Prove you will leave Canada when your permit expires

## Financial Requirements

For studies in Quebec:
- First year: CAD $13,134
- Each additional year: CAD $13,134

For studies outside Quebec:
- First year: CAD $10,000
- Each additional year: CAD $10,000

Additional funds required for family members:
- Spouse/common-law partner: CAD $4,000/year
- Each dependent child: CAD $3,000/year

## Processing Times

Processing times vary by country and time of year:
- Online applications: 4-16 weeks typically
- Paper applications may take longer
- Apply at least 3-4 months before your program starts

## Study Permit Conditions

- Must attend a DLI and remain enrolled
- Make progress towards completing your program
- Work restrictions apply (generally 20 hours/week off-campus during school)
- Report changes in circumstances to IRCC

## Post-Graduation Work Permit (PGWP)

After completing studies, you may be eligible for a PGWP:
- Program must be at least 8 months
- Must apply within 180 days of receiving final marks
- PGWP length depends on program duration
- Maximum PGWP duration is 3 years

## Pathway to Permanent Residence

Study permits can lead to permanent residence through:
- Canadian Experience Class (CEC)
- Provincial Nominee Programs (PNP)
- Federal Skilled Worker Program (FSWP)

Source: IRCC Study Permits
https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit.html`
  },

  {
    title: "Work Permits Canada",
    category: "work_permit",
    language: "en",
    content: `# Work Permits in Canada

## Types of Work Permits

### Open Work Permits
Allow you to work for any employer in Canada (with some exceptions). Available to:
- Spouses of skilled workers or international students
- Post-graduation work permit (PGWP) holders
- Bridging open work permit holders
- Some humanitarian cases

### Employer-Specific Work Permits
Tied to a specific employer, job, location, and duration. Requirements:
- Labour Market Impact Assessment (LMIA) from employer, or
- LMIA-exempt category

## LMIA-Exempt Work Permits

Common categories include:
- Intra-company transferees
- International agreements (CUSMA/USMCA, etc.)
- Significant benefit to Canada
- Reciprocal employment (e.g., International Experience Canada)
- Religious workers
- Entrepreneurs

## International Experience Canada (IEC)

For youth ages 18-35 from partner countries:
- **Working Holiday**: Open work permit for up to 2 years
- **Young Professionals**: Employer-specific permit for career-related work
- **International Co-op**: Internship for students

## Processing Times

- Online applications: 1-27 weeks depending on country
- At port of entry (if eligible): Same day
- Inside Canada: 4-16 weeks

## Work Permit Conditions

- Work only for authorized employer(s)
- Follow conditions on your permit
- Ensure validity before starting work
- Cannot work for employers on ineligible list

## Changing Employers

For employer-specific permits:
- Need new LMIA or LMIA exemption
- Apply for new work permit before starting new job

## Pathway to PR

Work experience in Canada can lead to permanent residence through:
- Canadian Experience Class (CEC)
- Provincial Nominee Programs
- Atlantic Immigration Program
- Rural and Northern Immigration Pilot

Source: IRCC Work Permits
https://www.canada.ca/en/immigration-refugees-citizenship/services/work-canada/permit.html`
  },

  {
    title: "Family Sponsorship Canada",
    category: "family_sponsorship",
    language: "en",
    content: `# Family Sponsorship in Canada

Canadian citizens and permanent residents can sponsor certain family members for permanent residence.

## Who You Can Sponsor

### Spouse, Partner, or Dependent Children
- Spouse (legally married)
- Common-law partner (living together for 1+ year)
- Conjugal partner (in genuine relationship but unable to live together)
- Dependent children (under 22, not married/common-law)

### Parents and Grandparents
- Through the Parents and Grandparents Program (PGP)
- Limited spots available each year
- Alternative: Super Visa (10-year multiple entry visa)

### Other Relatives
- Under specific circumstances, you may sponsor other relatives
- Must meet specific criteria

## Sponsorship Requirements

### Sponsor Requirements
- Must be 18 years or older
- Canadian citizen or permanent resident
- Meet minimum income requirements (for parents/grandparents)
- Sign undertaking to provide financial support
- Cannot be in prison, bankrupt, or under removal order
- Previous sponsorship obligations must be met

### Income Requirements (Parents and Grandparents)

Minimum Necessary Income (MNI) for 3 consecutive tax years:
- 1 person: $29,380
- 2 persons: $36,576
- 3 persons: $44,966
- Add approximately $8,000-9,000 per additional person

Note: Quebec has different requirements

## Processing Times

- Spouse/Partner/Children: 12 months (target)
- Parents and Grandparents: 20-24 months
- Processing times vary and can change

## Sponsorship Undertaking

### Duration of Undertaking
- Spouse/partner: 3 years from when they become PR
- Dependent children: Until age 25 or 10 years (whichever comes first)
- Parents/grandparents: 20 years

### Sponsor's Responsibilities
- Provide basic needs (food, clothing, shelter)
- Ensure sponsored person doesn't need social assistance
- Financial responsibility regardless of relationship changes

## Super Visa Alternative

For parents and grandparents not selected for PGP:
- Multiple entry visa valid up to 10 years
- Stay for up to 5 years at a time
- Requires proof of relationship, financial support, and medical insurance

Source: IRCC Family Sponsorship
https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/family-sponsorship.html`
  },

  {
    title: "Provincial Nominee Programs",
    category: "provincial_nomination",
    language: "en",
    content: `# Provincial Nominee Programs (PNP)

Provincial Nominee Programs allow Canadian provinces and territories to nominate individuals for permanent residence based on local labor market needs.

## How PNP Works

1. **Apply to Province**: Submit application to province/territory of your choice
2. **Get Nominated**: If successful, receive provincial nomination certificate
3. **Apply for PR**: Submit permanent residence application to IRCC

## Express Entry-Linked PNP Streams

If you have an Express Entry profile, provincial nomination adds 600 CRS points, virtually guaranteeing an ITA.

Provinces with Express Entry streams:
- Alberta: Alberta Express Entry Stream
- British Columbia: BC PNP Express Entry
- Manitoba: MPNP Direct Pathway
- New Brunswick: Express Entry Labour Market Stream
- Nova Scotia: Nova Scotia Demand
- Ontario: OINP Human Capital Priorities Stream
- Prince Edward Island: PEI PNP Express Entry
- Saskatchewan: SINP Express Entry

## Base (Non-Express Entry) PNP Streams

Paper-based applications processed outside Express Entry:
- Employer-driven streams (require job offer)
- Entrepreneur/business streams
- Graduate streams
- Occupation-specific streams

## Popular PNP Programs

### Ontario Immigrant Nominee Program (OINP)
- Human Capital Priorities (Express Entry)
- Employer Job Offer streams
- Masters Graduate Stream
- PhD Graduate Stream

### BC PNP
- Skills Immigration (Express Entry and non-EE)
- Tech sector specific streams
- Regional pilot programs

### Alberta Immigrant Nominee Program (AINP)
- Alberta Opportunity Stream
- Alberta Express Entry Stream
- Rural Renewal Stream

### Saskatchewan Immigrant Nominee Program (SINP)
- International Skilled Worker
- Saskatchewan Experience Category
- Entrepreneur Category

## Processing Times

- Express Entry nominations: 2-8 months (provincial) + 6 months (federal)
- Base nominations: 6-18 months (provincial) + 15-19 months (federal)

## Key Requirements

Most PNP streams require:
- Connection to the province (work, study, family, or job offer)
- Language proficiency
- Relevant work experience
- Settlement funds

## Tips for PNP Success

- Research multiple provinces' programs
- Create IRCC online account for updates
- Keep documents ready
- Apply early when intake opens
- Consider less popular provinces with lower requirements

Source: IRCC Provincial Nominee Program
https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/provincial-nominees.html`
  },

  {
    title: "Language Testing for Immigration",
    category: "language_testing",
    language: "en",
    content: `# Language Testing for Canadian Immigration

Language ability is crucial for Canadian immigration. Tests measure your ability in English and/or French.

## Canadian Language Benchmarks (CLB)

CLB is Canada's standard for describing language ability. Most immigration programs require specific CLB levels.

### CLB Level Requirements by Program

| Program | Minimum CLB |
|---------|-------------|
| Express Entry - FSW | CLB 7 |
| Express Entry - CEC | CLB 7 (NOC TEER 0,1) / CLB 5 (NOC TEER 2,3) |
| Express Entry - FSTP | CLB 5 speaking/listening, CLB 4 reading/writing |
| Study Permit | Varies by institution |
| Citizenship | CLB 4 |

## Accepted English Tests

### IELTS General Training
- Most widely accepted
- Scored 0-9 in each ability
- Results valid for 2 years

CLB to IELTS Conversion:
- CLB 10: 8.0-9.0
- CLB 9: 7.0-7.5
- CLB 8: 6.5
- CLB 7: 6.0
- CLB 6: 5.5
- CLB 5: 5.0
- CLB 4: 4.0-4.5

### CELPIP General
- Computer-based test
- Scored 1-12 in each ability
- Results valid for 2 years

CLB to CELPIP Conversion:
- CLB 10-12: 10-12
- CLB 9: 9
- CLB 8: 8
- CLB 7: 7
- CLB 6: 6
- CLB 5: 5
- CLB 4: 4

### PTE Core (new as of 2023)
- Computer-based test
- Scored 10-90 in each ability
- Valid for 2 years

## Accepted French Tests

### TEF Canada
- Scored by level (0-7)
- Measures all four abilities
- Valid for 2 years

### TCF Canada
- Scored by level (A1-C2)
- Measures all four abilities
- Valid for 2 years

## Tips for Language Tests

1. **Start Early**: Book tests well in advance
2. **Practice**: Use official practice materials
3. **Understand Format**: Each test has unique format
4. **Target Score**: Aim higher than minimum for better CRS points
5. **Retake if Needed**: You can retake tests to improve scores

## Improving Your Score

Higher language scores significantly boost CRS:
- CLB 9 in all abilities: 124 points (first language)
- CLB 10 in all abilities: 136 points (first language)
- French CLB 7+ with English: Additional 25-50 bonus points

Source: IRCC Language Testing
https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/documents/language-requirements.html`
  },

  {
    title: "Educational Credential Assessment",
    category: "eca",
    language: "en",
    content: `# Educational Credential Assessment (ECA)

An ECA is required for Express Entry to verify that your foreign education is equivalent to Canadian standards.

## What is an ECA?

An ECA report:
- Confirms your foreign credential is valid
- Shows Canadian equivalent of your education
- Required for Express Entry immigration

## Designated Organizations

IRCC accepts ECAs from these organizations:

### World Education Services (WES)
- Most popular choice
- Processing time: 20 business days
- Fees: CAD $220-400

### International Credential Assessment Service of Canada (ICAS)
- Processing time: 10-15 weeks
- Fees: CAD $200-300

### Comparative Education Service (CES)
- University of Toronto
- Processing time: 10-12 weeks
- Fees: CAD $280

### International Qualifications Assessment Service (IQAS)
- Government of Alberta
- Processing time: 8-12 weeks
- Fees: CAD $200

### Medical Council of Canada (MCC)
- For medical degrees only
- Processing time: varies
- Fees: CAD $535

### Pharmacy Examining Board of Canada (PEBC)
- For pharmacy credentials only

## How to Get an ECA

1. **Choose Organization**: Select a designated organization
2. **Create Account**: Register on their website
3. **Submit Documents**: Send transcripts and certificates
4. **Pay Fees**: Varies by organization
5. **Wait for Processing**: Usually 4-20 weeks
6. **Receive Report**: Digital or paper report

## Required Documents

Typically you'll need:
- Degree/diploma certificates (original language + English translation)
- Official transcripts (sealed)
- Government-issued ID
- Verification letter from institution (sometimes)

## ECA Validity

- Valid for 5 years from date of issue
- Must be valid when you submit Express Entry profile
- Must be valid when you receive ITA

## Tips for ECA Process

1. **Order Early**: Start ECA process early - it takes time
2. **Use Courier**: Send documents by tracked courier
3. **Certified Translations**: Use IRCC-approved translators
4. **Keep Copies**: Make copies of everything sent
5. **Track Application**: Monitor progress online

## ECA Results and CRS Points

| Canadian Equivalent | CRS Points (Single) |
|---------------------|---------------------|
| PhD | 150 |
| Master's | 135 |
| 2+ credentials (one 3+ years) | 128 |
| Bachelor's (3+ years) | 120 |
| 2-year post-secondary | 98 |
| 1-year post-secondary | 90 |
| High school | 30 |

Source: IRCC ECA Information
https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/documents/education-assessed.html`
  }
];

/**
 * Knowledge Graph Entities for Canada Immigration
 */
export const canadaEntities = [
  // Immigration Programs
  { type: "IMMIGRATION_PROGRAM", name: "Express Entry", displayName: "Express Entry", properties: { country: "Canada", category: "skilled_worker", processing_time: "6 months" } },
  { type: "IMMIGRATION_PROGRAM", name: "Federal Skilled Worker Program", displayName: "Federal Skilled Worker Program (FSWP)", properties: { parent_program: "Express Entry", min_points: 67 } },
  { type: "IMMIGRATION_PROGRAM", name: "Canadian Experience Class", displayName: "Canadian Experience Class (CEC)", properties: { parent_program: "Express Entry", requires_canadian_experience: true } },
  { type: "IMMIGRATION_PROGRAM", name: "Federal Skilled Trades Program", displayName: "Federal Skilled Trades Program (FSTP)", properties: { parent_program: "Express Entry" } },
  { type: "IMMIGRATION_PROGRAM", name: "Provincial Nominee Program", displayName: "Provincial Nominee Program (PNP)", properties: { crs_bonus: 600 } },
  { type: "IMMIGRATION_PROGRAM", name: "Family Sponsorship", displayName: "Family Sponsorship", properties: { sponsor_type: ["spouse", "parent", "child"] } },
  { type: "IMMIGRATION_PROGRAM", name: "Study Permit", displayName: "Study Permit", properties: { category: "temporary_resident" } },
  { type: "IMMIGRATION_PROGRAM", name: "Work Permit", displayName: "Work Permit", properties: { types: ["open", "employer_specific"] } },
  
  // Language Tests
  { type: "LANGUAGE_TEST", name: "IELTS", displayName: "IELTS General Training", properties: { language: "English", validity: "2 years", max_score: 9 } },
  { type: "LANGUAGE_TEST", name: "CELPIP", displayName: "CELPIP General", properties: { language: "English", validity: "2 years", max_score: 12 } },
  { type: "LANGUAGE_TEST", name: "TEF", displayName: "TEF Canada", properties: { language: "French", validity: "2 years" } },
  { type: "LANGUAGE_TEST", name: "TCF", displayName: "TCF Canada", properties: { language: "French", validity: "2 years" } },
  { type: "LANGUAGE_TEST", name: "PTE Core", displayName: "PTE Core", properties: { language: "English", validity: "2 years", max_score: 90 } },
  
  // Organizations
  { type: "ORGANIZATION", name: "IRCC", displayName: "Immigration, Refugees and Citizenship Canada", properties: { type: "government", website: "canada.ca/immigration" } },
  { type: "ORGANIZATION", name: "WES", displayName: "World Education Services", properties: { type: "eca_provider", processing_time: "20 business days" } },
  { type: "ORGANIZATION", name: "ICAS", displayName: "International Credential Assessment Service of Canada", properties: { type: "eca_provider" } },
  
  // Document Types
  { type: "DOCUMENT", name: "ECA", displayName: "Educational Credential Assessment", properties: { validity: "5 years", required_for: "Express Entry" } },
  { type: "DOCUMENT", name: "Police Certificate", displayName: "Police Certificate/Clearance", properties: { validity: "varies", required_for: "permanent residence" } },
  { type: "DOCUMENT", name: "Medical Exam", displayName: "Immigration Medical Exam", properties: { validity: "12 months", provider: "panel physician" } },
  
  // Provinces
  { type: "PROVINCE", name: "Ontario", displayName: "Ontario", properties: { pnp_name: "OINP", capital: "Toronto" } },
  { type: "PROVINCE", name: "British Columbia", displayName: "British Columbia", properties: { pnp_name: "BC PNP", capital: "Victoria" } },
  { type: "PROVINCE", name: "Alberta", displayName: "Alberta", properties: { pnp_name: "AINP", capital: "Edmonton" } },
  { type: "PROVINCE", name: "Saskatchewan", displayName: "Saskatchewan", properties: { pnp_name: "SINP", capital: "Regina" } },
  { type: "PROVINCE", name: "Manitoba", displayName: "Manitoba", properties: { pnp_name: "MPNP", capital: "Winnipeg" } },
  { type: "PROVINCE", name: "Quebec", displayName: "Quebec", properties: { pnp_name: "Quebec Skilled Worker", capital: "Quebec City", special_rules: true } },
  { type: "PROVINCE", name: "Nova Scotia", displayName: "Nova Scotia", properties: { pnp_name: "NSNP", capital: "Halifax" } },
  { type: "PROVINCE", name: "New Brunswick", displayName: "New Brunswick", properties: { pnp_name: "NBPNP", capital: "Fredericton" } },
];

/**
 * Knowledge Graph Relationships
 */
export const canadaRelationships = [
  // Program relationships
  { source: "Federal Skilled Worker Program", target: "Express Entry", type: "PART_OF" },
  { source: "Canadian Experience Class", target: "Express Entry", type: "PART_OF" },
  { source: "Federal Skilled Trades Program", target: "Express Entry", type: "PART_OF" },
  
  // Language test relationships
  { source: "Express Entry", target: "IELTS", type: "ACCEPTS" },
  { source: "Express Entry", target: "CELPIP", type: "ACCEPTS" },
  { source: "Express Entry", target: "TEF", type: "ACCEPTS" },
  { source: "Express Entry", target: "TCF", type: "ACCEPTS" },
  { source: "Express Entry", target: "PTE Core", type: "ACCEPTS" },
  
  // Document requirements
  { source: "Express Entry", target: "ECA", type: "REQUIRES" },
  { source: "Express Entry", target: "Police Certificate", type: "REQUIRES" },
  { source: "Express Entry", target: "Medical Exam", type: "REQUIRES" },
  
  // Organization relationships
  { source: "Express Entry", target: "IRCC", type: "MANAGED_BY" },
  { source: "ECA", target: "WES", type: "PROVIDED_BY" },
  { source: "ECA", target: "ICAS", type: "PROVIDED_BY" },
  
  // Provincial relationships
  { source: "Ontario", target: "Provincial Nominee Program", type: "PARTICIPATES_IN" },
  { source: "British Columbia", target: "Provincial Nominee Program", type: "PARTICIPATES_IN" },
  { source: "Alberta", target: "Provincial Nominee Program", type: "PARTICIPATES_IN" },
  { source: "Saskatchewan", target: "Provincial Nominee Program", type: "PARTICIPATES_IN" },
  { source: "Manitoba", target: "Provincial Nominee Program", type: "PARTICIPATES_IN" },
];
