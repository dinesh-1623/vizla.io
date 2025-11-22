# Client Preferences - Detailed Documentation

## Client Preferences System - Complete Field Descriptions

This document provides comprehensive explanations for all features, settings, and data points in the Client Preferences system, including their purpose, importance, and operational impact.

---

## **Overview**

### Purpose:
The Client Preferences system is a centralized database that stores and manages specific requirements, pricing, and operational preferences for each client (lender, bank, or financial institution) that contracts with your company for vehicle recovery services. It ensures every recovery is handled according to that client's unique specifications.

### Why This Matters:
Different clients have vastly different requirements:

- **Pricing** - Each client negotiates different fees
- **Procedures** - Some require photos, others don't
- **Equipment** - Some pre-approve flatbed, others require approval
- **Keys** - Some require keys, others accept no-key recovery
- **Priority** - High-paying clients get priority service
- **Delivery** - Different clients use different storage lots
- **Documentation** - Varying paperwork and photo requirements

Without a client preferences system, drivers and dispatchers would need to memorize dozens of different client rules, leading to errors, contract violations, and lost business.

### Impact on Operations:
The Client Preferences system ensures contractual compliance, maintains client relationships, optimizes revenue through proper pricing, and prevents costly mistakes. It transforms complex, varying requirements into a structured, searchable database that enables consistent, error-free operations across all clients.

---

## **Core Fields**

### **Client Name**

#### Purpose:
The official name of the financial institution, lender, or bank that owns the vehicle and is paying for the recovery service.

#### Why This Matters:
The client name is the primary identifier that determines:

- **Which contract applies** - Different pricing and terms
- **Billing** - Who to invoice and at what rate
- **Requirements** - Client-specific procedures
- **Priority level** - Service urgency
- **Relationship management** - Client history and preferences
- **Performance tracking** - Client-specific metrics

#### Common Client Examples:
- Santander Consumer USA
- Ally Financial
- Capital One Auto Finance
- Wells Fargo Dealer Services
- Exeter Finance
- Credit Acceptance Corporation
- GM Financial
- Toyota Financial Services

#### Operational Impact:
The client name triggers all other preferences in the system. When a spotter or dispatcher selects "Capital One" as the client, the system automatically loads Capital One's fee structure, priority level, key requirements, flatbed preferences, and any special notes. This ensures consistent handling of all Capital One recoveries without requiring staff to remember specific rules.

---

### **Priority**

#### Purpose:
Indicates the urgency and importance level for this client's recoveries, determining queue position and resource allocation.

#### Options:

**High Priority:**
- **Description**: Premium client with expedited service requirements
- **Service Level**: Same-day or next-business-day recovery
- **Queue Position**: Front of the line
- **Resource Allocation**: Best drivers and equipment assigned
- **Pricing**: Premium fees justify priority treatment
- **Typical Clients**: Large banks paying high fees, contracts with SLA requirements

**Medium Priority:**
- **Description**: Standard client with normal service expectations
- **Service Level**: 2-5 business day recovery window
- **Queue Position**: Regular queue order
- **Resource Allocation**: Standard driver and equipment assignment
- **Pricing**: Standard market rates
- **Typical Clients**: Most banks and lenders

**Low Priority:**
- **Description**: Budget client with flexible timelines
- **Service Level**: 5-10 business day recovery window
- **Queue Position**: Filled in when convenient
- **Resource Allocation**: Vehicles with capacity, bulk batch processing
- **Pricing**: Discount rates
- **Typical Clients**: Small finance companies, fill-in work

#### Why This Matters:
Priority level affects every aspect of operations:

- **Dispatch order** - High priority recoveries dispatched first
- **Driver assignment** - Best drivers assigned to high priority
- **Schedule** - High priority may interrupt planned route
- **Resource allocation** - Premium vehicles for premium clients
- **Communication** - High priority clients get proactive updates
- **Recovery time** - High priority recovered faster
- **Revenue** - High priority commands premium pricing

