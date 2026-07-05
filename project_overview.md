# Nexa Care - SmartHealth: Project Overview

## 1. Domain & Problem Statement
- **Domain:** Rural Healthcare Management System & Logistics.
- **Context:** Managing Primary Health Centres (PHCs) and Community Health Centres (CHCs) in rural and semi-urban areas (e.g., Maharashtra).
- **Core Problem:** Lack of real-time visibility into resource availability (beds, medicines, doctors) across different hospitals. This leads to overcrowding in some centres while others remain underutilized, causing delays in emergency treatments and poor inventory management.
- **Our Solution (Nexa Care):** A centralized, AI-powered smart dashboard that connects PHCs and CHCs to a District Admin portal. It provides real-time monitoring of bed occupancy, critical medicine stock, doctor attendance, and facilitates smart patient/inventory redistribution using AI.

## 2. Key Features
- **Real-time District Overview:** Admin dashboard monitoring total hospitals, beds, active patients, and critical alerts.
- **Flagged Facilities Auto-Detection:** Automatically flags hospitals with low doctor attendance (<50%), critical stock shortages, or overcrowding (>90% occupancy).
- **AI-Powered Redistribution:** Smart recommendations for transferring surplus medicines from one hospital to another facing a shortage.
- **Multilingual Support (i18n):** Full platform localization in English, Hindi, and Gujarati for local rural staff.
- **Global AI Agent (Nexa AI):** A chat-based AI assistant that instantly answers queries about present doctors, bed availability, and stock levels using real-time data.
- **Smart Attendance System:** AI-driven tracking of hospital staff presence.
- **Inter-Hospital Referrals:** Seamlessly dispatch and receive patients between PHCs and CHCs.

## 3. Technology Stack (MERN + AI)
- **Frontend:** React.js (Vite), Tailwind CSS, Framer Motion (Animations), Lucide React (Icons), Socket.io-client.
- **Backend:** Node.js, Express.js, MongoDB (Mongoose), Socket.io (Real-time events), Cron Jobs.
- **AI Integration:** Google Gemini AI API (for chatbot and redistribution logic), Python (FastAPI for AI microservices).
- **Design System:** Premium dark-mode UI with glassmorphism, dynamic gradients, and smooth micro-animations.
