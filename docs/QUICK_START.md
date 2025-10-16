# Quick Start Guide

This guide will help you get the Meillor Backend up and running in minutes.

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- A Supabase account and project

## Step 1: Clone and Install

```bash
# Navigate to the project directory
cd r_meillor_backend

# Install dependencies
npm install
```

## Step 2: Set Up Supabase

1. Go to [Supabase](https://app.supabase.com)
2. Create a new project or use an existing one
3. Go to the SQL Editor
4. Run the following SQL to create the coins table:

```sql
create table public.coins (
  id uuid not null default gen_random_uuid (),
  name text null,
  sub_name text null,
  category text null,
  reference text null,
  material text null,
  origin_country text null,
  year numeric null,
  condition text null,
  gross_weight numeric null,
  net_weight numeric null,
  prime_percent numeric null,
  price_eur numeric null,
  taxation text null,
  vault_location text null,
  lsp_eligible boolean null,
  is_main_list boolean null,
  is_featured boolean null,
  is_deliverable boolean null,
  is_new boolean null,
  is_sold boolean null,
  front_picture_url text null,
  product_url text null,
  ai_score numeric null,
  scraped_at timestamp with time zone null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone null,
  constraint coins_pkey primary key (id)
) TABLESPACE pg_default;
```

5. (Optional) Add indexes for better performance:

```sql
-- Index for common filters
CREATE INDEX idx_coins_category ON public.coins(category);
CREATE INDEX idx_coins_material ON public.coins(material);
CREATE INDEX idx_coins_origin_country ON public.coins(origin_country);
CREATE INDEX idx_coins_is_sold ON public.coins(is_sold);
CREATE INDEX idx_coins_is_featured ON public.coins(is_featured);

-- Index for sorting
CREATE INDEX idx_coins_created_at ON public.coins(created_at DESC);
CREATE INDEX idx_coins_price_eur ON public.coins(price_eur);
CREATE INDEX idx_coins_year ON public.coins(year);
```

## Step 3: Configure Environment Variables

Create a `.env` file in the root directory:

```bash
# Copy from the example
cp docs/ENV_EXAMPLE.md .env
```

Edit the `.env` file with your Supabase credentials:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-supabase-anon-key
JWT_SECRET=your-jwt-secret
PORT=3005
```

**Where to find these values:**
1. Open your Supabase project
2. Go to **Settings** > **API**
3. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **anon/public key** → `SUPABASE_KEY`
4. Go to **Settings** > **API** > **JWT Settings**
5. Copy **JWT Secret** → `JWT_SECRET`

## Step 4: Run the Application

```bash
# Development mode with hot reload
npm run start:dev
```

You should see:
```
Application is running on: http://localhost:3005
```

## Step 5: Test the API

### Option 1: Using curl

```bash
# Test if the server is running
curl http://localhost:3005/coins

# Should return an empty list with pagination info
```

### Option 2: Using your browser

Open: `http://localhost:3005/coins`

### Option 3: Using Postman or Insomnia

Import the following endpoints:
- GET `http://localhost:3005/coins`
- GET `http://localhost:3005/coins/statistics`
- GET `http://localhost:3005/coins/:id`
- POST `http://localhost:3005/coins` (requires JWT)
- PATCH `http://localhost:3005/coins/:id` (requires JWT)
- DELETE `http://localhost:3005/coins/:id` (requires JWT)

## Step 6: Add Sample Data (Optional)

You can add sample data directly through Supabase:

1. Go to your Supabase project
2. Navigate to **Table Editor** > **coins**
3. Click **Insert row**
4. Fill in the fields:
   ```
   name: American Gold Eagle
   sub_name: 1 oz
   category: Gold
   material: Gold
   origin_country: USA
   year: 2023
   price_eur: 1850.50
   is_sold: false
   is_featured: true
   ```
5. Click **Save**

Now test the API again:
```bash
curl http://localhost:3005/coins
```

## Common Operations

### Get all coins with pagination
```bash
curl "http://localhost:3005/coins?page=1&limit=10"
```

### Search for coins
```bash
curl "http://localhost:3005/coins?search=gold"
```

### Filter by category
```bash
curl "http://localhost:3005/coins?category=Gold"
```

### Get coins in price range
```bash
curl "http://localhost:3005/coins?minPrice=1000&maxPrice=2000"
```

### Sort by price
```bash
curl "http://localhost:3005/coins?sortBy=price_eur&sortOrder=asc"
```

## Next Steps

1. **Read the API documentation**: See `docs/API_EXAMPLES.md` for detailed API usage examples
2. **Understand the architecture**: Read `docs/ARCHITECTURE.md` to learn about best practices
3. **Set up authentication**: Configure Supabase Auth for JWT token generation
4. **Add more modules**: Follow the patterns in the coins module to add new features

## Troubleshooting

### "Supabase configuration is missing"

**Problem**: The app can't find your Supabase credentials.

**Solution**: 
- Make sure `.env` file exists in the root directory
- Check that `SUPABASE_URL` and `SUPABASE_KEY` are set correctly
- Restart the application

### "Failed to fetch coins"

**Problem**: Database query failed.

**Solution**:
- Verify the `coins` table exists in your Supabase database
- Check that your `SUPABASE_KEY` has the correct permissions
- Look at the error message for more details

### Port already in use

**Problem**: Port 3005 is already in use.

**Solution**:
- Change the `PORT` in your `.env` file
- Or stop the process using port 3005

### Validation errors

**Problem**: Request validation failed.

**Solution**:
- Check the request body/query parameters match the DTO schema
- Ensure required fields are provided
- Verify data types are correct (e.g., numbers for numeric fields)

## Development Tips

1. **Hot Reload**: The app automatically reloads when you save files in development mode
2. **Linting**: Run `npm run lint` to check code quality
3. **Formatting**: Run `npm run format` to format code
4. **Testing**: Run `npm test` for unit tests

## Production Deployment

For production deployment:

1. Set `NODE_ENV=production` in your environment
2. Build the application:
   ```bash
   npm run build
   ```
3. Start the production server:
   ```bash
   npm run start:prod
   ```

## Getting Help

- Check the `docs/` folder for detailed documentation
- Review the `README.md` for API reference
- Look at the code comments in the source files
- Check Supabase logs for database-related issues

## Project Structure Overview

```
r_meillor_backend/
├── src/
│   ├── main.ts              # Entry point
│   ├── app.module.ts        # Root module
│   ├── database/            # Supabase integration
│   ├── auth/                # Authentication
│   └── coins/               # Coins module
│       ├── coins.controller.ts
│       ├── coins.service.ts
│       ├── coins.module.ts
│       ├── dto/             # Request/response schemas
│       └── entities/        # Type definitions
├── docs/                    # Documentation
├── test/                    # Tests
├── .env                     # Environment variables (create this)
└── package.json            # Dependencies
```

Happy coding! 🚀