#### Operational Impact:
Without priority levels, all work is treated equally, resulting in:
- High-paying clients getting slow service → lost contracts
- Low-paying clients getting premium service → reduced profitability
- No differentiation → inability to charge premium rates
- Resource misallocation → inefficiency

Priority levels enable strategic resource allocation that maximizes revenue while maintaining service commitments. A high-priority $200 recovery takes precedence over a low-priority $100 recovery because the margin justifies the priority treatment.

#### Pricing Example:
- High Priority: $175-250 per recovery (fast service, premium rates)
- Medium Priority: $125-175 per recovery (standard service, market rates)
- Low Priority: $85-125 per recovery (batch processing, discount rates)

---

### **Client Repo Fee (USD)**

#### Purpose:
The agreed-upon amount (in US dollars) that this client pays for each successful vehicle recovery.

#### Why This Matters:
The repo fee is the revenue generated from each recovery:

- **Revenue calculation** - Fee × recoveries = total income
- **Profitability** - Fee must exceed cost to be profitable
- **Pricing strategy** - Different clients pay different rates
- **Contract compliance** - Must charge agreed-upon rate
- **Performance tracking** - Revenue per client analysis
- **Invoicing** - Billing amount for each recovery

#### Typical Fee Ranges:
- **Low End**: $85-100 - Budget clients, high volume, easy recoveries
- **Standard**: $125-150 - Most clients, normal service
- **Premium**: $175-225 - Fast service, difficult recoveries, premium clients
- **Specialty**: $250-500+ - Exotic vehicles, high-risk, specialized equipment

#### Factors Affecting Fee:
- **Volume** - High volume may justify lower per-unit fee
- **Difficulty** - Easy vs. hard recoveries
- **Geographic area** - Urban vs. rural pricing
- **Service level** - Standard vs. expedited
- **Equipment** - Wheel-lift vs. flatbed
- **Risk** - Repossessions vs. voluntary surrenders
- **Relationship** - Long-term partners may get discounts

#### Why This Matters:
The repo fee directly determines profitability:

**Example Calculation:**
- Client repo fee: $150
- Operating cost: $65 (fuel, driver labor, vehicle depreciation, insurance)
- Gross margin: $85 (57% margin)

If operating costs are $65 per recovery, a $150 fee is profitable but a $100 fee barely covers costs. The client repo fee must be set high enough to cover costs and provide profit margin while remaining competitive in the market.

#### Operational Impact:
Fee amounts affect:

- **Acceptance decisions** - Low-fee clients may be declined during peak periods
- **Resource allocation** - High-fee clients get priority
- **Route planning** - High-fee recoveries may justify longer drive
- **Negotiation leverage** - Track fees to identify renegotiation opportunities
- **Business development** - Target clients in specific fee ranges

#### Invoice Management:
The system uses the client repo fee to:
- Generate accurate invoices
- Calculate monthly billing
- Track receivables
- Compare quoted vs. actual fees
- Identify pricing discrepancies

---

### **Flatbed Pre-Approved**

#### Purpose:
Indicates whether this client has given blanket pre-authorization for flatbed (rollback) towing, which typically costs more than standard wheel-lift towing.

#### Options:

**Yes (Pre-Approved):**
- **Description**: Client authorizes flatbed use without case-by-case approval
- **Driver Action**: Use flatbed when appropriate without calling for approval
- **Scenarios**: AWD vehicles, luxury cars, damaged vehicles
- **Billing**: Charge flatbed fee automatically
- **Efficiency**: No delays waiting for approval
- **Trust**: Client trusts your judgment on towing method

**No (Approval Required):**
- **Description**: Must get client approval before using flatbed
- **Driver Action**: Call dispatch or client before using flatbed
- **Process**: Document approval, get authorization number
- **Delays**: May need to wait for callback
- **Risk**: If denied, may need to return with different equipment
- **Cost Control**: Client maintains tight control over expenses

#### Why This Matters:
Flatbed pre-approval affects:

