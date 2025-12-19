# Monopero Starter Template

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

## Usage

Import UI components in your app:

```tsx
import { Button } from "@workspace/ui/components/button";
```

## Customization

Feel free to modify, extend, and organize the template to fit your workflow.

---

Made with ❤️ using shadcn/ui & Monopero
