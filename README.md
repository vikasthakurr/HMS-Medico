# HMS Medico

A Hospital Management System backend built with a microservices architecture using Node.js, Express, and MongoDB.

Each domain (auth, patients, doctors, appointments, medical records, lab, pharmacy) is its own independent service with its own database. An API Gateway sits in front of all of them as a single entry point and handles authentication.

## Table of Contents

- [Architecture](#architecture)
- [Services](#services)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Running the Project](#running-the-project)
- [API Reference](#api-reference)
- [Project Structure](#project-structure)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Architecture

```
                          ┌─────────────┐
        Client  ───────▶  │ API Gateway │  (port 3000)
                          └──────┬──────┘
                                 │  verifies JWT, forwards user info
       ┌─────────────┬───────────┼───────────┬─────────────┐
       ▼             ▼           ▼           ▼             ▼
   ┌────────┐   ┌────────┐  ┌────────┐  ┌────────┐   ┌──────────┐
   │  Auth  │   │Patient │  │ Doctor │  │Appoint.│   │   EMR    │  ...
   │  3001  │   │  3002  │  │  3003  │  │  3004  │   │   3005   │
   └───┬────┘   └───┬────┘  └───┬────┘  └───┬────┘   └────┬─────┘
       ▼            ▼           ▼           ▼             ▼
    MongoDB      MongoDB     MongoDB     MongoDB       MongoDB
   (per service, database-per-service pattern)
```

- The **API Gateway** is the only public entry point. It verifies the JWT on protected routes and forwards the decoded user id/role/email to downstream services via headers (`x-user-id`, `x-user-role`, `x-user-email`) for logging/tracing.
- Each service owns its own MongoDB database — no service reads another service's database directly.
- Services share common utilities (auth middleware, error handling, logger) through a local `shared` package.

### Authentication design (defense in depth)

Auth is enforced at **two layers**:

1. The **gateway** verifies the JWT before proxying, and strips any client-supplied `x-user-*` headers so they can't be spoofed.
2. Each **service** independently re-verifies the JWT with its own `verifyToken` middleware and derives `req.user` from the token — it does not trust upstream headers for authorization decisions.

This means a service is still secure even if it's ever exposed directly (not just behind the gateway). The forwarded `x-user-*` headers are informational only. `JWT_SECRET` must be identical across the gateway and all services for verification to line up.

## Services

| Service      | Port | Database           | Responsibility                            |
| ------------ | ---- | ------------------ | ----------------------------------------- |
| API Gateway  | 3000 | —                  | Routing, auth verification, rate limiting |
| Auth         | 3001 | `hms_auth`         | Registration, login, JWT, roles           |
| Patient      | 3002 | `hms_patient`      | Patient records, search                   |
| Doctor       | 3003 | `hms_doctor`       | Staff profiles, availability              |
| Appointment  | 3004 | `hms_appointment`  | Booking, reschedule, cancel               |
| EMR          | 3005 | `hms_emr`          | Visit records, prescriptions, lab orders  |
| Lab          | 3006 | `hms_lab`          | Test catalog, sample tracking, results    |
| Pharmacy     | 3007 | `hms_pharmacy`     | Drug inventory, dispensing                |
| Billing      | 3008 | `hms_billing`      | Invoices, payments                        |
| Notification | 3009 | `hms_notification` | Email/SMS notifications                   |

> The Admin/Analytics service is planned but not yet implemented.

### Roles

The system supports these roles: `admin`, `doctor`, `nurse`, `receptionist`, `patient`, `lab_technician`, `pharmacist`. Route access is restricted by role.

## Tech Stack

- **Runtime:** Node.js (ES Modules)
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose
- **Auth:** JWT (jsonwebtoken) + bcrypt
- **Gateway:** http-proxy-middleware, helmet, express-rate-limit
- **Dev:** nodemon, concurrently

## Getting Started

### Prerequisites

- Node.js 18 or later
- A MongoDB instance (local, or a MongoDB Atlas connection string)

### Installation

```bash
# clone the repo
git clone <your-repo-url>
cd HMS-Medico

# install dependencies for all services
npm run install:all
```

## Environment Variables

Every service has a `.env.example` file. Copy it to `.env` in each service folder and fill in your values.

```bash
# example for one service
cp services/auth-service/.env.example services/auth-service/.env
```

To copy every service's example at once (from the repo root):

```bash
for d in gateway services/*/; do
  [ -f "$d/.env.example" ] && cp -n "$d/.env.example" "$d/.env"
done
```

Common variables:

| Variable      | Description                                           |
| ------------- | ----------------------------------------------------- |
| `PORT`        | Port the service runs on                              |
| `NODE_ENV`    | `development` or `production`                         |
| `MONGODB_URI` | MongoDB connection string for that service's database |
| `JWT_SECRET`  | Secret for signing/verifying JWTs                     |

> **Important:** `JWT_SECRET` must be **identical** across the gateway and all services, otherwise tokens issued by the auth service won't verify at the gateway. Never commit real secrets — `.env` files are gitignored.

## Running the Project

Make sure MongoDB is reachable and every service has its `.env` set up.

```bash
# run all services together (with hot reload)
npm run dev

# or run in production mode
npm start

# run a single service
npm run dev:auth
npm run dev:patient
# ...etc
```

Once running, the gateway is at `http://localhost:3000`. Every service also exposes a `/health` endpoint.

## API Reference

All requests go through the gateway at `http://localhost:3000`. Protected routes require an `Authorization: Bearer <token>` header.

### Auth (`/api/auth`)

| Method | Endpoint           | Auth   | Description               |
| ------ | ------------------ | ------ | ------------------------- |
| POST   | `/register`        | Public | Register a user           |
| POST   | `/login`           | Public | Login, returns tokens     |
| POST   | `/refresh-token`   | Public | Get a new access token    |
| POST   | `/forgot-password` | Public | Request password reset    |
| POST   | `/reset-password`  | Public | Reset password with token |
| GET    | `/profile`         | Yes    | Current user profile      |
| POST   | `/logout`          | Yes    | Invalidate refresh token  |
| POST   | `/change-password` | Yes    | Change password           |

### Patients (`/api/patients`)

| Method | Endpoint | Auth                        | Description    |
| ------ | -------- | --------------------------- | -------------- |
| POST   | `/`      | admin, receptionist, doctor | Create patient |
| GET    | `/`      | Any logged-in               | List / search  |
| GET    | `/:id`   | Any logged-in               | Get one        |
| PUT    | `/:id`   | admin, receptionist, doctor | Update         |
| DELETE | `/:id`   | admin                       | Soft delete    |

### Doctors (`/api/doctors`)

| Method | Endpoint            | Auth          | Description         |
| ------ | ------------------- | ------------- | ------------------- |
| POST   | `/`                 | admin         | Create doctor/staff |
| GET    | `/`                 | Any logged-in | List / filter       |
| GET    | `/:id`              | Any logged-in | Get one             |
| PUT    | `/:id`              | admin         | Update              |
| PUT    | `/:id/availability` | admin, doctor | Update schedule     |
| DELETE | `/:id`              | admin         | Soft delete         |

### Appointments (`/api/appointments`)

| Method | Endpoint          | Auth                        | Description                      |
| ------ | ----------------- | --------------------------- | -------------------------------- |
| POST   | `/`               | Any logged-in               | Book (rejects overlapping slots) |
| GET    | `/`               | Any logged-in               | List / filter                    |
| GET    | `/:id`            | Any logged-in               | Get one                          |
| PUT    | `/:id/reschedule` | Any logged-in               | Reschedule                       |
| PUT    | `/:id/cancel`     | Any logged-in               | Cancel                           |
| PUT    | `/:id/status`     | admin, doctor, receptionist | Mark completed/no_show           |

### EMR (`/api/emr`)

| Method | Endpoint              | Auth          | Description         |
| ------ | --------------------- | ------------- | ------------------- |
| POST   | `/`                   | admin, doctor | Create visit record |
| GET    | `/`                   | Any logged-in | List / filter       |
| GET    | `/patient/:patientId` | Any logged-in | Patient history     |
| GET    | `/:id`                | Any logged-in | Get one             |
| PUT    | `/:id`                | admin, doctor | Update              |
| POST   | `/:id/prescriptions`  | admin, doctor | Add prescription    |
| POST   | `/:id/lab-orders`     | admin, doctor | Add lab order       |

### Lab (`/api/lab`)

| Method | Endpoint              | Auth                          | Description           |
| ------ | --------------------- | ----------------------------- | --------------------- |
| POST   | `/tests`              | admin                         | Add test to catalog   |
| GET    | `/tests`              | Any logged-in                 | List catalog          |
| PUT    | `/tests/:id`          | admin                         | Update test           |
| POST   | `/orders`             | admin, doctor                 | Create lab order      |
| GET    | `/orders`             | Any logged-in                 | List orders           |
| GET    | `/orders/:id`         | Any logged-in                 | Get one               |
| PUT    | `/orders/:id/collect` | admin, lab_technician         | Mark sample collected |
| PUT    | `/orders/:id/result`  | admin, lab_technician         | Enter result          |
| PUT    | `/orders/:id/cancel`  | admin, doctor, lab_technician | Cancel order          |

### Pharmacy (`/api/pharmacy`)

| Method | Endpoint               | Auth              | Description     |
| ------ | ---------------------- | ----------------- | --------------- |
| POST   | `/drugs`               | admin, pharmacist | Add drug        |
| GET    | `/drugs`               | Any logged-in     | List / search   |
| GET    | `/drugs/low-stock`     | admin, pharmacist | Low-stock drugs |
| GET    | `/drugs/:id`           | Any logged-in     | Get one         |
| PUT    | `/drugs/:id`           | admin, pharmacist | Update          |
| PUT    | `/drugs/:id/add-stock` | admin, pharmacist | Restock         |
| POST   | `/dispense`            | admin, pharmacist | Dispense drugs  |
| GET    | `/dispense`            | Any logged-in     | List dispenses  |

### Billing (`/api/billing`)

| Method | Endpoint        | Auth                | Description                        |
| ------ | --------------- | ------------------- | ---------------------------------- |
| POST   | `/`             | admin, receptionist | Create invoice                     |
| GET    | `/`             | Any logged-in       | List / filter by patient or status |
| GET    | `/:id`          | Any logged-in       | Get one                            |
| POST   | `/:id/payments` | admin, receptionist | Record a payment                   |
| PUT    | `/:id/cancel`   | admin, receptionist | Cancel invoice                     |

### Notifications (`/api/notifications`)

| Method | Endpoint     | Auth                                        | Description                              |
| ------ | ------------ | ------------------------------------------- | ---------------------------------------- |
| POST   | `/`          | admin, doctor, receptionist, lab_technician | Send a notification (email/SMS)          |
| GET    | `/`          | Any logged-in                               | List / filter by recipient, type, status |
| GET    | `/:id`       | Any logged-in                               | Get one                                  |
| PUT    | `/:id/read`  | Any logged-in                               | Mark as read                             |
| PUT    | `/:id/retry` | admin, receptionist                         | Retry a failed notification              |

> The notification service simulates sending by logging to the console. Swap in a real email/SMS provider (nodemailer, SendGrid, Twilio) in `src/utils/sender.js`.

### Example: register and log in

```bash
# register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Jane","lastName":"Doe","email":"jane@example.com","password":"secret123","role":"admin"}'

# login (returns accessToken)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"jane@example.com","password":"secret123"}'

# use the token on a protected route
curl http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer <accessToken>"
```

## Project Structure

```
HMS-Medico/
├── gateway/                 # API Gateway
│   └── src/
│       ├── app.js
│       └── server.js
├── shared/                  # shared utilities (auth, errors, logger)
│   ├── middleware/
│   ├── utils/
│   └── events/
├── services/
│   ├── auth-service/
│   ├── patient-service/
│   ├── doctor-service/
│   ├── appointment-service/
│   ├── emr-service/
│   ├── lab-service/
│   ├── pharmacy-service/
│   ├── billing-service/
│   └── notification-service/
├── package.json             # root scripts (run all services)
└── README.md
```

Each service follows the same layout:

```
service/
├── src/
│   ├── models/          # Mongoose schemas
│   ├── controllers/     # request handlers + business logic
│   ├── routes/          # Express routes
│   ├── app.js           # Express app setup
│   └── server.js        # DB connection + start
├── .env.example
└── package.json
```

## Troubleshooting

Common issues when running the stack locally:

- **`401 Unauthorized` from a service** — make sure `JWT_SECRET` is identical across the gateway and every service. Mismatched secrets cause token verification to fail.
- **`ECONNREFUSED` on startup** — MongoDB isn't running, or the `MONGO_URI` in the service's `.env` points to the wrong host/port. Start MongoDB and re-check each service's `.env`.
- **Gateway returns `502`/`504`** — the downstream service for that route isn't up. Start each service on its documented port (see the [Services](#services) table).
- **`EADDRINUSE` (port already in use)** — another process is bound to the service port. Stop it, or change the port in the service's `.env`.

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) for setup and guidelines, and note our [Code of Conduct](CODE_OF_CONDUCT.md).

## License

Licensed under the [MIT License](LICENSE).
