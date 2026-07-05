# Backend Details (Nexa Care)

## Tech Stack
- **Core:** Node.js runtime with Express.js framework.
- **Database:** MongoDB with Mongoose ODM for complex relational schemas (Hospitals, Beds, Inventory, Users).
- **Real-Time Engine:** Socket.io for emitting events like `bed_updated`, `inventory_updated`, and `new_alert` to connected clients instantly.
- **Scheduling:** `node-cron` for running background jobs (e.g., auto-checking hospital metrics to generate alerts and AI redistribution suggestions).

## Database Schema (MongoDB Models)
- `Hospital`: Stores PHC/CHC details, location, and type (PHC/CHC).
- `Bed`: Tracks individual beds, ward types (ICU, General, Emergency), and occupancy status.
- `Patient`: Patient demographics, admission details, and assigned bed.
- `Doctor` & `Attendance`: Staff directory and daily presence logs.
- `Inventory`: Tracks medicines, current stock, and minimum thresholds.
- `Alert`: System-generated warnings (e.g., "Paracetamol critically low").
- `Referral`: Manages patient transfers between hospitals (Dispatch/Receive workflow).
- `Transfer`: Inventory redistribution logs.

## Core API Routes
- `/api/dashboard`: Aggregates complex data for Admin and PHC views. Uses MongoDB aggregation pipelines for fast summaries.
- `/api/hospitals`: Fetches hospital lists and specific metrics for inter-hospital networking.
- `/api/inventory`: CRUD for medical stock, triggers Socket.io alerts if stock dips below a critical threshold.
- `/api/patients`: Admissions, discharges, and bed assignments.
- `/api/logistics`: Handles inter-hospital patient referrals and ambulance dispatching.
- `/api/ai/chat`: Secure proxy endpoint that constructs complex prompts with real-time database context and sends them to the Gemini AI API, returning answers without hallucination.

## Real-Time & Automated Workflows
- **Cron Jobs (`cronJobs.js`):** Runs every hour to check inventory levels across the district. If a hospital drops below a threshold, it auto-generates an Alert in the database and broadcasts a Socket event.
- **AI Data Contextualization:** Before calling the AI model, the backend (or frontend context) gathers current DB stats (doctors present, exact stock count). This ensures the AI always provides 100% accurate answers based on ground reality.
