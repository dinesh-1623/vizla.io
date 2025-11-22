# Stashed Vehicles - Detailed Documentation

## Stashed Vehicles Management System - Complete Guide

This document provides comprehensive explanations for all features, metrics, and workflows in the Stashed Vehicles system, including their purpose, importance, and operational impact.

---

## **Overview**

### Purpose:
The Stashed Vehicles system manages and tracks all recovered vehicles currently being stored in company-operated or contracted storage lots. It provides visibility into storage inventory, monitors storage costs, tracks vehicle aging, and manages the transition from recovery completion to final disposition (auction, client pickup, or further processing).

### Why This Matters:
Stashed vehicles represent completed work awaiting final disposition:

- **Cash flow milestone** - Recovery fee earned, awaiting payment
- **Ongoing costs** - Daily storage fees accumulating
- **Space management** - Limited lot capacity must be managed
- **Client deliverables** - Clients paying for storage until vehicle sold
- **Liability** - Company responsible for vehicle security and condition
- **Regulatory compliance** - Storage regulations and reporting requirements

### Impact on Operations:
Storage management directly affects profitability and capacity:

**Without proper stashed vehicle management:**
- Storage lots fill up, can't accept new recoveries
- Unknown storage costs erode profitability
- Vehicles lost, stolen, or damaged in storage
- Client invoicing errors due to unclear storage dates
- Regulatory violations from improper storage practices
- Inability to plan recovery capacity

**With robust stashed vehicle management:**
- Lot capacity optimized, always room for new recoveries
- Storage costs tracked and billed accurately
- Vehicles secure and accounted for
- Client invoicing accurate and timely
- Regulatory compliance maintained
- Strategic lot expansion decisions data-driven

---

## **Key Concepts**

### **What is "Stashed"?**

#### Definition:
"Stashed" is the status assigned to a vehicle immediately after successful recovery and delivery to a storage lot. The vehicle is no longer on the street, no longer being towed, but not yet disposed of by the client.

#### Lifecycle Position:
1. **Located** - Spotter finds vehicle
2. **Dispatched** - Driver assigned
3. **In Transit** - Driver towing vehicle
4. **Stashed** ← Current status
5. **Sold/Released** - Client disposes of vehicle

#### Duration:
Vehicles typically remain stashed for:
- **Short term**: 1-7 days (client picks up quickly)
- **Medium term**: 7-30 days (normal auction cycle)
- **Long term**: 30-90 days (special situations, legal holds)
- **Extended**: 90+ days (abandoned vehicles, title issues, disputes)

---

## **Storage Lot Management**

### **Purpose of Storage Lots**

#### Primary Functions:
1. **Secure holding** - Protect vehicles from theft, vandalism, and weather
2. **Client service** - Provide location for client vehicle inspection
3. **Inventory staging** - Organize vehicles for auction pickup
4. **Legal compliance** - Meet regulatory requirements for vehicle storage
5. **Operational hub** - Central point for vehicle processing

#### Business Model:
Storage lots generate revenue two ways:
1. **Recovery fees** - Towing service payment
2. **Storage fees** - Daily charges while vehicle stored

**Example Revenue:**
- Recovery fee: $150 (one-time)
- Storage fee: $25/day × 10 days = $250 (recurring)
- **Total**: $400 per vehicle

Storage can exceed recovery revenue for long-term holds!

---

### **Types of Storage Lots**

#### **Company-Owned Lots**

**Description**: Your company owns or leases the land and operates the facility.

**Advantages:**
- **Full control** - Operate as you see fit
- **Maximum profit** - Keep all storage revenue
- **Branding** - Your business, your reputation
- **Long-term asset** - Property may appreciate
- **Strategic positioning** - Place lots optimally

**Disadvantages:**
- **Capital intensive** - Expensive to acquire
- **Fixed costs** - Must pay rent/mortgage regardless of utilization
- **Maintenance burden** - Responsible for all upkeep
- **Liability** - Direct responsibility for security and damages
- **Regulatory compliance** - Obtain all permits and licenses

