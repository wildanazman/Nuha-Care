# Nuha Care Cloud

Simple family care log app using the Stitch Nuha Care visual style, Supabase database, and Supabase Storage for meal photos.

## Setup

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the Supabase SQL editor.
3. Copy `.env.example` to `.env.local`.
4. Fill:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_FAMILY_ACCESS_CODE=NUHA2026
```

5. Run locally:

```bash
npm install
npm run dev
```

6. Deploy to Vercel and add the same three environment variables.

## Notes

- There is no email/password login.
- Local storage only keeps the verified family-code flag and active family member.
- Logs and meal photo URLs are saved in Supabase.
- The `meal-photos` bucket is public so meal photos can display directly in cards.
