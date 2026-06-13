# Quick Start Guide - Backend API

## 5-Minute Setup

### Option 1: Local Development (Recommended for First-Time)

```bash
# 1. Install dependencies
npm install

# 2. Create environment file
cp .env.example .env

# 3. Update .env with local MongoDB
# MONGODB_URI_DEV=mongodb://localhost:27017/budgetting-dev

# 4. Start MongoDB (requires MongoDB installed locally)
mongod --dbpath ./data  # or use Docker (see below)

# 5. In another terminal, start API
npm run dev

# API ready at http://localhost:3001
```

### Option 2: Docker Compose (Recommended - No Local Dependencies)

```bash
# 1. Install dependencies
npm install

# 2. Start with Docker
docker-compose up

# MongoDB available at localhost:27017
# API available at http://localhost:3001

# Stop: docker-compose down
```

### Option 3: MongoDB Atlas Cloud (Recommended for Production Setup)

```bash
# 1. Create account at mongodb.com/cloud/atlas
# 2. Create a cluster (M0 free tier)
# 3. Get connection string
# 4. Update .env
MONGODB_URI_DEV=mongodb+srv://username:password@cluster.mongodb.net/budgetting-dev

# 5. Start API
npm install
npm run dev
```

## Verify Installation

```bash
# Test health endpoint (no auth required)
curl http://localhost:3001/health

# Expected response:
# { "status": "ok", "timestamp": "...", "uptime": ... }
```

## Test Authentication

```bash
# 1. Login (creates new user)
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Client-ID: test-client-123" \
  -d '{ "passphrase": "mypassphrase123" }'

# Response:
# { "data": { "token": "eyJh...", "userId": "..." } }

# 2. Copy token and use for authenticated requests
TOKEN="eyJh..."

# 3. Get user settings
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/v1/settings

# 4. Create budget item
curl -X POST http://localhost:3001/api/v1/budget-items \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Rent",
    "value": 1200,
    "cycleType": "monthly",
    "startDate": "2026-06-01T00:00:00Z"
  }'
```

## Development Commands

```bash
# Start dev server with hot-reload
npm run dev

# Build for production
npm run build

# Run in production
npm start

# Run tests
npm test

# Watch tests
npm run test:watch

# Lint code
npm run lint

# Fix lint issues
npm run lint:fix

# Type check
npm run type-check
```

## Project Structure

```
backend/
├── src/
│   ├── config/         → Database & env config
│   ├── middleware/     → Auth, validation, errors
│   ├── models/         → Mongoose schemas
│   ├── routes/         → API endpoints
│   ├── services/       → Business logic
│   ├── types/          → TypeScript interfaces
│   ├── utils/          → Helpers (logging, crypto)
│   └── index.ts        → Entry point
├── dist/               → Compiled JS
├── coverage/           → Test coverage
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## Common Tasks

### Add a New API Endpoint

1. Create service method in `src/services/[domain]Service.ts`
2. Add route handler in `src/routes/[domain].ts`
3. Add validation schema in `src/utils/validation.ts`
4. Write tests in `src/services/__tests__/` or `src/routes/__tests__/`

### Update Database Schema

1. Modify model in `src/models/[Name].ts`
2. MongoDB is schema-less, but update type definitions
3. Update service methods to handle new fields
4. Create migration if data transformation needed

### Deploy to Vercel

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login to Vercel
vercel login

# 3. Set environment variables
vercel env add MONGODB_URI_PROD
vercel env add JWT_SECRET

# 4. Deploy
vercel --prod
```

## Environment Variables Quick Reference

| Variable | Development | Staging | Production |
|---|---|---|---|
| NODE_ENV | development | staging | production |
| MONGODB_URI_* | local | Atlas staging | Atlas prod |
| JWT_SECRET | dev-key | secure-random | secure-random |
| LOG_LEVEL | debug | info | warn |

## Troubleshooting

### "Cannot connect to MongoDB"

```bash
# Option A: Check local MongoDB is running
mongosh  # If this fails, MongoDB not installed

# Option B: Use Docker
docker-compose up

# Option C: Use MongoDB Atlas (cloud)
# Update MONGODB_URI_DEV with Atlas connection string
```

### "Port 3001 already in use"

```bash
# Change port in .env
PORT=3002

# Or kill existing process on 3001
lsof -ti:3001 | xargs kill -9  # macOS/Linux
netstat -ano | findstr :3001   # Windows (find PID then taskkill /PID xxx)
```

### Tests failing

```bash
# Clear Jest cache
npm test -- --clearCache

# Run with verbose output
npm test -- --verbose

# Run specific test
npm test -- authService.test.ts
```

## Next Steps

1. **Create Budget Items**: Use POST `/api/v1/budget-items` to create test data
2. **Test Sync**: Try upload/download endpoints at `/api/v1/sync`
3. **Set Settings**: Configure user preferences at PUT `/api/v1/settings`
4. **Integrate Frontend**: Point React frontend to `http://localhost:3001`

## Support

- **API Docs**: See `docs/3. Design/3.3. API.md`
- **Architecture**: See `docs/2. Architectural Decision Record/`
- **Code**: Check inline comments and tests

Happy coding! 🚀
