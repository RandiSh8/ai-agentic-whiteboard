# WhizBoard - AI Agentic Whiteboard

WhizBoard is a modern, AI-powered collaborative visual workspace and whiteboard application built with **Next.js**, **React 19**, **Excalidraw**, **Google Gemini AI**, **Neon Serverless Postgres**, and **Clerk Authentication**.

---

## ✨ Features

- **🎨 Infinite Canvas & Whiteboard**: Seamless drawing, wireframing, diagrams, shapes, and notes powered by Excalidraw.
- **🤖 AI Diagram & Mindmap Generation**: Generate flowcharts, architecture diagrams, sticky notes, and brainstorming canvases with Google Gemini AI.
- **🖼️ Real-Time Dashboard Previews**: Automatically captures lightweight WebP snapshot thumbnails of your whiteboard when saving.
- **📁 Workspace Management**:
  - Create, rename, and organize whiteboards.
  - **Soft Delete & Archive**: Move deleted boards to an Archive section with one-click restore or permanent delete options.
  - **Credit & File Limits**: Free tier tracking of up to 3 active whiteboards with an interactive progress indicator in the sidebar.
- **🔒 Authentication**: Secure authentication and user management with Clerk.
- **⚡ Serverless Database**: Fast, scalable PostgreSQL database hosted on Neon and managed via Drizzle ORM.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, Turbopack)
- **Frontend**: [React 19](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/)
- **Canvas Engine**: [@excalidraw/excalidraw](https://excalidraw.com/)
- **AI Integration**: [@google/genai](https://ai.google.dev/) (Gemini AI API)
- **Database**: [Neon Postgres](https://neon.tech/) & [Drizzle ORM](https://orm.drizzle.team/)
- **Auth**: [Clerk](https://clerk.com/)
- **Icons & UI**: [Lucide React](https://lucide.dev/), [shadcn/ui](https://ui.shadcn.com/)

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) (v18 or higher) installed.

### 2. Installation
Clone the repository and install dependencies:
```bash
git clone <your-repo-url>
cd ai-agentic-whiteboard
npm install
```

### 3. Environment Variables
Create a `.env.local` or `.env` file in the root directory and configure the following variables:

```env
# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database (Neon Serverless Postgres)
DATABASE_URL=postgresql://<user>:<password>@<host>/<database>?sslmode=require

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. Database Setup
Push the Drizzle schema to your Neon database:
```bash
npm run db:push
```

### 5. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📜 Available Scripts

- `npm run dev`: Starts the Next.js development server with Turbopack.
- `npm run build`: Builds the production bundle.
- `npm run start`: Runs the built production server.
- `npm run lint`: Runs ESLint checks.
- `npm run db:push`: Synchronizes the Drizzle schema directly to your Neon database.
- `npm run db:studio`: Opens Drizzle Studio to inspect and manage database records visually.

---

