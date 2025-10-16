# API Usage Examples

This document provides practical examples of using the Coins API.

## Base URL

```
http://localhost:3005
```

## Authentication

Protected endpoints require a JWT token in the Authorization header:

```bash
Authorization: Bearer <your-jwt-token>
```

## Coins API Examples

### 1. Get All Coins (Basic)

**Request:**
```bash
curl http://localhost:3005/coins
```

**Response:**
```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "American Gold Eagle",
      "sub_name": "1 oz",
      "category": "Gold",
      "material": "Gold",
      "origin_country": "USA",
      "year": 2023,
      "price_eur": 1850.50,
      "is_sold": false,
      "is_featured": true,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "totalPages": 15
  }
}
```

### 2. Get Coins with Pagination

**Request:**
```bash
curl "http://localhost:3005/coins?page=2&limit=20"
```

### 3. Search Coins

Search across multiple fields (name, sub_name, category, reference, material, origin_country):

**Request:**
```bash
curl "http://localhost:3005/coins?search=gold"
```

### 4. Filter by Category

**Request:**
```bash
curl "http://localhost:3005/coins?category=Gold&limit=50"
```

### 5. Filter by Multiple Criteria

**Request:**
```bash
curl "http://localhost:3005/coins?material=Gold&origin_country=USA&is_sold=false&is_featured=true"
```

### 6. Filter by Price Range

**Request:**
```bash
curl "http://localhost:3005/coins?minPrice=1000&maxPrice=2000"
```

### 7. Filter by Year Range

**Request:**
```bash
curl "http://localhost:3005/coins?minYear=2020&maxYear=2023"
```

### 8. Sort Coins

**Request:**
```bash
# Sort by price ascending
curl "http://localhost:3005/coins?sortBy=price_eur&sortOrder=asc"

# Sort by year descending
curl "http://localhost:3005/coins?sortBy=year&sortOrder=desc"

# Sort by name ascending
curl "http://localhost:3005/coins?sortBy=name&sortOrder=asc"
```

### 9. Complex Query Example

Get featured, unsold gold coins from 2020-2023, priced between €1000-€2000, sorted by price:

**Request:**
```bash
curl "http://localhost:3005/coins?category=Gold&is_featured=true&is_sold=false&minYear=2020&maxYear=2023&minPrice=1000&maxPrice=2000&sortBy=price_eur&sortOrder=asc&page=1&limit=20"
```

### 10. Get Single Coin by ID

**Request:**
```bash
curl http://localhost:3005/coins/123e4567-e89b-12d3-a456-426614174000
```

**Response:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "American Gold Eagle",
  "sub_name": "1 oz",
  "category": "Gold",
  "reference": "AE-1OZ-2023",
  "material": "Gold",
  "origin_country": "USA",
  "year": 2023,
  "condition": "BU",
  "gross_weight": 33.93,
  "net_weight": 31.1,
  "prime_percent": 91.67,
  "price_eur": 1850.50,
  "taxation": "VAT Exempt",
  "vault_location": "A-12-5",
  "lsp_eligible": true,
  "is_main_list": true,
  "is_featured": true,
  "is_deliverable": true,
  "is_new": false,
  "is_sold": false,
  "front_picture_url": "https://example.com/images/coin-123.jpg",
  "product_url": "https://example.com/products/coin-123",
  "ai_score": 95.5,
  "scraped_at": "2024-01-15T08:00:00Z",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": null
}
```

### 11. Get Coins Statistics

**Request:**
```bash
curl http://localhost:3005/coins/statistics
```

**Response:**
```json
{
  "total": 150,
  "sold": 45,
  "featured": 12,
  "new": 8
}
```

### 12. Create a New Coin (Protected)

**Request:**
```bash
curl -X POST http://localhost:3005/coins \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Canadian Maple Leaf",
    "sub_name": "1 oz",
    "category": "Gold",
    "material": "Gold",
    "origin_country": "Canada",
    "year": 2023,
    "condition": "BU",
    "gross_weight": 31.1,
    "net_weight": 31.1,
    "prime_percent": 99.99,
    "price_eur": 1820.00,
    "taxation": "VAT Exempt",
    "vault_location": "B-15-3",
    "lsp_eligible": true,
    "is_main_list": true,
    "is_featured": false,
    "is_deliverable": true,
    "is_new": true,
    "is_sold": false,
    "front_picture_url": "https://example.com/images/maple-leaf.jpg"
  }'
