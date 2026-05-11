# PAO DCB Downloading Automation Tool

## Overview

The PAO DCB Downloading Automation Tool is a browser automation system developed to eliminate repetitive manual operations involved in downloading Daily Cash Book (DCB) reports from a dynamic government portal.

The tool automates login-assisted navigation, report generation, pagination handling, synchronized downloads, structured file organization, and operational error logging.

The application is currently used in daily operational workflows within the Postal Accounts Office.

---

# Features

## Browser Automation
- Automated portal navigation
- Dynamic page interaction
- Form filling and button automation
- Popup/window handling

## Report Download Automation
- Automated DCB report downloads
- Download synchronization handling
- Duplicate prevention
- Download completion tracking

## Pagination Handling
- Automatic page traversal
- Dynamic page detection
- Recovery from page resets

## Structured File Organization
Reports automatically stored by:
- Date
- DDO number
- Year/month hierarchy

## Operational Reliability
- Error logging
- Graceful failure handling
- Timeout protection
- Dynamic selector handling
- Retry-aware synchronization

## CLI-Based User Experience
- Interactive terminal menus
- Date-range support
- DDO filtering
- Validation workflows
- Back-navigation support

---

# Tech Stack

- Node.js
- Puppeteer
- JavaScript
- Chromium Browser Automation

---

# System Workflow

```text
Launch browser
      ↓
Login to portal
      ↓
Navigate to PAO module
      ↓
Select date/DDO filters
      ↓
Fetch records
      ↓
Handle pagination
      ↓
Download reports
      ↓
Store files in structured directories
```

---

# Architecture

```text
User Input
(date/DDO)
      ↓
Node.js Automation Script
      ↓
Puppeteer Browser Instance
      ↓
Portal Interaction
      ↓
Automated Downloads
      ↓
Structured File Storage
```

---

# File Organization Structure

```text
downloads/
 ├── by-date/
 │     └── year/month/
 │           └── DDO-date.xls
 │
 └── by-ddo/
       └── DDO/year/month/
             └── DDO-date.xls
```

---

# Key Engineering Concepts

## Dynamic Browser Automation
Implemented robust browser automation using:
- waitForSelector
- waitForFunction
- dynamic DOM querying
- popup page attachment

## Download Lifecycle Management
Handled:
- partial downloads
- file synchronization
- download completion detection
- overwrite scenarios
- temporary browser files

## Error Handling & Stability
Implemented:
- uncaught exception handling
- unhandled promise rejection handling
- structured error logs
- graceful process exits
- synchronization recovery

## Duplicate Prevention
Used in-memory tracking mechanisms to avoid:
- duplicate downloads
- repeated DDO processing
- stale automation states

---

# Major Challenges Solved

## Unreliable Dynamic Portals
Government portals often have:
- delayed rendering
- dynamic selectors
- asynchronous loading
- popup workflows

The automation system used dynamic waits and synchronization-aware workflows instead of relying entirely on static delays.

## Synchronization Handling
Implemented:
- selector-based waits
- network stability checks
- pagination state detection
- download completion verification

## Browser Download Complexity
Handled:
- `.crdownload`
- `.tmp`
- partial files
- overwrite scenarios
- download timing variability

---

# Real-World Usage

The tool is actively used in operational workflows within the Postal Accounts Office to reduce repetitive manual work and improve report management efficiency.

---

# Installation

## Clone Repository

```bash
git clone <repo-url>
cd pao-dcb-automation-tool
```

## Install Dependencies

```bash
npm install
```

---

# Run Application

```bash
node server.js
```

---

# Key Learning Outcomes

- Browser automation using Puppeteer
- Dynamic DOM interaction
- Download lifecycle management
- Async JavaScript workflows
- Error handling and recovery
- File-system management
- Real-world workflow automation
- Operational reliability engineering

---

# Possible Future Improvements

- Scheduler/cron integration
- Parallel browser workers
- Dockerized deployment
- Dashboard-based monitoring
- OCR/Captcha handling
- Cloud-based execution
- Download analytics
- Automatic report parsing

---

# Project Highlights

- Real-world operational usage
- Resilient browser automation
- Dynamic pagination handling
- Structured file management
- Robust synchronization workflows
- Practical productivity automation