- **Efficiency** - Pre-approved = no delay waiting for approval
- **Driver autonomy** - Drivers can make on-site decisions
- **Service quality** - AWD vehicles require flatbed for safety
- **Cost** - Flatbed typically costs $50-100 more than wheel-lift
- **Risk** - Using flatbed without approval may result in non-payment
- **Equipment deployment** - Know which clients need flatbed availability

#### Common Scenarios Requiring Flatbed:
- **AWD/4WD vehicles** - Subaru, Audi, most luxury SUVs
- **High-value vehicles** - BMW, Mercedes, Lexus, exotic cars
- **Damaged vehicles** - Cannot roll on own wheels
- **Flat tires** - Multiple flat tires
- **Low clearance** - Sports cars, lowered vehicles
- **Long distance** - Extended towing distance
- **Client policy** - Some clients mandate flatbed for all vehicles

#### Operational Impact:

**For Pre-Approved Clients:**
- Driver sees AWD vehicle → uses flatbed → recovers immediately
- Charges flatbed fee on invoice
- No delay, efficient operation
- Higher revenue (flatbed premium)

**For Non-Approved Clients:**
- Driver sees AWD vehicle → calls dispatch → dispatch calls client
- Client may approve (30 min delay) or deny (must return with dollies)
- Potential for lost recovery window
- Lower revenue if denied

#### Financial Impact:
- **Wheel-lift recovery**: $125 fee
- **Flatbed recovery**: $175 fee
- **Flatbed premium**: $50 additional revenue

If a client pre-approves flatbed, you can capture that $50 premium on appropriate recoveries. If they require case-by-case approval, you may lose that premium or waste time seeking approval.

#### Best Practice:
Negotiate flatbed pre-approval with clients who have many AWD vehicles (Subaru, Audi, luxury brands). This benefits both parties:
- **Client**: Faster recoveries, less back-and-forth
- **Company**: Higher revenue, operational efficiency

---

### **Keys Required**

#### Purpose:
Specifies this client's policy regarding vehicle keys - whether keys must be obtained, are preferred but not mandatory, or are not required at all.

#### Options:

**Required:**
- **Description**: Must have keys before recovery
- **Driver Action**: Do not recover without keys
- **Scenarios**: Client sells recovered vehicles, needs drivable units
- **Key Sources**: Owner surrender, spare key, locksmith
- **Delay Impact**: Recovery delayed until keys obtained
- **Revenue Impact**: May charge key-making fee
- **Risk**: Owner may refuse to provide keys

**Preferred:**
- **Description**: Obtain keys if reasonably possible, proceed without if necessary
- **Driver Action**: Attempt to get keys, recover without if unavailable
- **Scenarios**: Keys improve resale but not mandatory
- **Key Sources**: Ask owner politely, don't force issue
- **Flexibility**: Allows recovery even if owner refuses keys
- **Best Effort**: Document key request attempt
- **Most Common**: Balanced approach for most clients

**Not Required:**
- **Description**: Keys are irrelevant, recover vehicle regardless
- **Driver Action**: Ignore keys entirely
- **Scenarios**: Client crushes/parts vehicles, keys don't matter
- **Efficiency**: Fastest recovery, no key negotiation
- **Safety**: Reduces confrontation with owner
- **Typical Clients**: Salvage buyers, parts clients

#### Why This Matters:
Key requirements affect:

- **Recovery time** - Obtaining keys adds 5-30 minutes
- **Confrontation risk** - Asking for keys may escalate situation
- **Vehicle value** - Keys increase resale value $500-1,500
- **Driver safety** - Key negotiations can be dangerous
- **Revenue** - Key-making services may be billable
- **Success rate** - "Required" keys may result in failed recoveries

#### Operational Impact by Scenario:

**Scenario 1: Voluntary Surrender (Owner Cooperating)**
- **Required**: Ask for keys, owner usually provides
- **Preferred**: Ask for keys, owner usually provides
- **Not Required**: Skip key discussion, recover faster
- **Impact**: Minimal difference, all proceed smoothly

