# Supabase Base Project (Next.js 14 + Ant Design)

An enterprise-grade starter kit built with Next.js 14 (App Router), Supabase Auth/Database, and Ant Design (v5).

## 🚀 Features

- **Next.js 14 (App Router)**: Fast, server-rendered React components.
- **Supabase Integration**: Authentication (Email & Google) and secure PostgreSQL database with RLS.
- **Ant Design v5**: Modern UI components with CSS-in-JS and SSR support.
- **Internationalization (i18n)**: Multi-language support (English, Chinese) using `next-intl`.
- **API Documentation**: Built-in Swagger UI at `/api-docs`.
- **SEO Optimized**: Pre-configured `robots.ts`, `sitemap.ts`, and dynamic metadata.
- **Vercel Ready**: Optimized for Vercel deployment with standalone build and cross-environment redirect handling.

## 🛠️ Setup & Local Development

1. **Clone and Install**:
```bash
npm install
```

2. **Environment Variables**:
Create a `.env.local` file with:
```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

3. **Run Dev Server**:
```bash
npm run dev
```

## 🌍 Vercel Deployment

1. **Environment Variables**: Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel Dashboard.
2. **Build Configuration**: Use the default "Next.js" preset.
3. **Site URL**: Optional `NEXT_PUBLIC_SITE_URL` for absolute SEO links.

## 📁 Project Structure

- `src/app`: App Router pages and API routes.
- `src/components`: Reusable UI components.
- `src/utils/supabase`: Centralized Supabase client helpers (Server/Client/Middleware).
- `messages`: Translation JSON files.
- `docs`: Architecture and schema documentation.
