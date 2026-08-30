/**
 * Realistic Sample Bureaucratic Documents for Ideathon Demonstrations
 */

export interface SampleDoc {
  id: string;
  title: string;
  category: string;
  description: string;
  text: string;
}

export const SAMPLE_DOCUMENTS: SampleDoc[] = [
  {
    id: 'sbir-grant',
    title: 'State CleanTech Small Business Innovation Grant (RFP-2026-CT)',
    category: 'Small Business & Grant',
    description: 'A 20-page state government RFP with stringent eligibility, confusing matching fund ratios, and vague review timelines.',
    text: `STATE DEPARTMENT OF ECONOMIC OPPORTUNITY & CLEAN ENERGY INNOVATION
DIVISION OF APPLIED RESEARCH GRANTS
SOLICITATION NOTICE: RFP-2026-CT-09 (MATCHING GRANT PROGRAM)

SECTION 1: PROGRAM PURPOSE & ELIGIBILITY CRITERIA
The State Department hereby solicits proposals from qualified early-stage technology enterprises operating within the state for competitive matching grant disbursements up to $150,000.00 USD. 

To qualify, applicant entities must satisfy all of the following conditions:
1. Must be a registered C-Corporation or LLC organized under State law in good standing for not less than 12 months prior to the date of submission.
2. Must employ fewer than 25 full-time equivalent (FTE) employees, with at least 51% of payroll distributed to state-resident personnel.
3. Must demonstrate matching private funds committed at a 1:1 ratio ($1.00 non-state capital for every $1.00 state grant requested) evidenced by an irrevocable bank escrow or executed investor term sheet.
4. Principals who have previously defaulted on any municipal, state, or federal financial assistance agreement are strictly disqualified.

SECTION 2: MANDATORY DOCUMENTATION & SUBMISSION DOSSIER
All submissions must be transmitted via the State e-Grants Portal (https://egrants.state.gov/portal/apply) and must include:
- Form CT-101 (Application Cover Sheet with original authorized signatory).
- 3-Year Audited Financial Statements prepared by a licensed CPA (or CPA-reviewed compilation if operating under 24 months).
- 5-Page Technical Milestone Narrative (Strict 12pt Times New Roman, 1-inch margins; annexes will not be reviewed).
- Form W-9 and State Vendor Registration ID (Vendor ID must be active prior to application lock).
- Certified Certificate of Good Standing from the Secretary of State dated within 30 calendar days of submission.
- Non-refundable application processing fee of $250.00 submitted via ACH electronic transfer (fee waivers may be requested upon demonstration of certified minority/women-owned business enterprise status via Form MWBE-W).

SECTION 3: CRITICAL DEADLINES & TIMETABLE
- Informational Pre-Bid Webinar: October 14, 2026 at 2:00 PM EST (attendance strongly encouraged but optional).
- Final Electronic Submission Deadline: November 15, 2026 at precisely 5:00:00 PM EST. Late submissions generated even one second past the cutoff are systematically rejected without appeal.
- Review Period: Proposals will be evaluated in a reasonable timeframe following closure. Awards shall be announced at the discretion of the Grant Review Board.
- Award Disbursement: Tranche 1 (50%) disbursed upon contract execution; Tranche 2 (50%) contingent on satisfactory mid-term milestone validation.

SECTION 4: INQUIRIES & DESIGNATED CONTACT
Written inquiries concerning this solicitation must be addressed to the Grant Administrator at grants-cleantech@deop.state.gov no later than 10 business days prior to the closing deadline. Telephone inquiries are strictly prohibited.`,
  },
  {
    id: 'university-fellowship',
    title: 'University Graduate Teaching Fellowship & Full Tuition Remission Protocol',
    category: 'University & Academic Fellowship',
    description: 'Complex academic guidelines governing graduate stipend, credit hour minimums, health subsidy, and obscure re-appointment caveats.',
    text: `OFFICE OF GRADUATE STUDIES & RESEARCH
ACADEMIC FELLOWSHIP & TEACHING ASSISTANTSHIP POLICY MEMORANDUM (APM-842)

SUBJECT: Graduate Assistantship Eligibility, Tuition Remission Schedules, and Work Authorization

1. ELIGIBILITY & ACADEMIC STANDING
Graduate Teaching Assistants (GTAs) and Graduate Research Assistants (GRAs) appointed at 0.50 FTE (20 hours per week) are eligible for full base instructional tuition remission and a bi-weekly stipend of $1,420.00. 
- The student must maintain continuous full-time enrollment of at least 9 graduate credit hours per semester (6 credit hours during summer sessions). Audited courses and undergraduate prerequisites do not count toward this threshold.
- The appointee must maintain a cumulative Grade Point Average (GPA) of 3.30 or higher. Falling below 3.30 results in immediate one-semester probationary status; failure to remedy GPA within one semester causes forfeiture of assistantship and immediate retroactive billing of tuition.

2. FEES, HEALTH INSURANCE, AND EXCLUSIONS
While base instructional tuition is remitted 100%, the fellowship DOES NOT cover:
- Mandatory University Campus Fees ($845.00 per semester), Student Recreation Center Fee ($210.00), and Technology Infrastructure Fee ($165.00).
- Appointees must enroll in the Graduate Student Health Insurance Plan (GSHIP). A 75% university subsidy applies; the remaining 25% ($412.50/semester) will be automatically payroll-deducted.

3. MANDATORY ONBOARDING COMPLIANCE & DEADLINES
Appointees must complete the following onboarding verification prior to August 18, 2026 (Fall Semester) or December 15, 2026 (Spring Semester):
- Form I-9 Employment Eligibility Verification (must present original unexpired documents in-person to HR within 3 business days of first date of contract).
- Mandatory Title IX and Laboratory Safety Compliance Modules (online via Canvas portal).
- FERPA Student Records Training Certificate.
- Direct Deposit Authorization Form accompanied by a voided check or official bank verification letter.

4. OUTSIDE EMPLOYMENT RESTRICTION
Students holding a 0.50 FTE appointment are strictly barred from accepting concurrent secondary employment on or off campus exceeding 5 additional hours per week without prior written approval from both their Faculty Thesis Advisor and the Dean of the Graduate School (Form GA-EXT-9). Violations will result in immediate termination of the assistantship.`,
  },
  {
    id: 'housing-voucher',
    title: 'Municipal Housing Authority – Section 8 Choice Voucher Verification Criteria',
    category: 'Housing & Municipal Assistance',
    description: 'Voucher qualification rules with income brackets, strict 10-day document response windows, and inspection prerequisites.',
    text: `METROPOLITAN HOUSING & REDEVELOPMENT COMMISSION (MHRC)
HOUSING CHOICE VOUCHER PROGRAM (SECTION 8) RE-CERTIFICATION & ELIGIBILITY PROTOCOL

NOTICE OF MANDATORY ANNUAL ELIGIBILITY RE-EXAMINATION

Dear Program Participant:
In accordance with HUD Code of Federal Regulations 24 CFR 982.516, your continued eligibility for housing assistance payments must be re-examined. Failure to comply with all requirements within the stipulated timeframe will result in immediate issuance of a Notice of Termination of Assistance.

REQUIRED ACTION & STRICT 10-DAY SUBMISSION WINDOW:
You must submit all verification documents listed below to the MHRC Central Intake Office (Room 304, 450 Civic Center Plaza) or via our secure resident upload portal (https://mhrc-housing.org/verify) within ten (10) calendar days from the date of this letter.

MANDATORY DOCUMENTS REQUIRED:
1. Income Verification: 
   - Last 6 consecutive pay stubs for all adult household members aged 18+.
   - Current year Social Security / SSI Benefit Award Letter (must be dated within last 60 days).
   - If self-employed: Most recent IRS Form 1040 with Schedule C and notarized Profit & Loss statement.
   - If zero income: Form ZI-10 (Notarized Zero Income Declaration & Living Expense Questionnaire).
2. Asset Documentation: Last 3 consecutive monthly statements for all checking, savings, retirement, or crypto accounts.
3. Household Composition: State-issued photo ID for all adults; Birth Certificates and Social Security cards for all minor children.
4. Utility Allowance Verification: Most recent electric and gas bills showing account number and service address matching the subsidized unit.

HOUSING QUALITY STANDARDS (HQS) PHYSICAL INSPECTION:
An annual physical unit inspection will be scheduled within 30 days of re-certification approval. An adult resident (18+) must be present. The inspector will check for working smoke/CO alarms, functional window locks, and lack of peeling lead paint. Failure to allow entry on two consecutive scheduled dates constitutes a material program violation.

OFFICIAL CONTACT:
Assigned Housing Specialist: Case Management Unit B
Email: casemanagement-b@mhrc-housing.org | Phone: (555) 839-2000 Ext 412
Office Hours: Mon-Thurs 8:30 AM - 4:00 PM (Closed Fridays)`,
  },
];
