# Create New Report – Flow Map

Below are two complementary diagrams:
- Flowchart: user journey and conditional logic.
- Sequence: service interactions and rule checks.

Open this file in VS Code and use the Markdown Preview to see the diagrams. GitHub also renders Mermaid.

## Flowchart
```mermaid
flowchart TD
  U[User] -->|Open New Report| RF[ReportForm UI]
  RF -->|Select Customer| CUST[customerService.searchCustomers]
  CUST -->|Branch-filtered results| RF
  RF -->|Select Building| BLD[Building selection]
  BLD -->|Auto-select single| AUTOG[AUTO geocode]
  BLD -->|Manual select| MANGEO[Geocode address]

  subgraph Geocoding
    MANGEO --> VAR1[Full address query]
    VAR1 -->|No result| VAR2[Street + locality]
    VAR2 -->|No result| VAR3[Street only]
    VAR1 -->|Coords found| COORDS[(addressCoordinates)]
    VAR2 -->|Coords found| COORDS
    VAR3 -->|Coords found| COORDS
    AUTOG --> VAR1
  end

  COORDS -->|Enable| MEAS[RoofSizeMeasurer]
  MEAS -->|Set roofSize + snapshot| RF
  RF -->|Submit| RCS[ReportContextSimple.createReport]
  RCS --> RS[reportService.createReport]
  RS -->|Normalize snapshot; lookup customer; write| FS[(Firestore)]
  RS -->|Create in-app notification| NOTIF[notificationService]
  NOTIF --> FS
  FS -->|Rules check| RULES[firestore.rules]
  RULES --> FS
  FS -->|Success| RCS
  RCS --> RF
  RF -->|Show success + reset| U
```

## Sequence
```mermaid
sequenceDiagram
  actor User
  participant RF as ReportForm
  participant C as customerService
  participant G as Nominatim
  participant M as RoofSizeMeasurer
  participant RC as ReportContextSimple
  participant RS as reportService
  participant N as notificationService
  participant F as Firestore
  participant R as firestore.rules

  User->>RF: Open New Report
  RF->>C: searchCustomers(term, branchId?)
  C-->>RF: customers[]
  User->>RF: Select building
  RF->>G: geocode(full→variants)
  G-->>RF: lat/lon
  RF->>M: open(lat, lon)
  M-->>RF: roofSize, snapshot
  User->>RF: Submit
  RF->>RC: createReport(payload)
  RC->>RS: createReport(payload)
  RS->>F: write report (normalized)
  RS->>N: createNotification(userId, data)
  N->>F: write notification
  F->>R: evaluate rules
  R-->>F: allow/deny
  F-->>RS: success
  RS-->>RC: reportId
  RC-->>RF: success
  RF-->>User: done
```

## Code Pointers
- UI: [src/components/ReportForm.tsx](../src/components/ReportForm.tsx)
- Measurer: [src/components/RoofSizeMeasurer.tsx](../src/components/RoofSizeMeasurer.tsx)
- Context: [src/contexts/ReportContextSimple.tsx](../src/contexts/ReportContextSimple.tsx)
- Report service: [src/services/reportService.ts](../src/services/reportService.ts)
- Notification service: [src/services/notificationService.ts](../src/services/notificationService.ts)
- Rules: [firestore.rules](../firestore.rules)

## Improvement Targets
- Unified coordinates: Single source of truth for `addressCoordinates`; auto-open measurer on ready.
- Centralized notifications: Emit from services only to avoid duplicates; leverage updated rules.
- Branch discipline: Enforce `branchId` in `searchCustomers` for non-superadmin callers.
