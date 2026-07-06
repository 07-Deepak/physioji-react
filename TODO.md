# TODO - Notes Admin/User Module

## Step 1: Repo Understanding (done)
- Identified dummy-based admin notes UI: `client/src/pages/admin/Notes.jsx`.
- Identified backend controllers/routes already exist for notes admin + public.

## Step 2: Admin Notes Frontend (API-driven)
- Replace dummy data with API calls.
- Implement dashboard stats cards.
- Implement upload form with Multer field names + upload progress.
- Implement toasts, loading/error/empty states.
- Implement notes table with required columns.
- Implement actions: View (modal), Download, Edit (modal), Delete (confirm modal), Status toggle.
- Implement search/filter/sort/pagination.

## Step 3: User Notes Frontend (API-driven)
- Replace dummy list with `GET /api/notes`.
- Implement preview + download actions.
- Implement search + category filter + sort.

## Step 4: Backend Verification
- Ensure public download increments downloads.
- Ensure admin upload stores coverImage optional + file metadata fields.
- Ensure routes are mounted correctly (dynamic mount base paths).

## Step 5: Testing
- Upload -> immediate admin list update.
- User page auto reflects after refresh.
- Download increments counter in DB.
- Edit/Delete/Status toggle work.

