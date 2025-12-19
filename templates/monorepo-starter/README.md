# Monorepo Starter Template

This is a minimal, modern monorepo template based on shadcn/ui, customized for fast development and scalability.

## Features

- Modular structure for web, server, and shared packages
- Customizable UI components (`packages/ui`)
- Tailwind CSS and PostCSS preconfigured
- TypeScript everywhere
- Ready for Next.js and NestJS
- ESLint, TurboRepo, and PNPM workspace setup

## Structure

- `apps/web` – Next.js frontend
- `server` – NestJS backend
- `packages/ui` – Shared UI components
- `packages/config` – Shared configs (ESLint, TypeScript)

## Getting Started

```bash
pnpm install
pnpm dev # Start all apps
```

````

## Database Setup

1. Edit the `.env` file in the `server` directory:

```env
DB_URI="postgresql://username:password@localhost:5432/your-db-name"
```

Replace `username`, `password`, and `your-db-name` with your PostgreSQL credentials and the desired database name.

2. Navigate to the server folder:

```bash
cd server
```

3. Run Prisma commands to set up the database and generate the client:

```bash
pnpm prisma:migrate:dev
pnpm prisma:generate
```

> Note: Make sure your PostgreSQL server is running and accessible with the credentials you set.

## Usage

Import UI components in your app:

```tsx
import { Button } from "@workspace/ui/components/button";
```

## Customization

Feel free to modify, extend, and organize the template to fit your workflow.

---

Made with ❤️ using shadcn/ui & Monorepo
````
