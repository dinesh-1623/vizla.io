# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/3bb1d983-413a-4514-8048-3bb39f63397d

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/3bb1d983-413a-4514-8048-3bb39f63397d) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/3bb1d983-413a-4514-8048-3bb39f63397d) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

## Supabase Backend Setup

This application uses Supabase as the backend database. Currently configured to work with mock data by default.

### Quick Setup

1. **Create a Supabase project**:
   - Go to [supabase.com](https://supabase.com) and create a new project
   - Get your project URL and API keys from Project Settings → API

2. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your Supabase credentials:
   ```bash
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

3. **Apply database migrations**:
   
   **Option A - Via Supabase Dashboard (Recommended)**:
   - Go to your Supabase project
   - Open SQL Editor
   - Copy and paste contents of `supabase/migrations/master.sql`
   - Click "Run" to execute all migrations
   
   **Option B - Via Supabase CLI**:
   ```bash
   supabase migration up
   ```

4. **Seed the database**:
   ```bash
   npm run db:seed
   ```

5. **Toggle data source**:
   - The app works with mock data by default
   - Click the database icon (🗄️) in the header to toggle between Mock and Supabase
   - Or use browser console: `localStorage.setItem('vizla-settings', JSON.stringify({state: {dataSource: 'supabase'}, version: 0}))`

### Documentation

For detailed setup instructions, see:
- [Database Schema](docs/backend/erd.md)
- [Migration Plan](docs/backend/migration-plan.md)
- [RLS Policies](docs/backend/rls.md)

### Project Credentials

The Supabase project is already configured with:
- **Project URL**: `https://leufayhtfjxwhxwtsmyq.supabase.co`
- **Anon Key**: Provided in environment variables

**Note**: This is a shared development project. For production, create your own Supabase project.
