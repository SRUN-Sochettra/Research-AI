# Deployment Guide

## Vercel (Frontend + API)
1. Connect GitHub repository to Vercel.
2. Configure environment variables (see `.env.example`).
3. Deploy.

## Supabase (Database + Auth)
1. Create a new Supabase project.
2. Run `src/lib/db/schema.sql` in the SQL Editor.
3. Enable Vector extension: `CREATE EXTENSION IF NOT EXISTS vector;`.

## GitHub Actions
1. Add `VERCEL_TOKEN` and `VERCEL_PROJECT_ID` to GitHub Secrets for auto-deployments.
