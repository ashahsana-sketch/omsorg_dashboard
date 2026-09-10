# 🏥 CareStaff & Client Scheduler

> **A full-stack scheduling platform for home-care agencies to manage care staff, clients, availability, and intelligent shift assignments with the help of AI.**

<div align="center">

[![Next.js](https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Care Service](https://img.shields.io/badge/Domain-Care_Service-teal?style=for-the-badge)](https://github.com)
[![AI Assisted](https://img.shields.io/badge/AI-Antigravity-purple?style=for-the-badge)](https://github.com)

</div>

This is a [Next.js](https://nextjs.org) project built with Tailwind CSS and the help of AI (Antigravity), bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

---

## 📖 About the Project

**CareStaff & Client Scheduler** is a full-stack web application designed to help **home-care agencies and care coordinators** efficiently manage staff rosters, client care requirements, and shift scheduling.

The application aims to simplify the complex process of matching:

* 👩‍⚕️ Care staff availability
* 🕐 Working hours and shift preferences
* 📍 Staff and client locations
* 👤 Client care requirements
* 📅 Preferred visit windows
* ⚖️ Weekly workload and capacity

The project was developed using **Next.js, TypeScript, and Tailwind CSS**, with assistance from **AI (Antigravity)** during development.

---

## 🎯 Problem & Target Users

### 💡 The Problem

Home-care scheduling often requires coordinators to manually match staff availability with client requirements.

This can become:

* ⏳ Time-consuming
* ❌ Prone to scheduling conflicts
* 📊 Difficult to manage as the number of clients grows
* 🧩 Complicated when considering location, working hours, and care requirements

**CareStaff & Client Scheduler** aims to provide a centralized solution for managing these challenges.

### 👥 Target Users

| User | Purpose |
| :--- | :--- |
| 👤 **Care Coordinators** | Plan weekly schedules, assign staff, and manage workloads |
| 🏢 **Home-Care Agencies** | Manage staff and clients from one centralized platform |
| 👩‍⚕️ **Care Administrators** | Maintain staff information and client care requirements |

---

## ✨ Key Features

### 👩‍⚕️ Staff Management
* Add and manage care workers
* Define staff roles
* Assign staff locations
* Set maximum weekly working hours
* Configure flexible or fixed shifts
* View staff information in a centralized directory

### 👤 Client Management
* Add and manage care recipients
* Define care dependency levels
* Set required weekly care hours
* Store client locations
* Configure fixed or flexible visit windows
* Maintain client care requirements

### 🤖 Automated Scheduling
The scheduling engine is designed to match staff and clients based on:
* 📍 Location compatibility
* 🕐 Schedule availability
* ⏱️ Working-hour limits
* 📅 Client visit requirements
* 👩‍⚕️ Staff capacity

### 📱 Responsive Dashboard
* Modern dashboard interface
* Responsive layout
* Tailwind CSS styling
* Accessible UI components
* Easy navigation between staff and client directories
* Integrated creation and management forms

---

## 🛠️ Technology Stack

<div align="center">

| Technology | Purpose |
| :--- | :--- |
| ⚫ **Next.js** | Full-stack React framework and application routing |
| 🔷 **TypeScript** | Type safety and maintainable code |
| 🎨 **Tailwind CSS** | Responsive UI and styling |
| ⚛️ **React** | Interactive user interfaces and state management |
| 🔌 **REST API** | Communication between frontend and backend |
| 🤖 **Antigravity AI** | AI-assisted development and coding support |

</div>

### Why These Technologies?

* **Next.js:** Used for its App Router, file-system routing, API route handlers, and client/server component architecture.
* **TypeScript:** Provides stronger type safety for API data, application models, and React components.
* **Tailwind CSS:** Allows rapid development of responsive and consistent user interfaces using utility-first styling.
* **React:** Used for interactive components, state management, and dynamic rendering.
* **REST API:** Provides structured communication between the frontend and backend data layer.
* **AI – Antigravity:** Used as a development assistant for code generation, debugging, refactoring, and exploring implementation approaches.

---

## 🏗️ Project Structure

```text
care-scheduler/
│
├── app/
│   ├── api/
│   ├── components/
│   ├── clients/
│   ├── staff/
│   ├── dashboard/
│   └── page.tsx
│
├── public/
│   └── images/
│
├── types/
│
├── package.json
├── tsconfig.json
├── next.config.ts
└── README.md
