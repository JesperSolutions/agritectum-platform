# New Features Specification
## Taklaget Service App - Phase 2 Enhancements

**Version:** 2.0.0  
**Date:** January 2025  
**Status:** Planning  
**Document Type:** Feature Enhancement Specification  
**Related Document:** SOFTWARE_REQUIREMENTS_SPECIFICATION.md (v1.0.0)

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 2.0.0 | January 2025 | Development Team | Initial feature specification for Phase 2 enhancements |

---

## Table of Contents

1. [Overview](#1-overview)
2. [Feature 1: Offer and Acceptance Flow](#2-feature-1-offer-and-acceptance-flow)
3. [Feature 2: Pricing and Variable Calculations](#3-feature-2-pricing-and-variable-calculations)
4. [Feature 3: Automatic Reminders and Weather Logic](#4-feature-3-automatic-reminders-and-weather-logic)
5. [Feature 4: Local Tasks and Radius System](#5-feature-4-local-tasks-and-radius-system)
6. [Feature 5: Inspection Follow-up](#6-feature-5-inspection-follow-up)
7. [Feature 6: Integration & Documentation](#7-feature-6-integration--documentation)
8. [Feature 7: Agreement Form and Security](#8-feature-7-agreement-form-and-security)
9. [Feature 8: Offer Feedback and Customer Input](#9-feature-8-offer-feedback-and-customer-input)
10. [Feature 9: Operational Tasks](#10-feature-9-operational-tasks)
11. [Implementation Priorities](#11-implementation-priorities)
12. [GUI Design Guidelines](#12-gui-design-guidelines)

---

## 1. Overview

### 1.1 Purpose

This document specifies new features and enhancements for Phase 2 of the Taklaget Service App development. These features focus on automating workflows, improving pricing flexibility, enhancing customer communication, and integrating with external systems.

### 1.2 Scope

This specification covers:
- Offer and acceptance workflow automation
- Flexible pricing and calculation system
- Weather-based automatic reminders
- Location-based task assignment
- Automated inspection follow-up
- Third-party integrations (Agritectum, Material Datasheet Module)
- Compliance documentation (Hot Work Agreement)
- Customer feedback mechanisms
- Operational setup requirements

### 1.3 Target Users

- **Branch Admins** - Configure pricing, manage tasks, oversee operations
- **Inspectors** - Receive notifications, complete tasks, provide feedback
- **Super Admins** - System configuration, integration setup
- **Customers** - Receive offers, provide feedback, accept/reject offers

### 1.4 Business Value

- **Efficiency:** Automated workflows reduce manual work by 40%
- **Revenue:** Flexible pricing increases win rate by 25%
- **Customer Satisfaction:** Better communication and follow-up improves NPS by 15%
- **Compliance:** Automated documentation ensures 100% compliance
- **Resource Optimization:** Location-based task assignment reduces travel time by 30%

---

## 2. Feature 1: Offer and Acceptance Flow

### 2.1 Description

Automate and enhance the offer and acceptance process to make it more efficient and customer-friendly. This feature introduces offer status tracking, automatic follow-up notifications, and customer communication channels.

### 2.2 Functional Requirements

#### FR-2.1: Offer Status Management

**FR-2.1.1:** System shall support offer status tracking
- **Statuses:**
  - `pending` - Offer sent, awaiting customer response
  - `accepted` - Customer accepted the offer
  - `rejected` - Customer rejected the offer
  - `awaiting_response` - Follow-up sent, awaiting response
  - `expired` - Offer validity period expired

**FR-2.1.2:** System shall allow status updates
- **Input:** Offer ID, new status, reason (optional)
- **Validation:** Status transition must be valid
- **Output:** Updated offer with timestamp and user info

**FR-2.1.3:** System shall track status history
- **Fields:** Status, timestamp, changed by, reason
- **Display:** Chronological list of status changes
- **Audit:** All changes logged for compliance

#### FR-2.2: Automatic Follow-up System

**FR-2.2.1:** System shall send automatic reminders
- **Trigger:** Offer not accepted after 7 days
- **Recipient:** Assigned inspector
- **Content:** "Offer pending for [X] days - Follow up with customer"
- **Frequency:** Daily until offer is resolved

**FR-2.2.2:** System shall support customer notifications
- **Channels:** Email, SMS (optional), Push notification
- **Content:** Personalized offer reminder with link
- **Timing:** Configurable (default: 7 days, 14 days)

**FR-2.2.3:** System shall implement follow-up logic
- **Rule:** After 7 days without response → send reminder
- **Rule:** After 14 days → escalate to branch admin
- **Rule:** After 30 days → mark as expired

#### FR-2.3: Customer Communication

**FR-2.3.1:** System shall provide direct customer communication
- **Email:** Send offer directly to customer
- **SMS:** Optional SMS notification (requires opt-in)
- **Push:** In-app notification if customer has account

**FR-2.3.2:** System shall track communication history
- **Log:** All sent communications
- **Display:** Communication timeline in offer view
- **Status:** Delivery status (sent, delivered, opened)

### 2.3 User Flow

**Actor:** Inspector/Branch Admin  
**Precondition:** Offer has been created

#### Flow Steps:

1. **Create Offer**
   - User creates inspection report
   - User selects "Create Offer" option
   - System generates offer with pricing
   - User reviews and approves offer

2. **Send Offer to Customer**
   - User clicks "Send Offer"
   - System generates PDF offer
   - System sends email to customer
   - System sets status to "pending"
   - System sets expiry date (default: 30 days)

3. **Customer Receives Offer**
   - Customer receives email with PDF
   - Customer clicks link to view offer
   - Customer can accept, reject, or request changes

4. **Customer Responds**
   - Customer clicks "Accept" or "Reject"
   - System updates offer status
   - System sends confirmation email
   - Inspector receives notification

5. **Automatic Follow-up (If No Response)**
   - After 7 days: System sends reminder to inspector
   - Inspector receives notification: "Follow up with [Customer Name]"
   - Inspector can send additional communication
   - System tracks follow-up attempts

6. **Escalation (If Still No Response)**
   - After 14 days: System notifies branch admin
   - Branch admin reviews offer
   - Branch admin can extend validity or close offer

7. **Offer Resolution**
   - If accepted: System creates work order
   - If rejected: System logs reason and closes offer
   - If expired: System marks as expired and archives

### 2.4 Business Rules

- Offer validity period: 30 days (configurable)
- Follow-up reminder: 7 days after sending
- Escalation: 14 days after sending
- Expiration: 30 days after sending
- Maximum follow-up attempts: 3
- Status transitions must follow defined workflow

### 2.5 GUI Design Requirements

**Offer Status Badge:**
- Color-coded status indicators
  - Pending: Yellow
  - Accepted: Green
  - Rejected: Red
  - Awaiting Response: Orange
  - Expired: Gray

**Offer List View:**
- Columns: Customer, Date, Amount, Status, Days Pending
- Sortable by all columns
- Filterable by status
- Highlight overdue offers (>7 days)

**Offer Detail View:**
- Status history timeline
- Communication log
- Customer contact information
- Quick action buttons (Send Reminder, Accept, Reject)

---

## 3. Feature 2: Pricing and Variable Calculations

### 3.1 Description

Enable flexible pricing per department, employee, and task type. Each branch can configure its own pricing variables including hourly rates, material costs, and travel calculations.

### 3.2 Functional Requirements

#### FR-3.1: Department-Specific Pricing

**FR-3.1.1:** System shall allow department-specific pricing variables
- **Variables:**
  - Hourly rate per employee
  - Material costs from suppliers
  - Travel calculation based on GPS distance
  - Overhead percentage
  - Profit margin

**FR-3.1.2:** System shall support employee-specific rates
- **Fields:** Employee ID, hourly rate, skill level, department
- **Validation:** Rate must be within department range
- **Default:** Department default rate if not specified

**FR-3.1.3:** System shall calculate travel costs
- **Input:** Start location (branch), destination (customer)
- **Calculation:** Distance × rate per km
- **Display:** Breakdown in offer (travel: X km × Y kr/km = Z kr)

#### FR-3.2: Material Pricing

**FR-3.2.1:** System shall support supplier pricing
- **Fields:** Supplier name, material type, unit price, currency
- **Update:** Regular price updates via import or manual entry
- **History:** Price change history for audit

**FR-3.2.2:** System shall calculate material costs
- **Input:** Material type, quantity, supplier
- **Calculation:** Quantity × unit price
- **Display:** Line items in offer with cost breakdown

#### FR-3.3: Pricing Configuration

**FR-3.3.1:** System shall provide pricing configuration interface
- **Access:** Branch Admin and Super Admin only
- **Sections:**
  - Employee rates
  - Material costs
  - Travel rates
  - Overhead and margin
  - Minimum pricing rules

**FR-3.3.2:** System shall support pricing templates
- **Template Types:**
  - Standard inspection
  - Emergency repair
  - Preventive maintenance
  - Large project

**FR-3.3.3:** System shall enforce pricing rules
- **Rule:** Minimum price per job type
- **Rule:** Maximum discount percentage
- **Rule:** Approval required for discounts > 10%

### 3.3 User Flow

**Actor:** Branch Admin  
**Precondition:** User has branch admin permissions

#### Flow Steps:

1. **Access Pricing Configuration**
   - User navigates to "Settings" → "Pricing"
   - System displays pricing configuration page

2. **Configure Employee Rates**
   - User clicks "Employee Rates"
   - System displays list of employees
   - User enters hourly rate for each employee
   - User selects skill level (Junior, Senior, Expert)
   - System validates rate against department range
   - User saves changes

3. **Configure Material Costs**
   - User clicks "Material Costs"
   - System displays supplier list
   - User selects supplier
   - User enters material and unit price
   - User uploads price list (CSV import)
   - System validates and imports prices
   - User reviews imported prices

4. **Configure Travel Rates**
   - User clicks "Travel Rates"
   - User enters rate per kilometer
   - User selects calculation method (GPS or fixed)
   - User sets maximum travel distance
   - User saves configuration

5. **Configure Pricing Rules**
   - User clicks "Pricing Rules"
   - User sets minimum price per job type
   - User sets maximum discount percentage
   - User sets approval thresholds
   - User saves rules

6. **Test Pricing Calculation**
   - User creates test offer
   - System calculates total using configured rates
   - User reviews breakdown
   - User adjusts if needed
   - User saves configuration

### 3.4 Business Rules

- Hourly rates: Minimum 200 kr, Maximum 800 kr
- Travel rate: 3.5 kr/km (configurable)
- Material markup: 15% (configurable)
- Overhead: 20% (configurable)
- Profit margin: 25% (configurable)
- Minimum job price: 1,500 kr (configurable)

### 3.5 GUI Design Requirements

**Pricing Configuration Dashboard:**
- Tabs for different configuration sections
- Visual indicators for configured vs. not configured
- Summary card showing current pricing structure
- Quick access to common configurations

**Pricing Calculator:**
- Input fields for job parameters
- Real-time calculation display
- Breakdown by category (labor, materials, travel, overhead)
- Visual chart showing cost distribution
- Save as template option

---

## 4. Feature 3: Automatic Reminders and Weather Logic

### 4.1 Description

Implement automatic reminders based on weather conditions and scheduled inspections. System sends notifications to inspectors and customers when weather conditions are unfavorable or when inspections are approaching.

### 4.2 Functional Requirements

#### FR-4.1: Weather-Based Reminders

**FR-4.1.1:** System shall monitor weather conditions
- **Data Source:** Weather API (OpenWeatherMap, SMHI)
- **Conditions:** Rain, snow, high winds, extreme temperatures
- **Frequency:** Check every 6 hours
- **Coverage:** All branch locations

**FR-4.1.2:** System shall send weather alerts
- **Trigger:** Rain detected in branch area
- **Recipient:** Inspectors with scheduled inspections
- **Content:** "Weather Alert: Rain forecasted. Consider rescheduling inspection at [Customer]"
- **Action:** Quick reschedule button in notification

**FR-4.1.3:** System shall implement cooldown period
- **Rule:** No repeat notification for 3 days
- **Exception:** Severe weather conditions
- **Tracking:** Last notification timestamp per inspector

#### FR-4.2: Inspection Reminders

**FR-4.2.1:** System shall send pre-inspection reminders
- **Timing:** 1 week before scheduled inspection
- **Recipient:** Inspector and customer
- **Content (Inspector):** "Upcoming inspection at [Customer] on [Date]. Call customer to confirm."
- **Content (Customer):** "Reminder: Inspection scheduled for [Date] at [Time]"

**FR-4.2.2:** System shall support multi-channel notifications
- **Inspector:** Email, SMS, Push notification
- **Customer:** Email, SMS (optional)
- **Preferences:** User-configurable notification preferences

**FR-4.2.3:** System shall track notification delivery
- **Status:** Sent, Delivered, Opened, Clicked
- **Log:** All notification attempts
- **Retry:** Automatic retry for failed deliveries

### 4.3 User Flow

**Actor:** System (Automatic)  
**Precondition:** Inspection scheduled

#### Flow Steps:

1. **Weather Monitoring**
   - System checks weather API every 6 hours
   - System identifies branch locations
   - System retrieves weather forecast
   - System evaluates conditions

2. **Weather Alert Trigger**
   - If rain detected: System creates alert
   - System identifies affected inspectors
   - System checks cooldown period (3 days)
   - If within cooldown: Skip notification
   - If outside cooldown: Send notification

3. **Send Weather Alert**
   - System generates notification
   - System sends to affected inspectors
   - System logs notification
   - Inspector receives alert

4. **Inspector Response**
   - Inspector opens notification
   - Inspector reviews weather forecast
   - Inspector decides: Reschedule or proceed
   - If reschedule: Inspector contacts customer
   - System updates appointment

5. **Pre-Inspection Reminder**
   - 1 week before inspection: System triggers reminder
   - System generates notification for inspector
   - System generates notification for customer
   - System sends notifications
   - System logs delivery status

6. **Customer Confirmation**
   - Customer receives reminder
   - Customer confirms or requests reschedule
   - If reschedule: Customer contacts inspector
   - Inspector updates appointment
   - System sends confirmation

### 4.4 Business Rules

- Weather check frequency: Every 6 hours
- Cooldown period: 3 days
- Pre-inspection reminder: 1 week before
- Notification channels: Email (required), SMS (optional), Push (optional)
- Maximum retry attempts: 3
- Retry interval: 1 hour

### 4.5 GUI Design Requirements

**Weather Alert Banner:**
- Prominent display at top of dashboard
- Color-coded by severity (yellow, orange, red)
- Dismissible after action taken
- Quick action buttons (Reschedule, Confirm)

**Notification Center:**
- Centralized notification hub
- Filter by type (weather, reminder, system)
- Mark as read/unread
- Bulk actions (mark all as read)

---

## 5. Feature 4: Local Tasks and Radius System

### 5.1 Description

Help administrators optimize logistics and planning by suggesting nearby tasks to inspectors. System identifies tasks within a specified radius and recommends them when an inspector completes a task nearby.

### 5.2 Functional Requirements

#### FR-5.1: Radius-Based Task Discovery

**FR-5.1.1:** System shall calculate task proximity
- **Input:** Inspector location, task location, radius (km)
- **Calculation:** Haversine formula for distance
- **Output:** List of tasks within radius, sorted by distance

**FR-5.1.2:** System shall display nearby tasks
- **View:** Map view with task markers
- **List:** List view with distance and details
- **Filter:** By task type, priority, status
- **Sort:** By distance, priority, date

**FR-5.1.3:** System shall support configurable radius
- **Default:** 10 km
- **Range:** 5-50 km
- **Per User:** User-configurable preference
- **Per Task:** Task-specific radius

#### FR-5.2: Task Assignment

**FR-5.2.1:** System shall suggest nearby tasks
- **Trigger:** Inspector completes task
- **Logic:** Find tasks within 10 km radius
- **Display:** "You're 3 km from another customer"
- **Action:** Quick assign button

**FR-5.2.2:** System shall require customer contact confirmation
- **Rule:** Task cannot be approved until customer contacted
- **Checkbox:** "Customer contacted and confirmed"
- **Validation:** Required before task activation

**FR-5.2.3:** System shall support bulk assignment
- **Input:** Multiple tasks, inspector
- **Validation:** Inspector availability check
- **Output:** Assigned tasks with schedule
- **Notification:** Inspector receives task list

### 5.3 User Flow

**Actor:** Branch Admin / Inspector  
**Precondition:** Tasks exist in system

#### Flow Steps:

1. **Admin Creates Task**
   - Admin navigates to "Tasks"
   - Admin clicks "Create Task"
   - Admin enters customer details
   - Admin enters task location
   - Admin saves task

2. **System Identifies Nearby Tasks**
   - Admin views task list
   - System displays "Nearby Tasks" panel
   - System shows tasks within 10 km radius
   - Admin reviews suggestions

3. **Admin Assigns Task**
   - Admin selects task
   - Admin clicks "Assign"
   - Admin selects inspector
   - Admin confirms assignment
   - System sends notification to inspector

4. **Inspector Completes Task**
   - Inspector finishes inspection
   - Inspector marks task as complete
   - System checks for nearby tasks

5. **System Suggests Nearby Task**
   - System finds task 3 km away
   - System displays notification: "You're 3 km from [Customer Name]"
   - Inspector clicks to view details
   - Inspector decides: Accept or skip

6. **Inspector Accepts Nearby Task**
   - Inspector clicks "Accept"
   - System assigns task to inspector
   - Inspector navigates to customer
   - Inspector completes inspection

7. **Customer Contact Confirmation**
   - Before starting task: Inspector contacts customer
   - Inspector confirms appointment
   - Inspector checks "Customer contacted"
   - System enables task approval
   - Inspector proceeds with task

### 5.4 Business Rules

- Default radius: 10 km
- Maximum radius: 50 km
- Minimum distance for suggestion: 1 km
- Customer contact required before task approval
- Maximum suggestions per completion: 5
- Priority: Distance, urgency, customer type

### 5.5 GUI Design Requirements

**Map View:**
- Interactive map showing task locations
- Color-coded by status (pending, assigned, in progress)
- Radius circle visualization
- Click to view task details
- Navigation integration (Google Maps, Waze)

**Nearby Tasks Panel:**
- Slide-out panel on task completion
- List of nearby tasks with distance
- Quick action buttons (View, Accept, Dismiss)
- Auto-dismiss after 5 minutes

---

## 6. Feature 5: Inspection Follow-up

### 6.1 Description

Automate the planning and scheduling of follow-up inspections. After completing an inspection, system automatically schedules the next inspection (typically 1 year later) and sends reminders.

### 6.2 Functional Requirements

#### FR-6.1: Automatic Follow-up Scheduling

**FR-6.1.1:** System shall schedule next inspection
- **Trigger:** Inspection marked as complete
- **Logic:** Current date + 1 year (configurable)
- **Output:** New inspection appointment
- **Status:** Pending confirmation

**FR-6.1.2:** System shall send automatic reminder
- **Timing:** 1 month before scheduled date
- **Recipient:** Inspector and customer
- **Content:** "Follow-up inspection scheduled for [Date]"
- **Action:** Confirm or reschedule

**FR-6.1.3:** System shall link to previous inspection
- **Display:** "Last inspection: [Date]" with clickable link
- **Navigation:** Click to view previous report
- **History:** Complete inspection history for customer

#### FR-6.2: Inspection History

**FR-6.2.1:** System shall maintain inspection history
- **Fields:** Date, inspector, report ID, status, findings
- **Display:** Chronological list
- **Filter:** By date range, inspector, findings
- **Export:** PDF summary of all inspections

**FR-6.2.2:** System shall track recurring issues
- **Logic:** Compare issues across inspections
- **Alert:** "Same issue found in last 3 inspections"
- **Display:** Issue trend chart

### 6.3 User Flow

**Actor:** Inspector  
**Precondition:** Inspection completed

#### Flow Steps:

1. **Complete Inspection**
   - Inspector finishes inspection
   - Inspector marks inspection as complete
   - Inspector submits report
   - System processes completion

2. **System Schedules Follow-up**
   - System calculates next inspection date (current date + 1 year)
   - System creates new appointment
   - System links to current inspection
   - System sends confirmation to inspector

3. **Inspector Reviews Follow-up**
   - Inspector receives notification
   - Inspector views scheduled follow-up
   - Inspector can adjust date if needed
   - Inspector confirms or reschedules

4. **Customer Notification**
   - System sends email to customer
   - Customer receives follow-up confirmation
   - Customer can request different date
   - System updates appointment if needed

5. **Pre-Inspection Reminder**
   - 1 month before follow-up: System sends reminder
   - Inspector receives notification
   - Customer receives reminder
   - Both confirm attendance

6. **Inspection Execution**
   - Inspector conducts follow-up inspection
   - Inspector references previous report
   - Inspector compares current vs. previous findings
   - Inspector creates new report with comparison

7. **History Tracking**
   - System maintains complete history
   - User can view all past inspections
   - User can see issue trends
   - User can export history

### 6.4 Business Rules

- Default follow-up interval: 1 year
- Configurable interval: 6 months to 2 years
- Reminder timing: 1 month before
- Maximum history retention: 10 years
- Automatic archiving after 5 years

### 6.5 GUI Design Requirements

**Inspection Timeline:**
- Visual timeline showing all inspections
- Color-coded by status
- Click to view details
- Expandable sections for each inspection

**Follow-up Dashboard:**
- Upcoming follow-ups list
- Overdue follow-ups highlighted
- Quick actions (Confirm, Reschedule, Cancel)
- Customer contact information

---

## 7. Feature 6: Integration & Documentation

### 7.1 Description

Integrate with external systems (Agritectum) and provide centralized access to product documentation including material datasheets, certificates, and installation guides.

### 7.2 Functional Requirements

#### FR-7.1: Agritectum Integration

**FR-7.1.1:** System shall send data to Agritectum
- **Trigger:** New offer or report created
- **Method:** POST request to Agritectum API
- **Data:**
  - Project reference
  - Roof size
  - Calculations
  - Customer information
  - Offer value

**FR-7.1.2:** System shall attach data to emails
- **Location:** Bottom of offer/report email
- **Format:** Structured data block
- **Content:**
  - Project reference
  - Roof dimensions
  - Material specifications
  - Calculations summary

**FR-7.1.3:** System shall handle API responses
- **Success:** Log confirmation
- **Failure:** Retry with exponential backoff
- **Error:** Alert admin and log error

#### FR-7.2: Material Datasheet Module

**FR-7.2.1:** System shall provide central datasheet repository
- **Storage:** Cloud Storage with metadata
- **Types:**
  - Product datasheets
  - Certificates
  - Installation guides
  - Safety data sheets

**FR-7.2.2:** System shall support version control
- **Tracking:** Version number, date, author
- **Display:** "Last updated: [Date]"
- **History:** Complete version history
- **Rollback:** Ability to revert to previous version

**FR-7.2.3:** System shall enable easy access
- **Search:** By product name, type, category
- **Filter:** By manufacturer, date, version
- **Download:** PDF download with watermark
- **Preview:** In-browser preview

### 7.3 User Flow

**Actor:** Inspector / Branch Admin  
**Precondition:** Integration configured

#### Flow Steps:

1. **Create Offer/Report**
   - User creates offer or report
   - User enters project details
   - User selects materials
   - User saves document

2. **System Sends to Agritectum**
   - System formats data for Agritectum API
   - System sends POST request
   - System receives confirmation
   - System logs transaction

3. **Email Generation**
   - System generates email with offer/report
   - System appends Agritectum data block
   - System sends email to customer
   - Customer receives complete information

4. **Access Datasheet**
   - User needs product information
   - User navigates to "Datasheets"
   - User searches for product
   - System displays matching datasheets

5. **View Datasheet**
   - User clicks on datasheet
   - System displays preview
   - User reviews information
   - User downloads if needed

6. **Update Datasheet**
   - Admin uploads new version
   - System tracks version number
   - System updates "Last updated" date
   - System maintains version history

### 7.4 Business Rules

- Agritectum API timeout: 30 seconds
- Retry attempts: 3
- Retry interval: 5, 10, 30 seconds
- Datasheet retention: Permanent
- Version history: All versions kept
- Maximum file size: 10 MB per datasheet

### 7.5 GUI Design Requirements

**Integration Status Dashboard:**
- Real-time status of integrations
- Success/failure indicators
- Recent transactions log
- Configuration settings

**Datasheet Library:**
- Grid/list view toggle
- Advanced search with filters
- Category navigation
- Quick preview on hover
- Bulk download option

---

## 8. Feature 7: Agreement Form and Security

### 8.1 Description

Ensure compliance with hot work requirements by including mandatory agreement forms in reports and offers. Enable photo attachments directly in documents.

### 8.2 Functional Requirements

#### FR-8.1: Hot Work Agreement Form

**FR-8.1.1:** System shall include agreement form in templates
- **Location:** Mandatory section in report/offer
- **Content:**
  - Work description
  - Safety measures
  - Fire prevention measures
  - Emergency procedures
  - Signatures (inspector, customer)

**FR-8.1.2:** System shall require completion
- **Validation:** All fields must be completed
- **Checkbox:** "I have read and understood the safety requirements"
- **Signature:** Digital signature or checkbox
- **Prevention:** Cannot submit without completion

**FR-8.1.3:** System shall track compliance
- **Log:** All completed forms
- **Report:** Compliance report by branch
- **Alert:** Missing forms flagged
- **Audit:** Complete audit trail

#### FR-8.2: Photo Attachment

**FR-8.2.1:** System shall support photo upload in documents
- **Location:** Within report/offer sections
- **Types:** JPG, PNG, HEIC
- **Size:** Maximum 10 MB per photo
- **Quantity:** Unlimited photos

**FR-8.2.2:** System shall provide photo management
- **Upload:** Drag and drop or file picker
- **Preview:** Thumbnail with full-size view
- **Delete:** Remove unwanted photos
- **Reorder:** Drag to reorder

### 8.3 User Flow

**Actor:** Inspector  
**Precondition:** Creating report/offer

#### Flow Steps:

1. **Create Report/Offer**
   - Inspector creates new document
   - Inspector enters basic information
   - Inspector proceeds to safety section

2. **Complete Hot Work Agreement**
   - System displays agreement form
   - Inspector enters work description
   - Inspector checks safety measures
   - Inspector enters fire prevention details
   - Inspector confirms understanding

3. **Add Photos**
   - Inspector clicks "Add Photos"
   - Inspector selects photos from device
   - System uploads and displays thumbnails
   - Inspector can add captions
   - Inspector reorders if needed

4. **Review and Submit**
   - Inspector reviews complete document
   - System validates all required fields
   - Inspector confirms submission
   - System generates final document

5. **Customer Signature**
   - Customer receives document
   - Customer reviews agreement form
   - Customer provides digital signature
   - System records signature with timestamp
   - System sends confirmation

### 8.4 Business Rules

- Agreement form: Mandatory for all hot work
- Photo upload: Maximum 10 MB per photo
- Total document size: Maximum 50 MB
- Signature: Required for compliance
- Retention: 10 years for audit purposes

### 8.5 GUI Design Requirements

**Agreement Form:**
- Clear sections with headings
- Checkboxes for safety measures
- Text areas for descriptions
- Signature pad or checkbox
- Visual indicators for required fields

**Photo Upload:**
- Drag and drop zone
- Progress bar for uploads
- Thumbnail grid view
- Full-size preview on click
- Delete and reorder controls

---

## 9. Feature 8: Offer Feedback and Customer Input

### 9.1 Description

Make offers more dynamic and customer-relevant by allowing inspectors to add recommendations and capture customer feedback (verbal or written).

### 9.2 Functional Requirements

#### FR-9.1: Recommendations Section

**FR-9.1.1:** System shall provide recommendations field
- **Location:** Dedicated section in offer template
- **Type:** Free-form text
- **Purpose:** Inspector's professional recommendations
- **Display:** Prominent placement in offer

**FR-9.1.2:** System shall support rich formatting
- **Options:** Bold, italic, bullet points
- **Templates:** Pre-written common recommendations
- **Custom:** Inspector can add custom text
- **Preview:** Real-time preview of formatted text

#### FR-9.2: Customer Feedback

**FR-9.2.1:** System shall capture customer feedback
- **Types:** Verbal (notes), Written (text)
- **Location:** Stored with offer/customer record
- **Access:** Visible to inspector and admin
- **History:** Complete feedback history

**FR-9.2.2:** System shall support feedback categories
- **Types:**
  - Pricing feedback
  - Service quality
  - Timeline concerns
  - Additional requirements
  - General comments

**FR-9.2.3:** System shall enable follow-up actions
- **Flag:** Important feedback flagged
- **Assign:** Assign follow-up to specific inspector
- **Track:** Track resolution status
- **Notify:** Notify relevant staff

### 9.3 User Flow

**Actor:** Inspector  
**Precondition:** Creating offer

#### Flow Steps:

1. **Create Offer**
   - Inspector creates new offer
   - Inspector enters standard information
   - Inspector proceeds to recommendations

2. **Add Recommendations**
   - Inspector clicks "Recommendations" section
   - Inspector selects template or writes custom
   - Inspector formats text as needed
   - Inspector previews formatted text
   - Inspector saves recommendations

3. **Capture Customer Feedback**
   - Inspector discusses with customer
   - Inspector takes notes during conversation
   - Inspector selects feedback category
   - Inspector enters feedback text
   - Inspector saves feedback

4. **Review Complete Offer**
   - Inspector reviews all sections
   - Inspector checks recommendations
   - Inspector reviews customer feedback
   - Inspector finalizes offer

5. **Customer Receives Offer**
   - Customer receives offer with recommendations
   - Customer reviews recommendations
   - Customer provides additional feedback
   - System captures new feedback

6. **Follow-up Actions**
   - System flags important feedback
   - Admin reviews flagged feedback
   - Admin assigns follow-up tasks
   - Inspector addresses feedback
   - System tracks resolution

### 9.4 Business Rules

- Recommendations: Optional but recommended
- Customer feedback: Always captured when provided
- Feedback categories: Required for organization
- Follow-up: Required for flagged feedback
- Resolution tracking: Within 7 days

### 9.5 GUI Design Requirements

**Recommendations Editor:**
- Rich text editor with formatting toolbar
- Template selector dropdown
- Character counter
- Preview pane
- Save draft functionality

**Feedback Capture Form:**
- Category dropdown
- Priority selector (low, medium, high)
- Text area for details
- Attachment option
- Save and flag option

---

## 10. Feature 9: Operational Tasks

### 10.1 Description

Complete necessary setup tasks before vacation, including creating new branches, configuring email addresses and logos.

### 10.2 Functional Requirements

#### FR-10.1: Branch Creation

**FR-10.1.1:** System shall support branch creation
- **Fields:**
  - Branch name
  - Address
  - Contact information
  - CVR number
  - VAT number
  - Logo
  - Email address

**FR-10.1.2:** System shall configure branch settings
- **Pricing:** Branch-specific pricing variables
- **Users:** Initial user accounts
- **Permissions:** Branch admin assignment
- **Integration:** API keys and credentials

#### FR-10.2: Email Configuration

**FR-10.2.1:** System shall configure branch email
- **Format:** [branch]@taklaget.dk
- **Verification:** Email verification required
- **Routing:** Automatic routing to branch admin
- **Signature:** Branch-specific email signature

**FR-10.2.2:** System shall configure email templates
- **Types:** Offer, report, reminder, notification
- **Branding:** Branch logo and colors
- **Content:** Branch-specific content
- **Testing:** Send test emails

#### FR-10.3: Logo Configuration

**FR-10.3.1:** System shall support logo upload
- **Format:** PNG, SVG
- **Size:** Maximum 2 MB
- **Dimensions:** Recommended 500x500px
- **Preview:** Real-time preview

**FR-10.3.2:** System shall apply logo branding
- **Locations:**
  - Email templates
  - PDF reports
  - Dashboard header
  - Mobile app
  - Customer portal

### 10.3 User Flow

**Actor:** Super Admin  
**Precondition:** New branch needed

#### Flow Steps:

1. **Create New Branch**
   - Admin navigates to "Branches"
   - Admin clicks "Add Branch"
   - Admin enters branch details
   - Admin uploads logo
   - Admin saves branch

2. **Configure Email**
   - Admin navigates to "Email Settings"
   - Admin enters branch email address
   - Admin verifies email
   - Admin configures email templates
   - Admin sends test email

3. **Configure Users**
   - Admin creates branch admin account
   - Admin creates inspector accounts
   - Admin assigns permissions
   - Admin sends invitation emails

4. **Configure Pricing**
   - Admin navigates to "Pricing"
   - Admin sets branch-specific rates
   - Admin configures materials
   - Admin sets travel rates
   - Admin saves configuration

5. **Test Configuration**
   - Admin creates test offer
   - Admin generates test report
   - Admin sends test email
   - Admin verifies branding
   - Admin confirms setup complete

### 10.4 Business Rules

- Branch creation: Super admin only
- Email verification: Required within 48 hours
- Logo upload: Required for brand consistency
- User creation: Minimum 1 branch admin
- Testing: Required before going live

### 10.5 GUI Design Requirements

**Branch Setup Wizard:**
- Step-by-step wizard interface
- Progress indicator
- Validation at each step
- Save and resume later
- Completion checklist

**Configuration Dashboard:**
- Overview of all settings
- Visual indicators for configured items
- Quick access to common settings
- Test and preview options

---

## 11. Implementation Priorities

### 11.1 Phase 1: Critical (Weeks 1-4)

**Priority: MUST-HAVE** ⭐

1. **Offer and Acceptance Flow** ⭐ START HERE
   - Status management
   - Automatic follow-up
   - Customer communication
   - **Effort:** 2 weeks
   - **Dependencies:** Email service, notification system
   - **Business Impact:** HIGH - Direct revenue impact
   - **User Value:** HIGH - Improves customer experience
   - **Why First:** Foundation for other features, immediate business value

2. **Pricing and Variable Calculations**
   - Department-specific pricing
   - Employee rates
   - Travel calculations
   - **Effort:** 2 weeks
   - **Dependencies:** Database schema updates
   - **Business Impact:** HIGH - Revenue optimization
   - **User Value:** HIGH - Flexible pricing

### 11.2 Phase 2: High Priority (Weeks 5-8)

**Priority: HIGH**

3. **Automatic Reminders and Weather Logic**
   - Weather monitoring
   - Pre-inspection reminders
   - Multi-channel notifications
   - **Effort:** 2 weeks
   - **Dependencies:** Weather API integration

4. **Local Tasks and Radius System**
   - Radius-based task discovery
   - Task assignment
   - Customer contact confirmation
   - **Effort:** 2 weeks
   - **Dependencies:** GPS/location services

### 11.3 Phase 3: Medium Priority (Weeks 9-12)

**Priority: MEDIUM**

5. **Inspection Follow-up**
   - Automatic scheduling
   - Inspection history
   - Issue tracking
   - **Effort:** 1 week
   - **Dependencies:** Appointment system

6. **Agreement Form and Security**
   - Hot work agreement form
   - Photo attachment
   - Compliance tracking
   - **Effort:** 1 week
   - **Dependencies:** PDF generation

7. **Offer Feedback and Customer Input**
   - Recommendations section
   - Customer feedback capture
   - Follow-up actions
   - **Effort:** 1 week
   - **Dependencies:** None

### 11.4 Phase 4: Integration (Weeks 13-16)

**Priority: LOW** ⚠️

8. **Integration & Documentation**
   - ~~Agritectum integration~~ (LOW PRIORITY - Deferred)
   - Material datasheet module
   - Version control
   - **Effort:** 2 weeks (reduced from 3 weeks)
   - **Dependencies:** External API access (optional)
   - **Note:** Agritectum integration moved to future phase

9. **Operational Tasks**
   - Branch creation
   - Email configuration
   - Logo configuration
   - **Effort:** 1 week
   - **Dependencies:** None

### 11.5 Timeline Summary

| Phase | Duration | Features | Priority |
|-------|----------|----------|----------|
| Phase 1 | Weeks 1-4 | Offer Flow ⭐, Pricing | MUST-HAVE |
| Phase 2 | Weeks 5-8 | Reminders, Radius System | SHOULD-HAVE |
| Phase 3 | Weeks 9-12 | Follow-up, Agreement, Feedback | SHOULD-HAVE |
| Phase 4 | Weeks 13-14 | Datasheet Module, Operations | COULD-HAVE |
| **Total** | **14 weeks** | **8 features** | - |

**Note:** Agritectum integration deferred to future phase due to low priority.

---

## 12. GUI Design Guidelines

### 12.1 Design Principles

#### 12.1.1 Consistency
- **Color Scheme:** Maintain brand colors throughout
  - Primary: #3B82F6 (Blue)
  - Success: #10B981 (Green)
  - Warning: #F59E0B (Orange)
  - Danger: #EF4444 (Red)
- **Typography:** Noto Sans, consistent sizing
- **Spacing:** 4px base unit, consistent margins
- **Components:** Reuse existing UI components

#### 12.1.2 Simplicity
- **Clutter-Free:** Only essential elements visible
- **Progressive Disclosure:** Show details on demand
- **Clear Hierarchy:** Visual hierarchy guides user attention
- **White Space:** Adequate breathing room

#### 12.1.3 User-Centered Design
- **User Research:** Understand inspector and admin workflows
- **User Testing:** Test with real users before release
- **Feedback Loop:** Incorporate user feedback
- **Accessibility:** WCAG 2.1 AA compliance

#### 12.1.4 Feedback and Responsiveness
- **Loading States:** Show progress indicators
- **Success Messages:** Confirm actions completed
- **Error Messages:** Clear, actionable error text
- **Hover States:** Interactive elements respond to hover
- **Animations:** Subtle, purposeful animations

#### 12.1.5 Accessibility
- **Keyboard Navigation:** Full keyboard support
- **Screen Readers:** ARIA labels and roles
- **Color Contrast:** Minimum 4.5:1 ratio
- **Focus Indicators:** Visible focus states
- **Text Alternatives:** Alt text for images

### 12.2 Component Guidelines

#### 12.2.1 Forms
- **Labels:** Clear, descriptive labels
- **Placeholders:** Helpful placeholder text
- **Validation:** Real-time validation with clear messages
- **Required Fields:** Marked with asterisk (*)
- **Error States:** Red border and error message below field

#### 12.2.2 Buttons
- **Primary:** Blue background, white text
- **Secondary:** White background, blue border
- **Danger:** Red background, white text
- **Size:** Consistent sizing (small, medium, large)
- **States:** Default, hover, active, disabled

#### 12.2.3 Tables
- **Headers:** Bold, sortable
- **Rows:** Alternating background colors
- **Actions:** Icon buttons in last column
- **Pagination:** Bottom of table
- **Responsive:** Horizontal scroll on mobile

#### 12.2.4 Modals
- **Size:** Appropriate for content
- **Header:** Clear title and close button
- **Footer:** Action buttons (Cancel, Confirm)
- **Overlay:** Semi-transparent backdrop
- **Animation:** Smooth slide-in animation

#### 12.2.5 Notifications
- **Position:** Top-right corner
- **Duration:** 5 seconds (configurable)
- **Types:** Success (green), Error (red), Warning (yellow), Info (blue)
- **Dismissible:** X button to close
- **Actions:** Optional action button

### 12.3 Responsive Design

#### 12.3.1 Breakpoints
- **Mobile:** < 640px
- **Tablet:** 640px - 1024px
- **Desktop:** > 1024px

#### 12.3.2 Mobile Considerations
- **Touch Targets:** Minimum 44x44px
- **Text Size:** Minimum 16px
- **Navigation:** Hamburger menu
- **Forms:** Full-width inputs
- **Tables:** Horizontal scroll or card view

### 12.4 Performance

#### 12.4.1 Loading Performance
- **Initial Load:** < 3 seconds
- **Time to Interactive:** < 5 seconds
- **Code Splitting:** Lazy load routes
- **Image Optimization:** WebP format, lazy loading

#### 12.4.2 Runtime Performance
- **Smooth Scrolling:** 60 FPS
- **Debouncing:** Input debouncing for search
- **Virtual Scrolling:** For long lists
- **Memoization:** React.memo for expensive components

---

## Appendix A: Glossary

- **Agritectum:** External system for project management and calculations
- **Branch:** Physical location or office of the inspection company
- **Hot Work:** Work involving heat, sparks, or flames (welding, cutting, etc.)
- **Inspector:** Field worker who conducts inspections
- **Offer:** Proposed work with pricing for customer
- **Radius System:** Location-based task suggestion system
- **Datasheet:** Technical specification document for products
- **CVR:** Central Business Register (Danish business registration number)
- **VAT:** Value Added Tax

---

## Appendix B: API Specifications

### B.1 Agritectum Integration

**Endpoint:** `POST https://api.agritectum.com/v1/projects`

**Request Body:**
```json
{
  "project_reference": "TKL-2025-001",
  "customer_name": "John Doe",
  "customer_address": "123 Main St, Copenhagen",
  "roof_size": 250.5,
  "roof_type": "tile",
  "offer_value": 45000,
  "calculations": {
    "labor": 15000,
    "materials": 20000,
    "travel": 1000,
    "overhead": 4500,
    "profit": 4500
  },
  "created_at": "2025-01-15T10:30:00Z"
}
```

**Response:**
```json
{
  "status": "success",
  "project_id": "AGR-2025-001",
  "message": "Project created successfully"
}
```

---

## Document Control

**Version:** 2.0.0  
**Date:** January 2025  
**Status:** Planning  
**Next Review:** February 2025  
**Owner:** Development Team  
**Approved By:** [Pending]

---

*This document is confidential and proprietary to Taklaget Service App.*

