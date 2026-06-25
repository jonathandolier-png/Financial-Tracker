# Country Days Tracker

Track how many days you spend in each country during the financial year (April 1 – March 31). GPS runs in the background — no manual entry needed.

## Setup (one-time)

### 1. Create your Supabase database (free)
1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project (any name, any region)
3. Go to **SQL Editor** in the left sidebar
4. Paste the contents of `supabase-schema.sql` and click **Run**
5. Go to **Project Settings → API**
6. Copy your **Project URL** and **anon public** key

### 2. Add your credentials
Create a file called `.env` in this folder with:
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Run on your iPhone
1. Install **Expo Go** from the App Store on your iPhone
2. In this folder, run: `npx expo start`
3. Scan the QR code with your iPhone camera
4. Tap **Allow** when it asks for location permission — choose **Always**

## How it works

- The app silently checks your GPS every 15 minutes
- It detects which country you're in using Apple's location services (no external API needed)
- It logs one day per country per calendar date
- Financial year resets each April 1st

## Setting limits & alerts

Open the app → tap ⚙️ → tap **Set** next to any country → enter your day limit and how many days before that limit you want to be warned.
