# Kalai Coco API

A production-ready Express.js API with PostgreSQL, JWT authentication, role-based access control, and comprehensive documentation.

## Features

- **Express.js** - Fast, unopinionated web framework
- **TypeScript** - Type-safe development
- **PostgreSQL** - Robust relational database with stored procedures
- **JWT Authentication** - Secure token-based authentication
- **Role-Based Access Control (RBAC)** - Admin, Manager, User, Guest roles
- **Service Layer Architecture** - Clean, maintainable code structure
- **Swagger Documentation** - Auto-generated API documentation
- **Jest Testing** - Comprehensive unit and integration tests
- **ESLint & Prettier** - Code quality and formatting
- **Husky** - Git hooks for pre-commit and pre-push checks
- **Error Handling** - Centralized error handling with custom error classes

## Prerequisites

- Node.js 18.x or higher
- npm or yarn
- PostgreSQL 12.x or higher
- Git

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd kalai-coco-api
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env
```

4. Update `.env` with your PostgreSQL connection string and JWT secret:

```env
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=your_secret_key_here
```

5. Run database migrations:

```bash
npm run db:migrate
```

## Database Setup

### Initialize PostgreSQL

The database schema includes:

- **Users table** - User authentication and role management
- **Price Levels table** - Pricing tiers
- **Tokens table** - Session token management

### Run Migrations

```bash
npm run db:migrate
```

### Stored Procedures

Located in `database/procedures/procedures.sql`:

- `create_user()` - Create new user
- `get_user_by_email()` - Retrieve user by email
- `get_active_users()` - Get all active users
- `delete_user()` - Soft delete user
- `get_price_levels_by_currency()` - Get prices by currency
- `count_users_by_role()` - Count users by role

## Project Structure

```
src/
├── config/          # Configuration files (database, environment)
├── controllers/     # Request handlers
├── services/        # Business logic layer
├── routes/          # API routes
├── middleware/      # Express middleware (auth, error handling)
├── models/          # Data models
├── types/           # TypeScript type definitions
├── utils/           # Utility functions (JWT, logger, errors)
├── docs/            # API documentation (Swagger)
└── index.ts         # Application entry point

database/
├── migrations/      # Database initialization scripts
└── procedures/      # PostgreSQL stored procedures

tests/              # Test files
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user (requires auth)
- `GET /api/auth/me` - Get current user (requires auth)

### Users

- `GET /api/users` - Get all users (requires admin role)
- `GET /api/users/:id` - Get user by ID (requires auth)
- `POST /api/users` - Create user (requires admin role)
- `PUT /api/users/:id` - Update user (requires auth)
- `DELETE /api/users/:id` - Delete user (requires admin role)
- `PATCH /api/users/:id/role` - Change user role (requires admin role)

### Price Levels

- `GET /api/price-levels` - Get all price levels (requires auth)
- `GET /api/price-levels/:id` - Get price level by ID (requires auth)
- `POST /api/price-levels` - Create price level (requires admin/manager role)
- `PUT /api/price-levels/:id` - Update price level (requires admin/manager role)
- `DELETE /api/price-levels/:id` - Delete price level (requires admin role)

## API Documentation

Swagger documentation is available at `http://localhost:3000/api-docs` when the server is running.

## Running the Application

### Development

```bash
npm run dev
```

### Production

```bash
npm run build
npm start
```

## Testing

### Run all tests

```bash
npm test
```

### Run tests in watch mode

```bash
npm run test:watch
```

### Generate coverage report

```bash
npm run test:coverage
```

## Code Quality

### Run ESLint

```bash
npm run lint
```

### Fix ESLint issues

```bash
npm run lint:fix
```

### Format code with Prettier

```bash
npm run format
```

## Git Hooks

Husky is configured with:

- **Pre-commit**: Runs `lint-staged` to lint and format changed files
- **Pre-push**: Runs test suite before pushing

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `3000` |
| `HOST` | Server host | `localhost` |
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `JWT_SECRET` | JWT signing secret | `your_secret_key` |
| `JWT_EXPIRY` | JWT token expiration time | `24h` |
| `SWAGGER_ENABLED` | Enable Swagger docs | `true` |
| `SWAGGER_PATH` | Swagger documentation path | `/api-docs` |
| `CORS_ORIGIN` | CORS allowed origins | `http://localhost:3000` |
| `CORS_CREDENTIALS` | Allow CORS credentials | `true` |
| `LOG_LEVEL` | Logging level | `debug` |

## User Roles

The application supports four user roles:

- **admin** - Full access to all resources
- **manager** - Can manage price levels and view users
- **user** - Can view own profile and price levels
- **guest** - Read-only access

## Error Handling

The API uses consistent error responses:

```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error information"
}
```

## Contributing

1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Commit changes (`git commit -m 'Add amazing feature'`)
3. Push to branch (`git push origin feature/amazing-feature`)
4. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@kalaicoco.com or open an issue in the repository.
# kalai-coco-products-crm-backend
