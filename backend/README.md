# Budgetting API Backend

Express.js API for the Budgetting application. Implements offline-first architecture with data synchronization, secure authentication, and comprehensive budget management.

## Technology Stack

- **Runtime**: Node.js 16+
- **Framework**: Express.js with TypeScript
- **Database**: MongoDB Atlas
- **Local Storage** (Client): RxDB + IndexedDB
- **Authentication**: JWT + Argon2 passphrase hashing
- **Encryption**: AES-256-GCM for client-side field encryption

## Architecture

```
src/
├── config/          # Configuration & environment
├── middleware/      # Express middleware (auth, validation, error handling)
├── models/          # MongoDB Mongoose models
├── routes/          # API route handlers
├── services/        # Business logic layer
├── types/           # TypeScript type definitions
├── utils/           # Utility functions (logging, encryption, validation)
└── index.ts         # Application entry point
```

## Setup

### Prerequisites

- Node.js >= 16
- MongoDB Atlas account (free tier supported)
- npm or yarn

### Installation

1. Install dependencies:

```bash
npm install
```

2. Create `.env` file from template:

```bash
cp .env.example .env
```

3. Configure environment variables in `.env`:

```env
NODE_ENV=development
PORT=3001
MONGODB_URI_DEV=mongodb://localhost:27017/budgetting-dev
JWT_SECRET=your-super-secret-key
ENCRYPTION_KEY=your-base64-encoded-encryption-key
```

### Local Development

#### Option A: Local MongoDB

Install MongoDB Community Edition locally, then:

```bash
npm run dev
```

#### Option B: MongoDB Atlas

Replace `MONGODB_URI_DEV` in `.env` with your MongoDB Atlas connection string.

## Running

### Development Mode

```bash
npm run dev
```

Runs with `nodemon` for hot-reload. API available at `http://localhost:3001`

### Production Build

```bash
npm run build
npm start
```

### Testing

```bash
npm test              # Run all tests with coverage
npm run test:watch   # Run tests in watch mode
```

## API Endpoints

### Authentication

- `POST /api/v1/auth/login` - Login or create user
- `POST /api/v1/auth/logout` - Logout

### Budget Items

- `GET /api/v1/budget-items` - List budget items
- `GET /api/v1/budget-items/:id` - Get budget item
- `POST /api/v1/budget-items` - Create budget item
- `PUT /api/v1/budget-items/:id` - Update budget item
- `DELETE /api/v1/budget-items/:id` - Delete budget item
- `POST /api/v1/budget-items/:id/mark-paid` - Mark as paid
- `GET /api/v1/budget-items/period/:start/:end` - Get items for period

### Settings

- `GET /api/v1/settings` - Get user settings
- `PUT /api/v1/settings` - Update settings

### Sync

- `GET /api/v1/sync/status` - Get sync status
- `POST /api/v1/sync/upload` - Upload changes (client→server)
- `GET /api/v1/sync/download` - Download changes (server→client)

### Health

- `GET /health` - Health check (no authentication required)

## Authentication

The API uses JWT-based authentication with passphrase-derived keys:

1. **User Login/Creation**: Client sends passphrase
2. **Passphrase Hashing**: Server hashes with Argon2
3. **Token Generation**: Server generates JWT token valid for 24 hours
4. **Request Auth**: Client includes `Authorization: Bearer <token>` header

### Client-Side Encryption

Sensitive data fields (budget amounts, descriptions) are encrypted client-side using AES-256-GCM before transmission to the server.

## Sync Strategy

### Offline-First

All mutations occur locally first; sync to server is asynchronous and automatic.

### Conflict Resolution

Uses Last-Write-Wins (LWW) strategy with timestamps:
- `_clientUpdatedAt`: Timestamp of client change
- `_serverUpdatedAt`: Timestamp of server change
- Client update wins if timestamp is newer

### Sync Flow

```
Client Changes
    ↓
Queue locally (RxDB)
    ↓
POST /api/v1/sync/upload
    ↓
Server processes changes
    ↓
Return sync status & conflicts
    ↓
Client retrieves latest with GET /api/v1/sync/download
```

## Error Handling

All errors follow standard format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "statusCode": 400,
    "details": { "field": "value" }
  }
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|---|
| INVALID_TOKEN | 401 | Invalid or expired JWT |
| NOT_FOUND | 404 | Resource not found |
| VALIDATION_ERROR | 400 | Request validation failed |
| CONFLICT | 409 | Sync conflict detected |
| RATE_LIMITED | 429 | Too many requests |

## Rate Limiting

- **General API**: 1000 requests/hour per user
- **Sync Endpoints**: 50 requests/minute per user
- **Login**: 5 attempts per 5 minutes per IP

(Disabled in development mode)

## Logging

Structured JSON logging with Winston:

- **Development**: Console output with colors
- **Production**: Console + file (error.log, combined.log)

Log level controlled by `LOG_LEVEL` env var (default: info)

## Deployment

### Vercel Functions (Recommended for MVP)

1. Configure `vercel.json` at project root
2. Deploy: `vercel deploy`
3. Set environment variables in Vercel dashboard

### AWS ECS (Recommended for scale)

1. Build Docker image
2. Push to ECR
3. Create ECS service with auto-scaling
4. Configure RDS/Aurora or MongoDB Atlas

### Docker

```bash
docker build -t budgetting-api .
docker run -p 3001:3001 --env-file .env budgetting-api
```

## Database

### MongoDB Atlas Setup

1. Create account at mongodb.com/cloud/atlas
2. Create cluster (free tier: M0)
3. Create database user
4. Whitelist IP addresses
5. Get connection string
6. Add to `.env` as `MONGODB_URI_*`

### Collections

- `users` - User accounts
- `budgetitems` - Budget items
- `settings` - User settings
- `synclogs` - Sync operation history

## Testing

Test coverage requirement: **70%**

Run coverage report:

```bash
npm test -- --coverage
```

## Environment Variables

See `.env.example` for complete list. Key variables:

| Variable | Default | Description |
|----------|---------|---|
| NODE_ENV | development | Environment (development, staging, production) |
| PORT | 3001 | Server port |
| MONGODB_URI_* | | MongoDB connection string (per environment) |
| JWT_SECRET | (required) | JWT signing key |
| JWT_EXPIRY | 86400 | Token expiry in seconds (24 hours) |
| ARGON2_TIME | 3 | Argon2 time cost |
| ARGON2_MEMORY | 65536 | Argon2 memory cost in KiB |
| LOG_LEVEL | info | Logging level |

## Troubleshooting

### Connection Error

```
MongooseError: Cannot connect to MongoDB
```

**Solution**: Verify MONGODB_URI is correct and MongoDB Atlas IP whitelist includes your IP

### Auth Failures

```
INVALID_TOKEN: Invalid authorization token
```

**Solution**: Ensure JWT_SECRET in `.env` matches production; regenerate if needed

### Rate Limit Exceeded

```
RATE_LIMITED: Too many requests
```

**Solution**: Wait for rate limit window to reset; disable in development via `.env`

## Contributing

1. Create feature branch: `git checkout -b feature/name`
2. Follow TypeScript strict mode
3. Add tests for new features
4. Ensure coverage >= 70%
5. Format: `npm run lint:fix`
6. Submit PR

## License

MIT
