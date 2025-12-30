# System Architecture

## Overview
This project is a Next.js 14+ (App Router) application integrated with Supabase for Backend-as-a-Service (BaaS). It uses Ant Design for the UI and aims for a high-performance, secure, and internationalized user experience.

## Technology Stack
- **Frontend Framework**: Next.js 14 (App Router, TypeScript)
- **UI Component Library**: Ant Design (v5) with CSS-in-JS registry
- **State Management**: React Server Components (RSC) + Hooks
- **Styling**: Ant Design Token System + CSS Modules (if needed)
- **Authentication**: Supabase Auth (Email + Google) via `@supabase/auth-ui-react`
- **Database**: PostgreSQL (via Supabase)
- **Deployment**: Vercel (recommended) / Docker

## Architecture Diagrams

```mermaid
graph TD
    Client[Client Browser]
    NextServer[Next.js Server (Edge/Node)]
    Supabase[Supabase Platform]
    
    Client -->|RSC / Server Actions| NextServer
    Client -->|Client Client (Auth, Realtime)| Supabase
    NextServer -->|Service Role / Auth Context| Supabase
    
    subgraph Supabase
        Auth[Auth Service]
        DB[(PostgreSQL DB)]
        Storage[Storage]
        Edge[Edge Functions]
    end
    
    NextServer -.-> Auth
    NextServer -.-> DB
```

## Security Strategy
- **RLS (Row Level Security)**: Enabled on ALL tables. No direct access without policies.
- **Environment Variables**: Managed via Zod validation. Service role key never exposed to client.
- **Authentication**: Managed by Supabase Auth with secure session handling via PKCE flow.
