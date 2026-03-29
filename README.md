# Zync - Advanced Expense Management Platform

Zync is a full-stack, enterprise-grade expense management and reimbursement platform built for dynamic organizational hierarchies. Developed specifically for hackathon constraints, it replaces traditional linear approval chains with a robust, hybrid-logic routing engine capable of handling complex approval conditions, mathematical thresholds, and live international currency standardization.

## Core Features

- **Role-Based Workspaces:** Purpose-built, animated dashboards for Employees, Managers, and System Admins.
- **Dynamic Approval Routing:** Admins can visually construct multi-step approval sequences for any expense application.
- **Hybrid Priority Engine:** 
  - **Priority Overrides (Fast-Track):** Designated priority managers can instantly approve or reject an expense, bypassing the remaining sequence.
  - **Mathematical 60% Threshold:** Standard managers use a democratic fractional approval rule. Intermediate rejections do not halt the flow; the system mathematically calculates the aggregate approval percentage at sequence exhaustion to determine the final status.
- **Live Currency Standardization:** 
  - Employees can submit expenses in virtually any global currency (pulled live from REST Countries).
  - The backend instantly pings real-time exchange rates, dividing the foreign amount by the active exchange scalar against the company's `base_currency`. 
  - Managers and Admins audit mathematically standardized values safely, with original foreign scalars displayed underneath for transparency.
- **Immutable Audit Logs:** Every action, sequence escalation, and manager comment is written to an immutable audit trail accessible by Administrators for strict financial oversight.
- **Contextual Rejection Narratives:** If an expense fails mathematical threshold rules, the exact rationale from the rejecting manager is extracted and piped directly into the Employee's dashboard contextually.

## Tech Stack

**Frontend Architecture:**
- **Framework:** Next.js (React)
- **Styling:** Tailwind CSS (Vanilla CSS approach without utility clutter)
- **Animation:** Framer Motion (for fluid, modern micro-interactions and transitions)
- **Data Fetching:** Axios

**Backend Architecture:**
- **Runtime:** Node.js
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** PostgreSQL (using `pg` driver for native query processing)
- **Standardization APIs:** `restcountries.com` (Currency discovery), `exchangerate-api.com` (Live arithmetic conversion)

## Database Schema

The PostgreSQL database is fully normalized to securely track sequences and financial footprints. 

- **`companies`**: Holds global configuration data, crucially defining the `base_currency` standard for all mathematical translations.
- **`users`**: Defines authentication credentials, hierarchical relationships (`manager_id`), and authorization boundaries (`role`: ADMIN, MANAGER, EMPLOYEE).
- **`expenses`**: The core financial payload. Stores the request metadata, the original `amount` and `currency`, the translated `amount_in_base`, and global execution `status`.
- **`approval_rules`**: Links to an expense to define the systemic flow condition. Declares whether the sequence uses `PERCENTAGE` logic (60% rule) or a priority override (`HYBRID`).
- **`approval_steps`**: The relational sequence chain. Links an expense to a specific manager, storing execution `sequence` integers, dynamic `is_priority` boolean flags, and cryptographic `status` results (including optional rejection comments).
- **`audit_logs`**: An append-only ledger tracking all systemic state changes and manager interactions.

## General Architecture & Data Flow

1. **Submission Layer:** An employee submits a receipt via the frontend. If the currency mismatches the Company base, the backend Express controllers asynchronously pause the transaction, ping an external API for the live scalar, process the math, and securely sink the standardized integers into the Postgres database.
2. **Routing Layer:** An Admin receives the `DRAFT` expense. Using a visual builder, they array managers into a chronological sequence, selectively flagging specific managers with high-priority override capabilities.
3. **Execution Layer:** As the active state migrates through the sequence sequence, the backend checks for Priority tags. If none exist, it awaits total chain exhaustion before calculating the 60% mathematical threshold to determine complete approval or rejection.
4. **Oversight Layer:** The Admin dashboard continuously polls the `audit_logs` and `approval_steps` through relational JOIN queries to project realtime sequence delays, systemic bottlenecks, and standardized financial totals.
