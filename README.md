<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

Meillor Backend - A NestJS application with Supabase integration for managing coins and other resources.

## Project Structure

```
src/
├── main.ts                 # Application entry point
├── app.module.ts          # Root module with global AuthGuard
├── auth/                  # Authentication module (Supabase JWT)
│   ├── auth.service.ts   # JWT verification via Supabase Admin SDK
│   ├── auth.module.ts    # Auth module definition
│   ├── guards/           # Authentication & authorization guards
│   │   ├── auth.guard.ts    # Global JWT verification guard
│   │   └── roles.guard.ts   # Role-based access control guard
│   ├── decorators/       # Custom decorators
│   │   ├── current-user.decorator.ts  # @CurrentUser()
│   │   ├── public.decorator.ts        # @Public()
│   │   └── roles.decorator.ts         # @Roles()
│   └── interfaces/       # TypeScript interfaces
├── database/             # Database module (Supabase)
│   ├── database.service.ts
│   └── database.module.ts
└── coins/                # Coins module (example resource)
    ├── coins.controller.ts
    ├── coins.service.ts
    ├── coins.module.ts
    ├── entities/         # Entity definitions
    │   └── coin.entity.ts
    └── dto/              # Data Transfer Objects
        ├── create-coin.dto.ts
        ├── update-coin.dto.ts
        └── query-coins.dto.ts
```

## Environment Setup

1. Create a `.env` file in the root directory with the following variables:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Note: Use the SERVICE ROLE KEY (not the anon key) for backend operations
# Get your keys from: Supabase Dashboard > Settings > API

# Application Configuration
PORT=3000
NODE_ENV=development
```

2. Set up your Supabase database with the coins table schema (see below).

⚠️ **Important**: The backend uses the **Service Role Key** for admin-level operations. Never expose this key on the client side!

## Coins Table Schema

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

## Installation

```bash
$ npm install
```

## Running the Application

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## API Endpoints

### Coins API

#### Get All Coins (with pagination, search, and filtering)
```
GET /coins
```

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 10, max: 100) - Items per page
- `search` (string) - Search across name, sub_name, category, reference, material, origin_country
- `sortBy` (string, default: 'created_at') - Field to sort by
- `sortOrder` ('asc' | 'desc', default: 'desc') - Sort direction
- `category` (string) - Filter by category
- `material` (string) - Filter by material
- `origin_country` (string) - Filter by origin country
- `condition` (string) - Filter by condition
- `minYear` (number) - Minimum year filter
- `maxYear` (number) - Maximum year filter
- `minPrice` (number) - Minimum price filter
- `maxPrice` (number) - Maximum price filter
- `is_sold` ('true' | 'false') - Filter by sold status
- `is_featured` ('true' | 'false') - Filter by featured status
- `is_new` ('true' | 'false') - Filter by new status
- `lsp_eligible` ('true' | 'false') - Filter by LSP eligibility

**Example:**
```bash
GET /coins?page=1&limit=20&search=gold&sortBy=price_eur&sortOrder=desc&is_sold=false
```

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Gold Coin",
      "price_eur": 1500,
      ...
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

#### Get Coin by ID
```
GET /coins/:id
```

#### Get Coins Statistics
```
GET /coins/statistics
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

#### Create Coin (Protected - Requires Authentication)
```
POST /coins
Authorization: Bearer <supabase_jwt_token>
```

**Body:** All fields from the coins table schema (see CreateCoinDto)

**Authentication:** Requires valid Supabase JWT token in Authorization header

#### Update Coin (Protected - Requires Authentication)
```
PATCH /coins/:id
Authorization: Bearer <supabase_jwt_token>
```

**Body:** Partial update - any fields from the coins table schema

**Authentication:** Requires valid Supabase JWT token in Authorization header

#### Delete Coin (Protected - Requires Admin Role)
```
DELETE /coins/:id
Authorization: Bearer <supabase_jwt_token>
```

**Authentication:** Requires valid Supabase JWT token with `admin` role

**Note:** Get your JWT token from your frontend after authenticating with Supabase Auth. The token is automatically generated by Supabase when a user signs in.

## Testing

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Documentation

Comprehensive documentation is available in the `docs/` folder:

- **[Authentication Guide](docs/AUTHENTICATION.md)** - Complete guide to authentication, guards, and RBAC
- **[Auth Examples](docs/AUTH_EXAMPLES.md)** - Real-world authentication examples
- **[Quick Start Guide](docs/QUICK_START.md)** - Get up and running in minutes
- **[Architecture Guidelines](docs/ARCHITECTURE.md)** - Project structure and best practices
- **[API Examples](docs/API_EXAMPLES.md)** - Complete API usage examples with code
- **[Environment Setup](docs/ENV_EXAMPLE.md)** - Environment variable configuration
- **[Vercel Deployment](docs/VERCEL_DEPLOYMENT.md)** - Deploy to Vercel in minutes

## Key Features

✨ **Professional Project Structure**
- Modular architecture with clear separation of concerns
- Centralized database service for Supabase integration
- Reusable patterns for adding new modules

🔒 **Authentication & Security**
- **Global Authentication** - All routes protected by default via `AuthGuard`
- **Supabase JWT Verification** - Secure token validation using Supabase Admin SDK
- **Role-Based Access Control (RBAC)** - Fine-grained permissions with `@Roles()` decorator
- **Public Routes** - Opt-in public access with `@Public()` decorator
- **User Context** - Easy access to authenticated user via `@CurrentUser()` decorator
- **Input Validation** - DTO validation on all endpoints

📊 **Advanced Querying**
- Pagination support (configurable page size)
- Full-text search across multiple fields
- Advanced filtering (category, material, price range, year range, etc.)
- Flexible sorting (any field, ascending/descending)
- Boolean filters (sold, featured, new, etc.)

🎯 **Production Ready**
- Global validation pipes
- Comprehensive error handling
- Type-safe DTOs and entities
- CORS enabled
- Environment-based configuration

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
