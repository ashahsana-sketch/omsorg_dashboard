This is a [Next.js](https://nextjs.org) project tailwind with the help of AI(Antigravity) with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

# CareStaff & Client Scheduler

A full-stack web application designed for home-care agencies and coordinators to efficiently manage staff rosters, client care requirements, and automated shift-to-client scheduling.

<div align="center">

| 🟢 Next.js | 🔵 Tailwind CSS | ⚡ TypeScript | 🤖 AI (Antigravity) | 🏥 Care Service |
| :---: | :---: | :---: | :---: | :---: |
| *App Router & API* | *Styling & UI* | *Type Safety* | *Smart Assistance* | *Domain Logic* |

</div>

---

## 📋 Problem and Target Group

### Problem

Home-care coordination involves matching employee availability, maximum weekly hours, and geographic locations with client care needs, preferred visit windows, and dependency levels. Doing this manually is time-consuming, prone to scheduling conflicts, and difficult to scale as care organizations grow.

### Target Group

> 🎯 **Who is this for?**

<div align="center">

| 👤 Care Coordinators & Administrators | 🏢 Home-Care Agencies |
| :---: | :---: |
| *Staff members responsible for planning weekly rotas, balancing workloads, and ensuring care delivery compliance.* | *Small to mid-sized care providers looking for a streamlined, centralized digital tool to oversee field staff and care recipients.* |

</div>

---

## ✨ Features

* **Staff Directory & Management:** Add, view, and delete care workers with customizable roles (Care Assistant, Registered Nurse, etc.), location assignment, weekly hour limits, and flexible or fixed shift configurations.
* **Client Directory & Management:** Maintain care recipient profiles featuring care dependency levels, required weekly hours, location constraints, and fixed time windows or flexible visit preferences.
* **Automated Scheduling Engine:** Intelligently pair available staff with clients based on matching location, schedule compatibility, and capacity constraints.
* **Responsive UI/UX:** Clean, accessible dashboard interfaces built with Tailwind CSS, supporting seamless single-file state views for switching between data directories and creation forms.

---

## 🛠 Technology Choice

* **Framework:** **Next.js (App Router)** chosen for its robust file-system routing, built-in API route handlers, and seamless client-server component architecture.
* **Language:** **TypeScript** for end-to-end type safety across API payloads, database models, and React component props.
* **Styling:** **Tailwind CSS** for rapid, utility-first UI development with clean typography, responsive grids, and modern color palettes.
* **Data Storage / State:** RESTful backend endpoints communicating with a persistent datastore, paired with React `useState` and `useEffect` hooks for dynamic client-side rendering.

---

## 🚀 Local Setup

Follow these steps to run the project locally on your machine:

1. **Clone the repository:**
```bash
git clone [https://github.com/your-username/care-scheduler.git](https://github.com/your-username/care-scheduler.git)
cd care-scheduler