**Scenario 2: Involuntary Repo (Owner Hostile)**
- **Required**: Must negotiate for keys, may fail recovery
- **Preferred**: Request keys politely, recover without if refused
- **Not Required**: Avoid confrontation, recover immediately
- **Impact**: Significant - "Required" may result in abandoned recovery

**Scenario 3: Vehicle Unattended (No Owner Present)**
- **Required**: Cannot recover, must return when owner present
- **Preferred**: Recover without keys (owner not available)
- **Not Required**: Recover without keys
- **Impact**: "Required" doubles the trips needed

#### Revenue Considerations:

**With Keys:**
- Client sells vehicle at auction: $8,000
- Client profit: Good
- Client happy to pay repo fee

**Without Keys:**
- Client must pay locksmith: $150-300
- Vehicle sells for less (no keys): $7,200 (-$800)
- Client annoyed at extra cost
- Client may dispute repo fee

Some clients require keys to protect their resale margin. Others don't care because they're junking the vehicle anyway.

#### Best Practice:
"Preferred" is the most balanced option:
- Drivers attempt to get keys (client prefers)
- But recovery doesn't fail if keys unavailable (operational efficiency)
- Document key status in notes
- Charge key-making fee if client wants locksmith service

---

### **Notes**

#### Purpose:
Free-form text field for any client-specific information, special instructions, or historical context that doesn't fit in structured fields.

#### Common Uses:

**Special Instructions:**
- "Always photograph odometer before recovery"
- "Requires 3 photos minimum: VIN, full vehicle, driver side"
- "Must call client before recovery if value exceeds $25,000"
- "Deliver all recoveries to Baltimore South lot only"

**Contact Information:**
- "After-hours contact: John Smith 555-1234"
- "Email condition report to recoveries@client.com"
- "CC dispatch manager on all status updates"

**Billing Notes:**
- "Invoices submitted weekly via online portal"
- "Requires signed condition report for payment"
- "Flatbed requires approval from Susan (ext 205)"

**Historical Context:**
- "New client as of Jan 2025, still learning preferences"
- "Had dispute over damaged vehicle 6/2024, extra photos required"
- "Long-term partner, very flexible and easy to work with"
- "Payment slow, monitor receivables closely"

**Operational Quirks:**
- "Prefers no contact with owners, ghost recoveries only"
- "Sometimes sends duplicate work orders, verify before dispatch"
- "Uses third-party inspector, coordinate access for inspection"

#### Why This Matters:
Notes provide critical context that:

- **Prevents errors** - Specific instructions prevent contract violations
- **Maintains relationships** - Shows attention to client preferences
- **Avoids disputes** - Historical notes explain current practices
- **Enables training** - New staff learn client quirks
- **Documents agreements** - Written record of verbal commitments

#### Operational Impact:
Without notes, institutional knowledge lives only in people's heads. When that person leaves, the knowledge disappears. Notes create organizational memory that survives staff turnover.

**Example Impact:**
- **Without Notes**: New dispatcher assigns Capitol One recovery without knowing they require VIN photo before dispatch. Driver arrives to wrong vehicle. Wasted trip.
- **With Notes**: Notes say "Capitol One requires VIN photo verification before dispatch." Dispatcher follows protocol. Correct vehicle recovered first time.

---

## **Management Features**

### **Search**

#### Purpose:
Free-text search to quickly find specific clients by name.

#### Why This Matters:
Fast client lookup is essential when:

- **Spotter submitting vehicle** - Select correct client from list
- **Dispatcher assigning recovery** - Verify client requirements
- **Billing inquiry** - Look up fee structure
- **Client calling** - Quick access to client preferences
- **Performance review** - Analyze specific client metrics

With 50+ clients, scrolling through alphabetical list is slow. Search enables instant access.

#### Operational Impact:
Search speed affects:
- **Spotter efficiency** - Less time selecting client = more time locating vehicles
- **Dispatcher productivity** - Quick client lookup during busy periods
- **Customer service** - Immediate answers when client calls
- **Billing accuracy** - Find correct fee without delay

