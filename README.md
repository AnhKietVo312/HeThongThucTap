# HUIT Internship Management

## Local development

1. Copy `.env.example` to `.env.local` and enter the Supabase project URL, anon key, service-role key, and a long random `AUTH_SESSION_SECRET`. Keep `.env.local` private; the service-role key and session secret are server-only.
2. In Supabase SQL Editor, run `supabase/migrations/20261004_add_workflow_fields.sql`. It adds the lecturer diary comment and registration rejection reason columns used by the API.
3. Confirm the `private-uploads` and `public-uploads` Storage buckets exist. Student CVs and reports are stored in the private bucket.
4. Run `npm install`, then `npm run dev` and open `http://localhost:3000`.

Accounts are read from `NguoiDung` and their associated student, lecturer, or enterprise records. Login password verification depends on the encoding used in `NguoiDung.MatKhauHash`; make sure it matches the verifier configured by the project before creating or importing user accounts.