**Best For:**
- High-volume markets
- Long-term market commitment
- Companies with capital resources
- Markets where lot capacity is scarce

---

#### **Contracted Lots**

**Description**: Partner with existing storage facilities, tow companies, or impound lots to store your vehicles.

**Advantages:**
- **Low capital** - No property purchase needed
- **Variable cost** - Pay only for space used
- **Flexibility** - Can switch partners if needed
- **Reduced liability** - Shared responsibility
- **Quick expansion** - Add capacity rapidly

**Disadvantages:**
- **Profit sharing** - Pay partner, reduce your margin
- **Less control** - Partner sets some rules
- **Availability risk** - Partner may prioritize their vehicles
- **Quality variability** - Dependent on partner standards
- **Relationship management** - Requires ongoing coordination

**Best For:**
- New markets (test before buying)
- Low-volume markets
- Seasonal capacity needs
- Companies conserving capital

---

#### **Hybrid Model**

**Description**: Own primary lot(s), contract for overflow and remote areas.

**Advantages:**
- **Balanced** - Control for core capacity, flexibility for overflow
- **Risk managed** - Not entirely dependent on either model
- **Optimized costs** - Own high-use lots, contract low-use
- **Strategic options** - Can shift between models as needed

**Best For:**
- Mature operations
- Multi-market companies
- Variable demand environments

---

### **Lot Location Strategy**

#### **Geographic Considerations**

**Centralized Model:**
- **Description**: One or few large lots serving entire market
- **Pros**: Economies of scale, easier management
- **Cons**: Longer delivery distances, higher fuel costs
- **Best For**: Compact geographic markets

**Distributed Model:**
- **Description**: Multiple smaller lots throughout market
- **Pros**: Shorter delivery distances, faster recoveries
- **Cons**: Higher overhead, complex management
- **Best For**: Large geographic markets

**Zone-Based Model:**
- **Description**: One lot per operating zone
- **Pros**: Matches operational structure, balanced access
- **Cons**: Requires lot in each zone (may be expensive)
- **Best For**: Multi-zone operations with clear boundaries

---

## **Key Metrics and Statistics**

### **1. Vehicles in Storage**

#### Purpose:
Total count of all vehicles currently stashed across all lots.

#### Why This Matters:
This number represents:
- **Working capital** - Value tied up in inventory
- **Ongoing liability** - Vehicles you're responsible for
- **Revenue pending** - Recovery fees awaiting client payment
- **Future revenue** - Accumulating storage fees
- **Capacity consumption** - How full your lots are

#### Target Ranges:
- **Healthy**: 60-80% of lot capacity
  - *Too low* - Underutilized lots, wasted overhead
  - *Just right* - Busy operation, room for growth
  - *Too high* - Approaching capacity limit, need expansion

#### Operational Signals:
- **Increasing** - Business growing OR vehicles aging
- **Decreasing** - Clients picking up faster OR slower recovery rate
- **Stable** - Balanced inflow (recoveries) and outflow (pickups)
- **Volatile** - Unpredictable, may indicate process issues

#### Action Triggers:
- **>90% capacity** - Stop accepting new work, expand urgently
- **<40% capacity** - Consider downsizing or marketing to fill
- **Rapid growth** - Plan expansion before hitting limits
- **Unexpected drop** - Investigate if clients moving to competitors

---

### **2. Storage Lots (Count)**

#### Purpose:
Number of distinct storage facilities being used.

#### Why This Matters:
Lot count affects:
- **Fixed costs** - Each lot has rent, utilities, staffing
- **Management complexity** - More lots = more coordination
- **Geographic coverage** - More lots = shorter drive times
- **Capacity** - More lots = ability to handle more volume
- **Redundancy** - Multiple lots provide backup if one closes

#### Optimal Number:
- **1 lot**: Markets with <50 monthly recoveries
- **2-3 lots**: Markets with 50-200 monthly recoveries
- **4+ lots**: Markets with 200+ monthly recoveries or wide geography

