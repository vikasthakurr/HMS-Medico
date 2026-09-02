# Contributing to HMS Medico

Thanks for your interest in contributing! This guide covers how to get set up and the conventions we follow.

## Getting Started

1. Fork the repository and clone your fork.
2. Install dependencies for all services:
   ```bash
   npm run install:all
   ```
3. Copy each service's `.env.example` to `.env` and fill in your values (see the [README](README.md#environment-variables)).
4. Make sure MongoDB is reachable, then start everything:
   ```bash
   npm run dev
   ```

## Project Conventions

- **Language:** JavaScript with ES Modules (`import`/`export`). Use `.js` extensions in relative imports.
- **Style:** Keep it simple and readable. Business logic lives in controllers, Mongoose schemas in models, Express routing in routes.
- **Shared code:** Common middleware, error handling, and utilities go in the `shared` package and are imported as `hms-shared`.
- **Errors:** Throw `AppError(message, statusCode)` from `hms-shared` and let the central error handler format the response.
- **Auth:** Protect routes with `verifyToken` and restrict by role with `authorize(...roles)`.
- **New service?** Follow the existing folder layout (`models/`, `controllers/`, `routes/`, `app.js`, `server.js`), give it a unique port, its own database, and add it to the root `package.json` scripts and the API Gateway.

## Making Changes

1. Create a branch off `main`:
   ```bash
   git checkout -b feature/short-description
   ```
2. Make your changes. Test the affected service's endpoints (the README has curl examples).
3. Keep commits focused and write clear commit messages.
4. Push your branch and open a Pull Request against `main`.

## Pull Request Checklist

- [ ] The affected service starts without errors (`npm run dev:<service>`).
- [ ] No secrets or `.env` files are committed.
- [ ] New endpoints are documented in the README.
- [ ] The change is scoped to one concern.

## Reporting Issues

Open an issue describing:

- What you expected to happen
- What actually happened
- Steps to reproduce
- Which service is involved

## Code of Conduct

By participating, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).
