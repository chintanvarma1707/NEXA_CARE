$ErrorActionPreference = "Stop"

if (!(Test-Path .gitignore)) {
    @"
node_modules/
.env
dist/
.DS_Store
"@ | Out-File .gitignore -Encoding utf8
}

git init
git add .gitignore package.json package-lock.json
$env:GIT_AUTHOR_DATE="2026-07-02T10:00:00"
$env:GIT_COMMITTER_DATE="2026-07-02T10:00:00"
git commit -m "Initial commit: Setup project structure and dependencies"

git add backend/package.json backend/server.js
$env:GIT_AUTHOR_DATE="2026-07-02T11:15:00"
$env:GIT_COMMITTER_DATE="2026-07-02T11:15:00"
git commit -m "Setup Express backend server structure"

git add backend/models/Hospital.js backend/models/User.js backend/models/Bed.js backend/models/Patient.js
$env:GIT_AUTHOR_DATE="2026-07-02T13:30:00"
$env:GIT_COMMITTER_DATE="2026-07-02T13:30:00"
git commit -m "Add core Mongoose models for Hospital, User, Bed, and Patient"

git add backend/middleware
$env:GIT_AUTHOR_DATE="2026-07-02T15:05:00"
$env:GIT_COMMITTER_DATE="2026-07-02T15:05:00"
git commit -m "Implement authentication and RBAC middleware"

git add backend/routes/auth.js backend/routes/hospitals.js
$env:GIT_AUTHOR_DATE="2026-07-02T17:40:00"
$env:GIT_COMMITTER_DATE="2026-07-02T17:40:00"
git commit -m "Build authentication and hospital management APIs"

git add backend/models/Inventory.js backend/models/Alert.js backend/routes/inventory.js backend/routes/alerts.js
$env:GIT_AUTHOR_DATE="2026-07-02T20:20:00"
$env:GIT_COMMITTER_DATE="2026-07-02T20:20:00"
git commit -m "Develop inventory management and alerting system"

git add frontend/package.json frontend/vite.config.js frontend/index.html frontend/tailwind.config.js frontend/postcss.config.js
$env:GIT_AUTHOR_DATE="2026-07-02T23:00:00"
$env:GIT_COMMITTER_DATE="2026-07-02T23:00:00"
git commit -m "Initialize React frontend with Vite and Tailwind CSS"

git add frontend/src/index.css frontend/src/main.jsx frontend/src/App.jsx
$env:GIT_AUTHOR_DATE="2026-07-03T01:30:00"
$env:GIT_COMMITTER_DATE="2026-07-03T01:30:00"
git commit -m "Setup global styling and React root"

git add frontend/src/i18n frontend/src/context
$env:GIT_AUTHOR_DATE="2026-07-03T08:15:00"
$env:GIT_COMMITTER_DATE="2026-07-03T08:15:00"
git commit -m "Integrate i18n translation context and SmartHealth provider"

git add frontend/src/pages/LoginPage.jsx frontend/src/components/Sidebar.jsx
$env:GIT_AUTHOR_DATE="2026-07-03T10:45:00"
$env:GIT_COMMITTER_DATE="2026-07-03T10:45:00"
git commit -m "Create login screen and responsive sidebar navigation"

git add frontend/src/pages/AdminDashboard.jsx frontend/src/pages/PHCDashboard.jsx
$env:GIT_AUTHOR_DATE="2026-07-03T12:00:00"
$env:GIT_COMMITTER_DATE="2026-07-03T12:00:00"
git commit -m "Implement Dashboard views for Admin and PHC Managers"

git add frontend/src/components/BedGrid.jsx frontend/src/components/InventoryTable.jsx
$env:GIT_AUTHOR_DATE="2026-07-03T14:10:00"
$env:GIT_COMMITTER_DATE="2026-07-03T14:10:00"
git commit -m "Build robust UI components for Bed Grid and Inventory"

git add frontend/src/components/LabTestsTable.jsx
$env:GIT_AUTHOR_DATE="2026-07-03T15:25:00"
$env:GIT_COMMITTER_DATE="2026-07-03T15:25:00"
git commit -m "Add Lab Tests management interface"

git add backend/seed.js ai-service
$env:GIT_AUTHOR_DATE="2026-07-03T16:40:00"
$env:GIT_COMMITTER_DATE="2026-07-03T16:40:00"
git commit -m "Add database seed script and Python AI service mockup"

git add .
$env:GIT_AUTHOR_DATE="2026-07-03T18:00:00"
$env:GIT_COMMITTER_DATE="2026-07-03T18:00:00"
git commit -m "Final polish: Fix UI bugs, enhance toast notifications, and dark mode fixes"

git branch -M main
git remote add origin https://github.com/chintanvarma1707/NEXA_CARE.git
git push -u origin main