#### Strategic Considerations:
**Too Few Lots:**
- Excessive drive times waste fuel and driver hours
- Single point of failure (lot closes = nowhere to store)
- Limited capacity constrains growth

**Too Many Lots:**
- High fixed costs reduce profitability
- Management overhead spreads resources thin
- Underutilization of each lot

---

### **3. Daily Storage Cost**

#### Purpose:
Total amount being spent per day to store all current vehicles across all lots.

#### Why This Matters:
Daily storage cost represents:
- **Cash outflow** - Money you're spending every day
- **Billing opportunity** - Amount you can invoice clients
- **Aging problem indicator** - High cost means vehicles staying too long
- **Profitability metric** - Must ensure storage fees cover storage costs

#### Calculation:
```
Daily Storage Cost = (Lot A cost/day) + (Lot B cost/day) + ...

Example:
Lot A: $25/vehicle × 15 vehicles = $375/day
Lot B: $25/vehicle × 20 vehicles = $500/day
Lot C: $25/vehicle × 18 vehicles = $450/day
Total: $1,325/day

Monthly: $1,325 × 30 days = $39,750
Annual: $39,750 × 12 = $477,000
```

That's nearly half a million dollars in annual storage costs for a modest operation!

#### Cost Components:
**Company-Owned Lots:**
- Rent or mortgage
- Property taxes
- Insurance
- Utilities (lights, water)
- Security (fencing, cameras, guards)
- Maintenance (paving, lighting)
- Staffing (lot manager, security)

**Contracted Lots:**
- Per-vehicle daily rate paid to partner
- Typically $15-30 per vehicle per day

#### Profitability Analysis:
**Revenue Side:**
- Charge client: $25-40/day per vehicle
- Cost: $15-30/day per vehicle
- **Margin**: $10/day per vehicle (if managed well)

**Example:**
- 50 vehicles stashed
- $25/day storage fee charged
- $20/day actual cost
- Profit: $5/day × 50 vehicles = $250/day = $7,500/month

Storage can be very profitable if costs controlled!

#### Red Flags:
- **Increasing despite stable vehicle count** - Costs rising
- **Negative margin** - Costs exceed revenue (pricing problem)
- **Unpredictable** - Can't forecast costs accurately

---

### **4. Average Storage Time**

#### Purpose:
Mean number of days vehicles remain stashed before final disposition.

#### Why This Matters:
Average storage time reveals:
- **Process efficiency** - How quickly clients handle vehicles
- **Cash flow** - Longer storage = delayed recovery fee payment
- **Cost accumulation** - Each extra day costs money
- **Client relationships** - Fast pickup indicates good relationships
- **Capacity utilization** - Faster turnover = more recoveries possible

#### Target Ranges:
- **Excellent**: 1-3 days (client immediate pickup)
- **Good**: 3-7 days (normal auction cycle)
- **Acceptable**: 7-14 days (monthly auctions)
- **Concerning**: 14-30 days (slow client processes)
- **Problem**: 30+ days (abandoned or problem vehicles)

#### Operational Impact:

**Short Average (3 days):**
- **Pros**: 
  - Fast cash flow
  - Low storage costs
  - High lot turnover
  - Can accept more work
- **Cons**:
  - Less storage fee revenue
  - Tight coordination required

**Long Average (20 days):**
- **Pros**:
  - Higher storage fee revenue
  - Less operational pressure
- **Cons**:
  - Slow cash flow
  - High storage costs
  - Lot capacity constrained
  - Cannot accept as much new work

#### Improvement Strategies:
1. **Client communication** - Remind clients of aging vehicles
2. **Auction coordination** - Align with client auction schedules
3. **Incentives** - Discount fees for fast pickup
4. **Penalties** - Charge premium for extended storage
5. **Process streamlining** - Remove barriers to quick pickup

---

## **Storage Operations**

### **Vehicle Intake Process**

#### Step 1: Driver Delivery
- Driver arrives at lot with recovered vehicle
- Confirms lot has space available
- Drives vehicle to assigned spot

