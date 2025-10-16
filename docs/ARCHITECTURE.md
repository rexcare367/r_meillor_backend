# Architecture Guidelines

## Overview

This document outlines the architectural patterns and best practices for the Meillor Backend project.

## Project Structure

The project follows a modular architecture where each feature is encapsulated in its own module.

### Core Modules

#### 1. Database Module (`src/database/`)

The Database module provides a centralized Supabase client that can be injected into any service.

**Key Features:**
- Global module (available throughout the app)
- Singleton Supabase client
- Environment-based configuration
- Initialization on module load

**Usage Example:**
```typescript
@Injectable()
export class MyService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getData() {
    const client = this.databaseService.getClient();
    const { data, error } = await client.from('my_table').select('*');
    return data;
  }
}
```

#### 2. Auth Module (`src/auth/`)

Handles authentication using JWT tokens with Supabase.

**Components:**
- `SupabaseStrategy`: Passport JWT strategy
- `JwtAuthGuard`: Guard for protected routes

**Usage Example:**
```typescript
@Controller('protected')
export class ProtectedController {
  @Get()
  @UseGuards(JwtAuthGuard)
  async getProtectedData() {
    return { message: 'This is protected' };
  }
}
```

### Feature Modules

#### Coins Module (`src/coins/`)

A complete example of a feature module with CRUD operations.

**Structure:**
```
coins/
├── coins.controller.ts    # REST API endpoints
├── coins.service.ts       # Business logic
├── coins.module.ts        # Module definition
├── entities/              # Type definitions
│   └── coin.entity.ts
└── dto/                   # Data Transfer Objects
    ├── create-coin.dto.ts
    ├── update-coin.dto.ts
    └── query-coins.dto.ts
```

## Best Practices

### 1. Creating a New Module

When adding a new feature module, follow this structure:

```bash
src/
└── your-module/
    ├── your-module.controller.ts
    ├── your-module.service.ts
    ├── your-module.module.ts
    ├── entities/
    │   └── your-entity.entity.ts
    └── dto/
        ├── create-your-entity.dto.ts
        ├── update-your-entity.dto.ts
        └── query-your-entity.dto.ts
```

### 2. DTOs (Data Transfer Objects)

Always use DTOs for request validation:

```typescript
import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateYourEntityDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsNumber()
  price?: number;
}
```

### 3. Entity Definitions

Define entity interfaces to match your database schema:

```typescript
export class YourEntity {
  id: string;
  name: string;
  price: number | null;
  created_at: Date;
  updated_at: Date | null;
}
```

### 4. Service Layer

Keep business logic in services:

```typescript
@Injectable()
export class YourService {
  constructor(private readonly databaseService: DatabaseService) {}

  async findAll(queryDto: QueryDto): Promise<PaginatedResponse<YourEntity>> {
    const client = this.databaseService.getClient();
    // Implementation
  }

  async findOne(id: string): Promise<YourEntity> {
    // Implementation with proper error handling
  }
}
```

### 5. Controller Layer

Controllers should be thin and delegate to services:

```typescript
@Controller('your-resource')
export class YourController {
  constructor(private readonly yourService: YourService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@Query() queryDto: QueryDto) {
    return this.yourService.findAll(queryDto);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDto: CreateDto) {
    return this.yourService.create(createDto);
  }
}
```

### 6. Error Handling

Use NestJS built-in HTTP exceptions:

```typescript
import {
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';

async findOne(id: string) {
  if (!this.isValidUUID(id)) {
    throw new BadRequestException('Invalid UUID format');
  }

  const { data, error } = await client.from('table').select('*').eq('id', id).single();

  if (error || !data) {
    throw new NotFoundException(`Resource with ID "${id}" not found`);
  }

  return data;
}
```

### 7. Pagination Pattern

Implement consistent pagination across all list endpoints:

```typescript
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

async findAll(queryDto: QueryDto): Promise<PaginatedResponse<Entity>> {
  const { page = 1, limit = 10 } = queryDto;
  
  let query = client.from('table').select('*', { count: 'exact' });
  
  // Apply filters, sorting, etc.
  
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);
  
  const { data, count, error } = await query;
  
  return {
    data: data as Entity[],
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  };
}
```

### 8. Search and Filtering

Use Supabase's query builder for flexible filtering:

