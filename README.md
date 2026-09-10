This is a [Next.js](https://nextjs.org) project tailwind with the help of AI(Antigravity) with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).
# CareStaff & Client Scheduler

A full-stack web application designed for home-care agencies and coordinators to efficiently manage staff rosters, client care requirements, and automated shift-to-client scheduling.

---

## 📋 Problem and Target Group

### Problem

Home-care coordination involves matching employee availability, maximum weekly hours, and geographic locations with client care needs, preferred visit windows, and dependency levels. Doing this manually is time-consuming, prone to scheduling conflicts, and difficult to scale as care organizations grow.

### Target Group

* **Care Coordinators & Administrators:** Staff members responsible for planning weekly rotas, balancing workloads, and ensuring care delivery compliance.
* **Home-Care Agencies:** Small to mid-sized care providers looking for a streamlined, centralized digital tool to oversee field staff and care recipients.

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
git clone https://github.com/your-username/care-scheduler.git
cd care-scheduler

```


2. **Install dependencies:**
```bash
npm install

```


3. **Configure environment variables:**
Create a `.env` file in the root directory and add any necessary connection strings or configuration variables.
4. **Run the development server:**
```bash
npm run dev

```


5. **Open in browser:**
Navigate to [http://localhost:3000](http://localhost:3000) to view the application.

---

## ⚠️ Known Limitations

* **Single-Agency Scope:** The current iteration is optimized for single-branch or single-agency deployments rather than multi-tenant enterprise organizations.
* **Basic Conflict Resolution:** Overlapping scheduling conflicts trigger basic alerts rather than advanced constraint-satisfaction optimization algorithms.
* **Authentication:** Role-based access control (RBAC) and user login authentication are currently stubbed out for demo purposes.

---

## 🔮 Possible Next Steps

* [ ] Implement secure user authentication and role-based permissions (Admin vs. Field Staff).
* [ ] Integrate calendar view libraries (e.g., FullCalendar) for drag-and-drop shift adjustments.
* [ ] Enhance the scheduling algorithm using AI/heuristics to optimize travel time and minimize staff burnout.
* [ ] Add automated email/SMS notifications for staff shift assignments.

---

## 🎯 Today's Goals & Action Items

* [x] Finish writing comprehensive README
* [ ] Prepare final demo environment and seed data
* [ ] Rehearse system presentation flow
* [ ] Prepare backup screenshots and offline fallback plan
## Getting Started

First, run the development server:

```bash
npm run dev


Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