#### Step 2: Documentation
- Record vehicle details (VIN, make, model, client)
- Note vehicle condition (damage, cleanliness)
- Photograph vehicle (front, back, sides, VIN)
- Record storage start date/time
- Log odometer reading

#### Step 3: Lot Assignment
- Assign lot space number
- Organize by client (all Capital One together)
- Group by auction date (all Jan 15 auction together)
- Separate damaged from intact vehicles

#### Step 4: System Update
- Update vehicle status to "Stashed"
- Record lot location
- Start storage fee billing
- Notify client of vehicle arrival

---

### **Lot Security**

#### Purpose:
Protect stashed vehicles from theft, vandalism, and unauthorized access.

#### Security Measures:

**Physical Security:**
- **Fencing** - 8-10 foot chain link or solid panel
- **Gating** - Locked gates with controlled access
- **Lighting** - Bright lights deter theft
- **Cameras** - Video surveillance (recording and live monitoring)
- **Guards** - On-site security personnel (24/7 or hours)
- **Access control** - Key cards, codes, or locks

**Operational Security:**
- **Vehicle inventory** - Daily counts verify all vehicles present
- **Access logs** - Record who enters/exits lot
- **Client coordination** - Schedule and escort inspections
- **Police relationships** - Local police patrol regularly
- **Alarm systems** - Motion detectors, breach alerts

#### Liability Concerns:
Your company is responsible for:
- **Theft** - Stolen vehicles must be replaced or compensated
- **Vandalism** - Damage while in your care
- **Environmental** - Fluid leaks, contamination
- **Personal injury** - Accidents on lot property
- **Fire** - Vehicle fires spreading to others

**Insurance:** Lot liability insurance is expensive but essential!

---

### **Vehicle Aging Management**

#### Purpose:
Monitor how long vehicles remain stashed and take action on aging inventory.

#### Aging Categories:

**Fresh (0-7 days):**
- **Status**: Normal
- **Action**: None, within standard timeline
- **Priority**: Low

**Maturing (7-14 days):**
- **Status**: Watch
- **Action**: Verify auction schedule with client
- **Priority**: Medium

**Aging (14-30 days):**
- **Status**: Concerning
- **Action**: Contact client, request pickup plan
- **Priority**: High

**Aged (30-60 days):**
- **Status**: Problem
- **Action**: Formal notice to client, discuss abandonment
- **Priority**: Urgent

**Abandoned (60+ days):**
- **Status**: Critical
- **Action**: Legal process for abandonment, lien sale
- **Priority**: Critical

#### Financial Impact of Aging:

**Example Vehicle:**
- Recovery fee: $150 (earned day 1)
- Storage cost: $20/day
- Storage fee charged: $30/day

**At 10 days:**
- Storage cost: $200
- Storage fee: $300
- Net profit: $250 (recovery + storage margin)

**At 60 days:**
- Storage cost: $1,200
- Storage fee: $1,800 (if client pays)
- Net profit: $750
- **BUT**: If client refuses payment due to long storage:
- Net profit: $150 - $1,200 = **-$1,050 LOSS**

Aged vehicles risk non-payment and losses!

---

### **Client Pickup Coordination**

#### Purpose:
Facilitate smooth, efficient pickup of vehicles by clients or their agents (auction companies, transporters).

#### Pickup Process:

**Step 1: Pickup Request**
- Client requests vehicle pickup
- Specify date, time, and hauler details
- Confirm vehicle location and condition

**Step 2: Scheduling**
- Coordinate pickup time with lot availability
- Ensure lot staff present to assist
- Verify hauler credentials

**Step 3: Vehicle Preparation**
- Locate vehicle in lot
- Move to accessible position (if buried)
- Prepare paperwork (release form, condition report)

**Step 4: Release**
- Verify hauler authorization
- Inspect vehicle with hauler, note condition
- Sign release documentation
- Provide keys (if available)
- Update system (vehicle released)

