# AI Appointment Automation System

A full-stack AI-powered appointment booking and reminder system built using HTML, CSS, JavaScript, Python Flask, Supabase, and Twilio WhatsApp API.

This project allows users to book appointments through a modern web interface, stores data in Supabase, and automatically sends WhatsApp confirmation/reminder messages using Twilio.

---

# Features

* Appointment booking form
* Real-time appointments dashboard
* WhatsApp confirmation messages
* Supabase database integration
* REST API backend using Flask
* Auto-refreshing dashboard
* Appointment status tracking
* Responsive modern UI
* Environment variable security using `.env`

---

# Tech Stack

## Frontend

* HTML5
* CSS3
* JavaScript

## Backend

* Python
* Flask
* Flask-CORS

## Database

* Supabase

## API Integrations

* Twilio WhatsApp API

---

# Project Structure

```bash
ai-automation-project/
│
├── frontend/
│   ├── index.html
│   ├── dashboard.html
│   ├── css/
│   └── js/
│
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   └── .env
│
└── README.md
```

---

# Setup Instructions

## 1. Clone Repository

```bash
git clone <your-repo-link>
```

---

## 2. Install Python Dependencies

```bash
pip install -r requirements.txt
```

---

## 3. Configure Environment Variables

Create a `.env` file inside the `backend` folder.

Example:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_SECRET_KEY=your_supabase_secret_key

TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_FROM_NUMBER=whatsapp:+14155238886
```

---

## 4. Run Backend

```bash
python app.py
```

Backend runs on:

```bash
http://localhost:5000
```

---

## 5. Run Frontend

Open:

```bash
frontend/index.html
```

using Live Server or browser.

---

# API Endpoints

## Create Appointment

```http
POST /appointments
```

## Get All Appointments

```http
GET /appointments
```

---

# Dashboard Features

* Live appointment tracking
* Upcoming appointment count
* Reminder status
* Auto-refresh every 30 seconds
* Responsive mobile layout

---

# Security Features

* Environment variables stored in `.env`
* HTML escaping to prevent XSS attacks
* API keys hidden from frontend

---

# Future Improvements

* AI voice calling integration
* Email reminders
* Admin authentication
* Calendar integration
* AI chatbot support

---

# Author

Khushal Patil

BCA Student | Aspiring AI & Software Engineer
