# VulnScan

A full-stack web vulnerability scanner built with **Node.js, Express, MongoDB, React, and Nmap**. VulnScan performs automated reconnaissance and security checks against domains, URLs, and IP addresses, generating detailed vulnerability reports and risk assessments through a modern dashboard interface.

---

## Features

### Network Scanning

* Port scanning using Nmap
* Detection of open services
* Service identification for discovered ports

### HTTP Security Header Analysis

* Checks for missing security headers:

  * Content-Security-Policy (CSP)
  * X-Frame-Options
  * X-Content-Type-Options
  * Strict-Transport-Security (HSTS)
  * Referrer-Policy
* Detects unnecessary header disclosures

### SSL/TLS Analysis

* SSL certificate validation
* Certificate expiration monitoring
* Hostname verification
* Self-signed certificate detection
* TLS handshake validation

### Risk Assessment Engine

* Severity-based vulnerability scoring
* Critical, High, Medium, Low, and Informational findings
* Aggregated risk score generation
* Security posture classification

### Dashboard & Reporting

* Interactive security dashboard
* Recent scan history
* Detailed vulnerability reports
* Risk trend visualization
* Severity distribution charts
* Scan record management

---

## Technology Stack

### Frontend

* React
* React Router DOM
* Context API
* Axios
* Recharts
* Framer Motion
* Lucide React

### Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* Nmap

### Security Analysis

* Nmap
* Native TLS Module
* HTTP Header Inspection

---

## Project Structure

```text
VulnScan/
│
├── backend/
│   ├── controllers/
│   ├── routes/
│   ├── services/
│   │   ├── nmapService.js
│   │   ├── headerService.js
│   │   ├── sslService.js
│   │   └── scoringService.js
│   └──  models/
│   
│
├── frontend/
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── NewScan.jsx
│   │   ├── RecentScans.jsx
│   │   └── ScanDetails.jsx
│   ├── context/
│   ├── hooks/
│   ├── services/
│   └── components/
│
└── README.md
```

---

## Installation

### Clone Repository

```bash
git clone https://github.com/your-username/VulnScan.git
cd VulnScan
```

### Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
```

Start the server:

```bash
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

## Usage

1. Start both frontend and backend servers.
2. Open the application in your browser.
3. Navigate to **New Scan**.
4. Enter a target:

   * Domain
   * URL
   * IP Address
5. Launch the scan.
6. Review:

   * Open ports
   * SSL/TLS information
   * Security findings
   * Risk score
7. Access historical scans through the Recent Scans page.

---

## Example Findings

### SSL Certificate Expired

```json
{
  "severity": "Critical",
  "title": "SSL Certificate Expired"
}
```

### Missing Security Headers

```json
{
  "severity": "Medium",
  "title": "Missing Content-Security-Policy Header"
}
```

### Server Header Disclosure

```json
{
  "severity": "Low",
  "title": "Server Header Disclosure"
}
```

---

## Current Capabilities

* Port Enumeration
* Security Header Analysis
* SSL/TLS Validation
* Risk Scoring
* Historical Scan Storage
* Interactive Dashboard
* Detailed Findings View
* Scan Deletion

---

## Planned Features

* PDF Report Export
* DNS Enumeration
* WHOIS Lookup
* Technology Fingerprinting
* User Authentication
* Email Notifications

---

## Learning Objectives

This project was developed to strengthen skills in:

* Cybersecurity Fundamentals
* Network Reconnaissance
* Vulnerability Assessment
* REST API Development
* React State Management
* Backend Architecture
* Data Visualization
* Security Reporting

---

## Disclaimer

VulnScan is intended for educational and authorized security testing purposes only. Always obtain permission before scanning systems that you do not own or manage.

---