**Step 5: Billing**
- Calculate final storage days
- Generate invoice (recovery + storage fees)
- Send to client for payment

---

## **Financial Management**

### **Storage Fee Billing**

#### Purpose:
Accurately invoice clients for daily storage charges.

#### Billing Components:

**Base Storage Fee:**
- $25-40 per vehicle per day (market rate)
- Starts day of intake
- Ends day of pickup
- Example: 10 days × $30/day = $300

**Additional Fees:**
- **Administrative**: $25-50 one-time processing fee
- **Photo fee**: $10-25 for condition documentation
- **Jump start**: $50 if battery dead
- **Gate fee**: $75-150 if re-entry after pickup attempt
- **Late pickup**: $10/day penalty after scheduled pickup

#### Invoicing Timing:
- **Immediate**: Invoice sent at pickup (most common)
- **Weekly**: Batch invoices sent Friday for week's pickups
- **Monthly**: Single invoice per client per month

#### Payment Terms:
- **Net 15**: Payment due 15 days after invoice
- **Net 30**: Payment due 30 days after invoice
- **COD**: Cash on delivery (pickup)

#### Collection Issues:
- **Disputes**: Client challenges storage duration or fees
- **Non-payment**: Client refuses to pay
- **Bankruptcy**: Client files bankruptcy, may not pay

**Protection Strategies:**
- Accurate documentation (photos, dates, signatures)
- Clear contract terms
- Prompt invoicing
- Follow-up on overdue payments
- Lien rights on vehicle if unpaid

---

### **Lot Operating Costs**

#### Purpose:
Track and control all costs associated with storage lot operations.

#### Cost Categories:

**Fixed Costs (Same regardless of volume):**
- **Rent/Mortgage**: $2,000-10,000/month depending on size/location
- **Property Tax**: $500-3,000/month
- **Insurance**: $1,000-5,000/month (liability, property)
- **Utilities**: $200-500/month (lights, water)
- **Security**: $500-2,000/month (cameras, monitoring)

**Variable Costs (Scale with volume):**
- **Lot staff**: $15-25/hour × hours worked
- **Maintenance**: $0.50-2/vehicle (moving, washing, jumpstarts)
- **Partner fees**: $15-30/vehicle/day at contracted lots
- **Fuel**: Vehicle moving within lot

**Example Monthly Cost:**
```
Fixed: $6,000/month
Variable: 50 vehicles × 10 day average × $2/day = $1,000/month
Total: $7,000/month

Revenue: 50 vehicles × 10 days × $30/day = $15,000/month
Profit: $15,000 - $7,000 = $8,000/month
```

---

### **Capacity Planning**

#### Purpose:
Ensure adequate storage capacity to meet current and future demand.

#### Capacity Metrics:

**Total Capacity:**
- Maximum number of vehicles lot can hold
- Example: 5-acre lot = ~200 vehicles capacity

**Current Utilization:**
- (Vehicles in storage / Total capacity) × 100
- Example: 150 vehicles / 200 capacity = 75% utilized

**Available Capacity:**
- Total capacity - Current vehicles
- Example: 200 - 150 = 50 spots available

#### Planning Triggers:

**<50% utilized:**
- **Status**: Underutilized
- **Action**: Market to fill capacity or downsize

**50-70% utilized:**
- **Status**: Healthy
- **Action**: Monitor trends

**70-85% utilized:**
- **Status**: Busy
- **Action**: Begin expansion planning

**85-95% utilized:**
- **Status**: Near capacity
- **Action**: Accelerate expansion, may decline new work

**>95% utilized:**
- **Status**: At capacity
- **Action**: Stop accepting work or emergency overflow arrangements

#### Expansion Options:
1. **Add lot** - Acquire/contract new facility
2. **Expand existing** - Add land to current lot
3. **Partner** - Overflow agreement with competitor
4. **Stackers** - Multi-level parking (expensive)
5. **Process improvement** - Faster turnover increases effective capacity

---

## **Regulatory Compliance**

### **Common Regulations**