```

**Response:**
```json
{
  "id": "456e7890-e89b-12d3-a456-426614174001",
  "name": "Canadian Maple Leaf",
  "sub_name": "1 oz",
  ...
  "created_at": "2024-01-16T14:22:00Z",
  "updated_at": null
}
```

### 13. Update a Coin (Protected)

**Request:**
```bash
curl -X PATCH http://localhost:3005/coins/123e4567-e89b-12d3-a456-426614174000 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "price_eur": 1900.00,
    "is_featured": true,
    "vault_location": "A-12-6"
  }'
```

**Response:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "American Gold Eagle",
  "price_eur": 1900.00,
  "is_featured": true,
  "vault_location": "A-12-6",
  ...
  "updated_at": "2024-01-16T15:30:00Z"
}
```

### 14. Mark Coin as Sold (Protected)

**Request:**
```bash
curl -X PATCH http://localhost:3005/coins/123e4567-e89b-12d3-a456-426614174000 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "is_sold": true
  }'
```

### 15. Delete a Coin (Protected)

**Request:**
```bash
curl -X DELETE http://localhost:3005/coins/123e4567-e89b-12d3-a456-426614174000 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:** 
- Status: `204 No Content`
- Empty body

## Error Responses

### 400 Bad Request

**Invalid UUID:**
```json
{
  "statusCode": 400,
  "message": "Invalid UUID format",
  "error": "Bad Request"
}
```

### 404 Not Found

**Coin not found:**
```json
{
  "statusCode": 404,
  "message": "Coin with ID \"123e4567-e89b-12d3-a456-426614174000\" not found",
  "error": "Not Found"
}
```

### 401 Unauthorized

**Missing or invalid token:**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 422 Validation Error

**Invalid input:**
```json
{
  "statusCode": 400,
  "message": [
    "price_eur must be a number",
    "year must be an integer number"
  ],
  "error": "Bad Request"
}
```

## JavaScript/TypeScript Examples

### Using Fetch API

```typescript
// Get all coins
async function getAllCoins(page = 1, limit = 10) {
  const response = await fetch(
    `http://localhost:3005/coins?page=${page}&limit=${limit}`
  );
  return response.json();
}

// Search coins
async function searchCoins(searchTerm: string) {
  const response = await fetch(
    `http://localhost:3005/coins?search=${encodeURIComponent(searchTerm)}`
  );
  return response.json();
}

// Get coin by ID
async function getCoinById(id: string) {
  const response = await fetch(`http://localhost:3005/coins/${id}`);
  if (!response.ok) {
    throw new Error('Coin not found');
  }
  return response.json();
}

// Create coin (requires authentication)
async function createCoin(coinData: any, token: string) {
  const response = await fetch('http://localhost:3005/coins', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(coinData),
  });
  return response.json();
}

// Update coin (requires authentication)
async function updateCoin(id: string, updates: any, token: string) {
  const response = await fetch(`http://localhost:3005/coins/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(updates),
  });
  return response.json();
}

// Delete coin (requires authentication)
async function deleteCoin(id: string, token: string) {
  const response = await fetch(`http://localhost:3005/coins/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  return response.ok;
}
```

### Using Axios

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3005',
});

// Get all coins with filters
const getCoins = async (params: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
}) => {
  const { data } = await api.get('/coins', { params });
  return data;
};

// Create coin
const createCoin = async (coinData: any, token: string) => {
  const { data } = await api.post('/coins', coinData, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};
```

## Tips

1. **Pagination**: Always use pagination for list endpoints to improve performance
2. **Filtering**: Combine multiple filters for precise results
3. **Sorting**: Use sorting to get data in the desired order
4. **Search**: Search is case-insensitive and searches across multiple fields
5. **Error Handling**: Always handle errors appropriately in your client code
6. **Authentication**: Store JWT tokens securely (e.g., httpOnly cookies, secure storage)