---

### **Priority Filter**

#### Purpose:
Filter client list to show only High, Medium, Low, or All priority clients.

#### Why This Matters:
Priority filtering enables:

- **Focus** - View only high-priority clients during peak periods
- **Analysis** - Compare high vs. low priority performance
- **Resource planning** - Count clients in each priority tier
- **Strategic decisions** - Identify if portfolio is too heavily low-priority

#### Operational Impact:
During peak periods, filter to High priority clients to ensure premium clients get immediate attention. During slow periods, filter to Low priority to fill capacity with discount work.

---

### **Add Client**

#### Purpose:
Create a new client record with all preferences and requirements.

#### Why This Matters:
Adding clients properly ensures:

- **Accurate pricing** - Correct fee entered from contract
- **Consistent service** - Requirements documented upfront
- **No errors** - All staff know client expectations
- **Fast onboarding** - Client ready for work immediately

#### Operational Impact:
Well-documented client setup prevents errors during first recoveries. Poor setup leads to billing disputes, service failures, and damaged client relationships.

---

### **Edit Client**

#### Purpose:
Update existing client information when contracts change or preferences are refined.

#### Why This Matters:
Client requirements change:

- **Fee adjustments** - Contract renegotiations
- **Priority changes** - Volume increase/decrease
- **Requirement changes** - New photo requirements
- **Contact updates** - New client representative
- **Corrections** - Fix data entry errors

#### Operational Impact:
Regular client updates ensure system reflects current reality. Outdated preferences lead to contract violations and disputes.

---

### **Delete Client**

#### Purpose:
Remove inactive clients from the system.

#### Why This Matters:
Client deletion prevents:

- **Clutter** - Excessive inactive clients confuse staff
- **Errors** - Accidentally selecting inactive client
- **Confusion** - Mixing up current and former clients
- **Security** - Remove access to terminated clients

#### Operational Impact:
Clean client list improves system usability. Only active clients should appear in selection dropdowns.

---

### **Duplicate Client**

#### Purpose:
Create a copy of an existing client record as starting point for similar new client.

#### Why This Matters:
Duplication saves time when:

- **Similar clients** - New client has similar requirements to existing
- **Client divisions** - Same company, different divisions
- **Testing** - Create test client based on real client
- **Templates** - Create template clients for common scenarios

#### Operational Impact:
Duplication reduces data entry time and ensures consistency across similar clients.

---

### **Export CSV**

#### Purpose:
Download client list with all preferences as CSV file.

#### Why This Matters:
CSV export enables:

- **Backup** - Archive client data
- **Analysis** - External reporting and analysis
- **Audits** - Provide documentation for audits
- **Sharing** - Send to accountants, partners, investors
- **Migration** - Move data to other systems

#### Operational Impact:
CSV export provides data portability and enables custom analysis beyond what the system UI offers.

---

### **Import CSV**

#### Purpose:
Bulk import client records from CSV file.

#### Why This Matters:
CSV import enables:

- **Bulk setup** - Add 50 clients at once instead of one-by-one
- **Migration** - Move from another system
- **Updates** - Bulk update fees across all clients
- **Restoration** - Restore from backup if needed

#### Operational Impact:
CSV import saves massive time during initial setup or major updates. Manually entering 100 clients would take hours; importing takes seconds.

---

## **View Modes**

### **List View**

#### Purpose:
Standard list of all clients with key information visible.

#### Why This Matters:
List view is ideal for:

- **Day-to-day operations** - Quick client selection
- **Individual client focus** - Detailed view of one client
- **Editing** - Modify client settings
- **Management** - Add/edit/delete clients

#### Best For: Operational staff, dispatchers, administrators

---

### **Analytics View**

#### Purpose:
Statistical analysis and performance metrics across all clients.

#### Why This Matters:
Analytics view enables:

- **Revenue analysis** - Which clients generate most income
- **Volume analysis** - Which clients provide most work
- **Profitability** - Revenue vs. effort by client
- **Trends** - Growth or decline in client work
- **Strategic planning** - Which clients to prioritize