```typescript
let query = client.from('table').select('*');

// Text search across multiple fields
if (search) {
  query = query.or(`field1.ilike.%${search}%,field2.ilike.%${search}%`);
}

// Exact match filters
if (category) {
  query = query.eq('category', category);
}

// Range filters
if (minPrice) {
  query = query.gte('price', minPrice);
}
if (maxPrice) {
  query = query.lte('price', maxPrice);
}

// Boolean filters
if (is_active !== undefined) {
  query = query.eq('is_active', is_active === 'true');
}
```

### 9. Sorting

Implement flexible sorting:

```typescript
const { sortBy = 'created_at', sortOrder = 'desc' } = queryDto;
const ascending = sortOrder === 'asc';
query = query.order(sortBy, { ascending });
```

## Database Integration

### Supabase Client

The `DatabaseService` provides a configured Supabase client:

```typescript
const client = this.databaseService.getClient();

// Select
const { data, error } = await client.from('table').select('*');

// Insert
const { data, error } = await client.from('table').insert([{ name: 'value' }]).select().single();

// Update
const { data, error } = await client.from('table').update({ name: 'new value' }).eq('id', id).select().single();

// Delete
const { error } = await client.from('table').delete().eq('id', id);
```

### Query Patterns

**Count with data:**
```typescript
const { data, count, error } = await client
  .from('table')
  .select('*', { count: 'exact' });
```

**Single row:**
```typescript
const { data, error } = await client
  .from('table')
  .select('*')
  .eq('id', id)
  .single();
```

**Count only (for statistics):**
```typescript
const { count, error } = await client
  .from('table')
  .select('*', { count: 'exact', head: true });
```

## Security

### Protected Routes

Use `JwtAuthGuard` for routes that require authentication:

```typescript
@Post()
@UseGuards(JwtAuthGuard)
async create(@Body() createDto: CreateDto) {
  return this.service.create(createDto);
}
```

### Route Organization

- **Public routes**: GET endpoints for reading data
- **Protected routes**: POST, PATCH, DELETE endpoints

## Validation

### Global Validation Pipe

The app uses a global validation pipe configured in `main.ts`:

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    transform: true,        // Auto-transform query params to their types
    whitelist: true,        // Strip properties that don't have decorators
    forbidNonWhitelisted: true, // Throw error if unknown properties exist
  }),
);
```

### Query Parameter Validation

Use `@Type()` decorator for automatic type conversion:

```typescript
import { Type } from 'class-transformer';

export class QueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number = 1;
}
```

## Testing

### Unit Tests

Test services in isolation:

```typescript
describe('YourService', () => {
  let service: YourService;
  let databaseService: DatabaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        YourService,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
      ],
    }).compile();

    service = module.get<YourService>(YourService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
```

## Adding New Modules - Checklist

1. [ ] Create module directory in `src/`
2. [ ] Define entity interface matching database schema
3. [ ] Create DTOs (Create, Update, Query)
4. [ ] Implement service with business logic
5. [ ] Create controller with REST endpoints
6. [ ] Create module definition
7. [ ] Import module in `app.module.ts`
8. [ ] Add documentation to README
9. [ ] Write unit tests
10. [ ] Write e2e tests

## Environment Variables

Always use `ConfigService` for environment variables:

```typescript
constructor(private readonly configService: ConfigService) {}

const value = this.configService.get<string>('VARIABLE_NAME');
```

## Logging

Use NestJS built-in logger:

```typescript
import { Logger } from '@nestjs/common';

@Injectable()
export class YourService {
  private readonly logger = new Logger(YourService.name);

  async method() {
    this.logger.log('Operation started');
    this.logger.error('Error occurred', error.stack);
    this.logger.warn('Warning message');
  }
}
```

## Performance Considerations

1. **Use pagination** for all list endpoints
2. **Limit page size** (max 100 items per page)
3. **Use indexes** on frequently queried fields in Supabase
4. **Avoid N+1 queries** - use Supabase's relationship features
5. **Cache frequently accessed data** when appropriate

## Future Considerations

As the project grows, consider:

1. **Redis caching** for frequently accessed data
2. **Rate limiting** for API endpoints
3. **API versioning** for backward compatibility
4. **OpenAPI/Swagger** documentation
5. **Background jobs** for heavy operations
6. **WebSocket support** for real-time features

