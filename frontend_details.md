# Frontend Details (Nexa Care)

## Tech Stack
- **Framework:** React.js powered by Vite for blazing-fast HMR and optimized builds.
- **Styling:** Tailwind CSS for utility-first styling, combined with custom CSS (`index.css`) for Glassmorphism effects and gradient animations.
- **State Management:** React Context API (`SmartHealthContext`) for global state (user auth, multilingual translations, socket connections).
- **Icons & Animations:** `lucide-react` for modern iconography, `framer-motion` for fluid page transitions, spring animations, and micro-interactions.

## Key Views & Pages
1. **Admin Dashboard (`AdminDashboard.jsx`):**
   - Shows District Overview.
   - Tabs for Hospitals, Alerts, Inventory, Redistribution, and Flagged Facilities.
   - Live pulse dots and real-time syncing via WebSockets.

2. **Hospital Dashboard (`HospitalDashboard.jsx`):**
   - For PHC/CHC local management.
   - Modules: Overview, Bed Grid, Patient List, Inventory, Lab Tests, Logistics (Referrals).

3. **Login Page (`LoginPage.jsx`):**
   - Immersive dark UI with interactive effects.
   - Role-based login (District Admin, Doctor, Receptionist, Inventory Manager).

## Core Components
- **Global AI Agent (`GlobalAIAgent.jsx`):** A floating, collapsible chat widget. Analyzes the logged-in user's role and fetches relevant context (district vs local hospital) to answer queries securely based on real-time data.
- **Bed Grid (`BedGrid.jsx`):** Visual representation of hospital wards (ICU, General, Emergency). Real-time color coding (Green=Available, Red=Occupied) and one-click patient discharge functionalities.
- **Attendance System (`AttendanceSystem.jsx`):** Tracks which doctors/staff are present today with a visual overview.
- **Alert Cards & Notification Bell:** Real-time push notifications for critical stock levels or overcrowded wards.
- **Sidebar (`Sidebar.jsx`):** Responsive navigation panel that adapts based on user roles (Admin vs PHC staff).

## Multilingual System (i18n)
- Custom translation engine built into Context.
- `translations.js` serves as the single source of truth for English, Hindi, and Gujarati strings.
- UI seamlessly updates without page reloads when the language is toggled, ensuring accessibility for rural workers.