#### **Business Licensing:**
- **Towing license** - Operate tow vehicles
- **Storage facility license** - Operate impound/storage lot
- **Auto dealer license** - May be required for vehicle possession
- **Business license** - General business operation

#### **Vehicle Storage Rules:**
- **Notification** - Must notify vehicle owner of storage
- **Access** - Owner may have right to retrieve belongings
- **Lien rights** - Process to claim ownership for unpaid fees
- **Disposal** - Legal process to auction/scrap unclaimed vehicles
- **Environmental** - Fluid containment, hazardous material handling

#### **Record Keeping:**
- **Vehicle inventory** - Daily logs of all vehicles in storage
- **Intake records** - When vehicle arrived, from where, condition
- **Release records** - When vehicle left, to whom, authorization
- **Notification** - Proof of owner notification sent
- **Retention** - Keep records for 3-7 years (varies by state)

#### **Reporting:**
- **Police reports** - Vehicles in storage may need to be reported to local police
- **Stolen vehicle checks** - Verify not stolen before storage
- **Periodic audits** - Some jurisdictions audit storage facilities

### **Penalties for Non-Compliance:**
- **Fines** - $500-10,000+ per violation
- **License suspension** - Temporary shutdown
- **License revocation** - Permanent closure
- **Civil liability** - Lawsuits from vehicle owners
- **Criminal charges** - Extreme cases (illegal disposal, theft)

---

## **Key Performance Indicators (KPIs)**

### **1. Lot Turnover Rate**

**Formula:**
```
Lot Turnover = (Vehicles Released / Average Vehicles in Storage) × 365 days

Example:
- 100 vehicles released per month (1,200/year)
- Average 50 vehicles in storage
- Turnover = (1,200 / 50) = 24 times per year
- Average stay = 365 / 24 = 15 days
```

**Target:** 12-24 turnovers per year (15-30 day average stay)

---

### **2. Storage Revenue per Vehicle**

**Formula:**
```
Revenue per Vehicle = Total Storage Fees / Vehicles Released

Example:
- $50,000 storage fees collected per month
- 100 vehicles released per month
- $50,000 / 100 = $500 per vehicle average
```

**Target:** $300-600 per vehicle depending on average stay

---

### **3. Storage Profit Margin**

**Formula:**
```
Storage Margin = ((Storage Revenue - Storage Costs) / Storage Revenue) × 100

Example:
- Revenue: $50,000/month
- Costs: $35,000/month
- Margin: (($50,000 - $35,000) / $50,000) × 100 = 30%
```

**Target:** 25-40% margin

---

### **4. Aging Vehicle Percentage**

**Formula:**
```
Aging % = (Vehicles >30 days / Total Vehicles) × 100

Example:
- 10 vehicles over 30 days old
- 50 total vehicles
- Aging % = (10 / 50) × 100 = 20%
```

**Target:** <10% aging vehicles

---

## **Summary: Why Stashed Vehicle Management Matters**

Effective stashed vehicle management:

1. **Maximizes profitability** - Storage fees can exceed recovery fees
2. **Ensures capacity** - Never turn away work due to full lots
3. **Maintains security** - Protect assets and limit liability
4. **Enables growth** - Understand capacity limits and expansion needs
5. **Improves cash flow** - Faster turnover = faster payment
6. **Satisfies clients** - Secure, organized, accessible storage
7. **Ensures compliance** - Avoid fines, license issues, lawsuits

Without stashed vehicle management:
- Unknown capacity limits
- Uncontrolled costs
- Vehicle loss and damage
- Client dissatisfaction
- Regulatory violations
- Missed storage revenue

With robust stashed vehicle management:
- Optimized capacity utilization
- Controlled and profitable storage
- Secure, accountable inventory
- Satisfied clients
- Regulatory compliance
- Maximized revenue

**The stashed phase is not passive waiting - it's an active profit center that requires careful management!**

---

*This detailed guide explains the purpose and importance of stashed vehicle management for comprehensive documentation and operational excellence.*









