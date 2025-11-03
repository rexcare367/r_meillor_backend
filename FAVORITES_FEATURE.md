# Favorites Feature Documentation

## Overview

The favorites feature allows authenticated users to save coins to their personal favorites list. When fetching coins, authenticated users will see which coins are in their favorites.

## Database Setup

### Run Migration

Execute the SQL migration file to create the favorites table:

```sql
-- Located at: database/migrations/002_create_favorites_table.sql
```

This will create:
- `favorites` table with user_id, coin_id, and timestamps
- Unique constraint to prevent duplicate favorites
- Indexes for better query performance
- Row Level Security (RLS) policies

## API Endpoints

### 1. Add a Coin to Favorites

**POST** `/favorites`

**Authentication:** Required

**Request Body:**
```json
{
  "coin_id": "uuid-of-the-coin"
}
```

**Response:** `201 Created`
```json
{
  "id": "favorite-uuid",
  "user_id": "user-uuid",
  "coin_id": "coin-uuid",
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

**Errors:**
- `400 Bad Request` - Invalid coin ID format
- `404 Not Found` - Coin not found
- `409 Conflict` - Coin already in favorites

### 2. Remove a Coin from Favorites

**DELETE** `/favorites/:coinId`

**Authentication:** Required

**Response:** `204 No Content`

**Errors:**
- `400 Bad Request` - Invalid coin ID format
- `404 Not Found` - Favorite not found

### 3. Get User's Favorite Coins (with full details)

**GET** `/favorites`

**Authentication:** Required

**Response:** `200 OK`
```json
[
  {
    "id": "favorite-uuid",
    "created_at": "2024-01-01T00:00:00.000Z",
    "coins": {
      "id": "coin-uuid",
      "name": "Gold Coin",
      "price_eur": 1500,
      // ... all coin fields
    }
  }
]
```

### 4. Get User's Favorite Coin IDs (only IDs)

**GET** `/favorites/ids`

**Authentication:** Required

**Response:** `200 OK`
```json
{
  "coin_ids": [
    "coin-uuid-1",
    "coin-uuid-2",
    "coin-uuid-3"
  ]
}
```

## Updated Coins Endpoints

### GET /coins

**Authentication:** Optional (Public route)

**New Behavior:**
- Authenticated users get `is_favorite` field in each coin
- Unauthenticated users don't see the `is_favorite` field
- Authenticated users: default limit 20, max 100
- Unauthenticated users: max limit 5

**Example Response for Authenticated User:**
```json
{
  "data": [
    {
      "id": "coin-uuid",
      "name": "Gold Coin",
      "price_eur": 1500,
      "is_favorite": true,  // ← New field
      // ... other coin fields
    },
    {
      "id": "coin-uuid-2",
      "name": "Silver Coin",
      "price_eur": 50,
      "is_favorite": false,  // ← New field
      // ... other coin fields
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### GET /coins/:id

**Authentication:** Optional (Public route)

**New Behavior:**
- Authenticated users get `is_favorite` field
- Unauthenticated users don't see the `is_favorite` field

**Example Response for Authenticated User:**
```json
{
  "id": "coin-uuid",
  "name": "Gold Coin",
  "price_eur": 1500,
  "is_favorite": true,  // ← New field
  // ... other coin fields
}
```

## Usage Examples

### Frontend Integration

```typescript
// Add to favorites
async function addToFavorites(coinId: string, token: string) {
  const response = await fetch('http://localhost:3000/favorites', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ coin_id: coinId }),
  });
  return response.json();
}

// Remove from favorites
async function removeFromFavorites(coinId: string, token: string) {
  await fetch(`http://localhost:3000/favorites/${coinId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
}

// Get all favorites
async function getFavorites(token: string) {
  const response = await fetch('http://localhost:3000/favorites', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  return response.json();
}

// Fetch coins with favorite status
async function getCoins(token?: string) {
  const headers: any = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch('http://localhost:3000/coins', { headers });
  return response.json();
}
```

## Architecture

### Files Created

```
src/
├── favorites/
│   ├── entities/
│   │   └── favorite.entity.ts       # Favorite entity interface
│   ├── dto/
│   │   └── add-favorite.dto.ts      # DTO for adding favorites
│   ├── favorites.controller.ts      # Favorites endpoints
│   ├── favorites.service.ts         # Business logic for favorites
│   └── favorites.module.ts          # NestJS module
├── coins/
│   ├── coins.controller.ts          # Updated with user context
│   ├── coins.service.ts             # Updated with favorite checks
│   └── entities/
│       └── coin.entity.ts           # Updated with is_favorite field
└── app.module.ts                    # Updated to import FavoritesModule

database/
└── migrations/
    └── 002_create_favorites_table.sql
```

### Key Features

1. **Automatic Favorite Status**: When authenticated users fetch coins, each coin automatically includes an `is_favorite` boolean field.

2. **Efficient Queries**: Uses a single batch query to check favorite status for all coins in the result set.

3. **Error Handling**: Gracefully handles errors - if favorite status check fails, it doesn't break the entire request.

4. **Security**: 
   - Row Level Security (RLS) policies ensure users can only access their own favorites
   - All favorite operations require authentication
   - Public coin endpoints work for both authenticated and unauthenticated users

5. **Performance**:
   - Indexed queries for fast lookups
   - Batch favorite checks to minimize database queries
   - Unique constraint prevents duplicate favorites

## Testing the Feature

### 1. Setup Database
```bash
# Run the migration in your Supabase SQL editor
# Copy content from database/migrations/002_create_favorites_table.sql
```

### 2. Test Adding Favorites
```bash
# First, get a valid coin ID
curl http://localhost:3000/coins | jq '.data[0].id'

# Add to favorites (requires authentication)
curl -X POST http://localhost:3000/favorites \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"coin_id": "COIN_UUID"}'
```

### 3. Test Fetching Coins with Favorite Status
```bash
# Authenticated request - includes is_favorite field
curl http://localhost:3000/coins \
  -H "Authorization: Bearer YOUR_TOKEN"

# Unauthenticated request - no is_favorite field
curl http://localhost:3000/coins
```

### 4. Test Getting Favorites
```bash
# Get all favorite coins with details
curl http://localhost:3000/favorites \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get only favorite coin IDs
curl http://localhost:3000/favorites/ids \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 5. Test Removing Favorites
```bash
curl -X DELETE http://localhost:3000/favorites/COIN_UUID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Notes

- The `is_favorite` field is added dynamically and is not stored in the coins table
- Only authenticated users see the `is_favorite` field
- The favorites table uses UUID for user_id (from Supabase auth.users)
- Deleting a coin will cascade delete all related favorites
- The feature is fully backwards compatible with existing coin endpoints