#### Best For: Managers, executives, business development

---

### **Charts View**

#### Purpose:
Visual representations of client data through graphs and charts.

#### Why This Matters:
Charts view provides:

- **Visual insights** - Patterns easier to see visually
- **Presentations** - Charts for management presentations
- **Comparisons** - Side-by-side client performance
- **Trends** - Historical data visualization

#### Best For: Management presentations, strategic planning

---

### **Presentation Mode**

#### Purpose:
Clean, formatted view suitable for client presentations or board meetings.

#### Why This Matters:
Presentation mode enables:

- **Professional display** - Impress clients and investors
- **Meeting format** - Easy to present in meetings
- **Print-friendly** - Generate professional reports
- **Executive summary** - High-level overview

#### Best For: Client meetings, board presentations, investor relations

---

## **Business Intelligence Metrics**

### **Revenue per Client**

#### Purpose:
Total income generated from each client over time period.

#### Formula:
`Client repo fee × Number of recoveries = Total revenue`

#### Why This Matters:
Revenue per client identifies:

- **Top clients** - Who generates most income
- **Growth opportunities** - Which clients to grow
- **Decline warnings** - Which clients losing volume
- **Pricing leverage** - High-volume clients may justify rate increase

#### Action Items:
- **High revenue clients** - Prioritize, nurture relationship, ensure satisfaction
- **Low revenue clients** - Evaluate if worth maintaining or should exit

---

### **Average Fee by Priority**

#### Purpose:
Average repo fee for High vs. Medium vs. Low priority clients.

#### Why This Matters:
Fee-to-priority alignment ensures:

- **High priority = High fee** - Premium service justified
- **Pricing strategy** - Priority tiers should correlate with fees
- **Negotiation leverage** - Low-fee clients shouldn't demand high priority

#### Expected Pattern:
- High Priority Average: $175+
- Medium Priority Average: $125-150
- Low Priority Average: $85-125

If high-priority clients are paying low fees, priority assignments should be reconsidered.

---

### **Flatbed Approval Rate**

#### Purpose:
Percentage of clients with flatbed pre-approved vs. requiring case-by-case approval.

#### Why This Matters:
High flatbed approval rate means:

- **Operational efficiency** - Less delays seeking approval
- **Higher revenue** - Capture flatbed premiums
- **Client trust** - Clients trust your judgment

#### Goal: 60%+ pre-approval rate

---

### **Client Concentration Risk**

#### Purpose:
Percentage of total revenue from top 5 clients.

#### Why This Matters:
High concentration = risk:

- **Loss of one client** - Devastating revenue impact
- **Pricing pressure** - Top clients can demand discounts
- **Strategic vulnerability** - Business depends on few clients

#### Healthy Range: Top 5 clients = 40-60% of revenue
#### Risk Zone: Top 5 clients = 70%+ of revenue

If too concentrated, actively pursue diversification.

---

## **Summary: Why Client Preferences Matter**

Effective client preference management directly impacts:

1. **Revenue Optimization** - Proper pricing and priority maximizes income
2. **Operational Efficiency** - Clear requirements prevent errors and delays
3. **Client Satisfaction** - Meeting preferences maintains relationships
4. **Risk Mitigation** - Documentation protects against disputes
5. **Strategic Planning** - Data enables informed business decisions
6. **Compliance** - Ensures contractual obligations are met

Every field in the Client Preferences system contributes to these outcomes. Accurate, comprehensive client data is the foundation of profitable, sustainable client relationships.

Without a client preferences system, operations devolve into chaos:
- Drivers guess at requirements
- Billing errors are frequent
- Clients are dissatisfied
- Profitability is unknown
- Contract violations occur
- Relationships deteriorate

With a robust client preferences system, operations are:
- Consistent and predictable
- Profitable and optimized
- Compliant and documented
- Scalable and sustainable

---

*This detailed guide explains the purpose and importance of each client preference field for comprehensive documentation and operational excellence.*









