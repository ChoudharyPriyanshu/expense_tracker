# Mini Expense Tracker

A small full-stack MERN application for tracking personal expenses. Add an expense, filter the list by
category, delete entries, and see live totals per category and overall.

Built as a 60-minute technical-round exercise, with the emphasis on correct API behaviour, sensible
validation, and clean React state — not on styling.

---

## Contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Quick start](#quick-start)
- [Environment variables](#environment-variables)
- [Project structure](#project-structure)
- [Data model](#data-model)
- [API reference](#api-reference)
- [Frontend overview](#frontend-overview)
- [Design decisions](#design-decisions)
- [Verification](#verification)
- [Deployment](#deployment)
- [Possible next steps](#possible-next-steps)
- [Discussion notes](#discussion-notes)

---

## Features

- **Add an expense** — title, amount and category, with server-side validation and the real error
  message shown in the form. The form clears only after a successful save.
- **List expenses** — newest first, showing title, amount, category and date.
- **Filter by category** — the dropdown refetches from the API rather than filtering in the browser.
- **Delete an expense** — with correct `404` handling and no crash on a malformed id.
- **Live summary** — total per category via a MongoDB aggregation, plus a grand total. Refreshes after
  every add and delete.
- **Honest UI states** — `Loading...` while fetching, `No expenses yet` when empty, and the API's own
  error message when a request fails.

---

## Tech stack

| Layer | Choice | Notes |
| --- | --- | --- |
| Database | MongoDB + Mongoose 8 | Local `mongod` or MongoDB Atlas |
| Backend | Node 22, Express 5 | ES modules throughout (`"type": "module"`) |
| Frontend | React 19 + Vite 7 | Plain `fetch`, no state library, no UI kit |
| Styling | Hand-written CSS | Single stylesheet, ~180 lines |

No `axios`, no Redux, no Tailwind — everything the app needs is either in the standard library or in the
four runtime dependencies (`express`, `mongoose`, `cors`, `dotenv`).

---

## Quick start

### Prerequisites

- Node.js 18+ (developed on 22)
- MongoDB running locally, **or** a MongoDB Atlas connection string

### 1. Backend

```bash
cd server
npm install
# create server/.env — see the table below
npm run dev          # http://localhost:5000
```

You should see:

```
MongoDB connected: expense_tracker
API running on http://localhost:5000
```

If the database is unreachable, the server prints the reason and exits instead of starting and serving
errors.

### 2. Frontend

In a second terminal:

```bash
cd client
npm install
# create client/.env — see the table below
npm run dev          # http://localhost:5173
```

Open <http://localhost:5173>.

### Scripts

| Location | Command | Does |
| --- | --- | --- |
| `server/` | `npm run dev` | Starts the API with `node --watch` (auto-restart on change) |
| `server/` | `npm start` | Starts the API without watching — the production entry point |
| `client/` | `npm run dev` | Vite dev server with HMR on port 5173 |
| `client/` | `npm run build` | Production build into `client/dist/` |
| `client/` | `npm run preview` | Serves the built bundle locally |

---

## Environment variables

Both `.env` files are git-ignored and must be created locally.

**`server/.env`**

| Variable | Example | Purpose |
| --- | --- | --- |
| `PORT` | `5000` | Port the API listens on |
| `MONGO_URI` | `mongodb://127.0.0.1:27017/expense_tracker` | Connection string — local or an Atlas `mongodb+srv://…` URI |
| `CLIENT_ORIGIN` | `http://localhost:5173` | Origin allowed by CORS |

**`client/.env`**

| Variable | Example | Purpose |
| --- | --- | --- |
| `VITE_API_URL` | `http://localhost:5000/api` | Base URL every API call is built from |

> `VITE_API_URL` is read at **build time**, not at runtime — Vite inlines it into the bundle. Changing it
> requires a rebuild. See [DEPLOYMENT.md](DEPLOYMENT.md) for how this is handled in production.

---

## Project structure

```
.
├── server/                         # Express + Mongoose API
│   ├── config/
│   │   └── db.js                   # Mongo connection — the only file that touches mongoose.connect
│   ├── models/
│   │   └── Expense.js              # Schema, validation rules, CATEGORIES, index
│   ├── controllers/
│   │   └── expenseController.js    # One exported function per endpoint
│   ├── routes/
│   │   └── expenseRoutes.js        # Route table mounted at /api/expenses
│   ├── middleware/
│   │   └── errorHandler.js         # notFound + central error-to-JSON mapper
│   ├── server.js                   # App wiring: cors, express.json, routes, startup
│   └── .env                        # git-ignored
│
├── client/                         # React (Vite)
│   ├── src/
│   │   ├── api.js                  # Every fetch call + shared CATEGORIES list
│   │   ├── App.jsx                 # State, data loading, category filter
│   │   ├── components/
│   │   │   ├── ExpenseForm.jsx     # Controlled inputs, per-form error state
│   │   │   ├── ExpenseList.jsx     # Table, delete button, loading/empty/error states
│   │   │   └── Summary.jsx         # Per-category totals + grand total
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── .env                        # git-ignored
│
├── FLOWCHART/                      # Exported deployment diagrams (PNG)
├── DEPLOYMENT.md                   # AWS deployment strategy
└── README.md
```

---

## Data model

A single `Expense` collection — [server/models/Expense.js](server/models/Expense.js):

| Field | Type | Rules |
| --- | --- | --- |
| `title` | String | Required, trimmed, minimum 2 characters |
| `amount` | Number | Required, must be **greater than** 0 |
| `category` | String | Required, lowercased, one of `food` · `travel` · `bills` · `shopping` · `other` |
| `createdAt` | Date | Defaults to now |

```js
expenseSchema.index({ category: 1, createdAt: -1 });
```

One compound index serves both access patterns: the newest-first list (`sort({ createdAt: -1 })`) and the
category filter, because the filtered query uses the index prefix and then reads the already-sorted range.

`amount` uses a custom validator rather than Mongoose's `min: 0`, because `min` would accept `0` and the
requirement is strictly greater than zero.

---

## API reference

Base URL: `http://localhost:5000/api`

| # | Method | Route | Success | Description |
| --- | --- | --- | --- | --- |
| 1 | `POST` | `/expenses` | `201` | Create an expense |
| 2 | `GET` | `/expenses` | `200` | List all expenses, newest first. Optional `?category=food` |
| 3 | `DELETE` | `/expenses/:id` | `200` | Delete one expense |
| 4 | `GET` | `/expenses/summary` | `200` | Total per category (`$group` aggregation) |
| — | `GET` | `/health` | `200` | Liveness probe — `{"status":"ok"}` |

### 1. Create

```bash
curl -X POST http://localhost:5000/api/expenses \
  -H "Content-Type: application/json" \
  -d '{"title":"Lunch","amount":250,"category":"food"}'
```

```json
{
  "_id": "6aae8fb68858dc3340fb6503",
  "title": "Lunch",
  "amount": 250,
  "category": "food",
  "createdAt": "2026-09-19T13:35:50.120Z",
  "__v": 0
}
```

Invalid input returns `400` with every failing rule joined into one readable message:

```json
{ "message": "Title must be at least 2 characters, Amount must be greater than 0, Category must be one of: food, travel, bills, shopping, other" }
```

### 2. List

```bash
curl http://localhost:5000/api/expenses
curl "http://localhost:5000/api/expenses?category=food"
```

Returns an array sorted by `createdAt` descending. An unknown category returns `400` rather than an empty
array, so a typo in the query string is visible instead of silently looking like "no data".

### 3. Delete

```bash
curl -X DELETE http://localhost:5000/api/expenses/6aae8fb68858dc3340fb6503
```

```json
{ "message": "Expense deleted", "id": "6aae8fb68858dc3340fb6503" }
```

### 4. Summary

```bash
curl http://localhost:5000/api/expenses/summary
```

```json
[
  { "total": 250,   "count": 1, "category": "food" },
  { "total": 120.5, "count": 1, "category": "travel" }
]
```

Implemented as `$group` → `$project` → `$sort` so the totals are computed in the database, not in Node.

### Error responses

Every error is a JSON object with a single `message` key.

| Status | When |
| --- | --- |
| `400` | Validation failure, unknown category filter, or a malformed ObjectId |
| `404` | Expense id is well-formed but no such document — or an unknown route |
| `500` | Anything unexpected (logged server-side, generic message returned) |

---

## Frontend overview

| File | Responsibility |
| --- | --- |
| [src/api.js](client/src/api.js) | All network access. Unwraps the server's `message` so components can display the real reason, and converts a dead server into a readable error instead of a bare `TypeError`. |
| [src/App.jsx](client/src/App.jsx) | Owns `expenses`, `summary`, `category`, `loading`, `error`, and the single `load()` that refreshes everything. |
| [src/components/ExpenseForm.jsx](client/src/components/ExpenseForm.jsx) | Controlled inputs in local draft state; shows the API's validation message; clears only on success. |
| [src/components/ExpenseList.jsx](client/src/components/ExpenseList.jsx) | Renders the table and handles the three UI states (loading / error / empty). |
| [src/components/Summary.jsx](client/src/components/Summary.jsx) | Renders per-category totals and derives the grand total. |

**Data flow**

```
category change ─┐
add expense     ─┼─► load(category) ─► Promise.all([ GET /expenses?category, GET /expenses/summary ])
delete expense  ─┘                          │
                                            └─► setExpenses + setSummary  (one render, always in sync)
```

The summary is always computed across *all* categories, so the grand total stays meaningful while the list
is filtered.

---

## Design decisions

**Backend**

- **Layered by responsibility.** Routes declare URLs, controllers handle one request each, the model owns
  validation, middleware owns error formatting. Each file is small enough to read in one screen.
- **Validation lives in the schema, not the controllers.** One source of truth for the rules, and the same
  rules apply no matter which code path creates a document.
- **One error handler.** Controllers `try/catch` and call `next(err)`; the middleware maps
  `ValidationError` → `400` and `CastError` → `400`. No controller repeats status-code logic.
- **Malformed ids are checked up front** with `mongoose.isValidObjectId`, so `DELETE /api/expenses/abc`
  returns a clean `400` instead of throwing.
- **`/summary` is registered before `/:id`** so it can never be captured as an id parameter.
- **Startup is fail-fast.** The server only calls `listen()` after the database connects; a bad
  `MONGO_URI` produces one clear message and exit code 1 rather than a process that accepts traffic it
  cannot serve.
- **Config comes from `.env`** — nothing environment-specific is hard-coded.

**Frontend**

- **All network code in one module,** so error handling and the base URL are defined once.
- **One loader for list and summary.** They are fetched together, so the totals can never drift from the
  rows on screen, and every mutation ends with the same refresh.
- **Filtering happens on the server.** The dropdown changes state, an effect refetches. This is the
  behaviour that still works when there are more expenses than fit in memory.
- **`handleAdd` rethrows.** `App` does not swallow the POST error, which lets `ExpenseForm` display the
  validation message next to the inputs and keep what the user typed.

---

## Verification

Every endpoint was exercised against a live local MongoDB before the app was considered done:

| Case | Result |
| --- | --- |
| `POST` valid expense | `201` with the saved document |
| `POST` `{title:"A", amount:-5, category:"pets"}` | `400`, all three rule violations in one message |
| `GET /expenses` | Newest first |
| `GET /expenses?category=food` | Correctly filtered |
| `GET /expenses?category=pets` | `400` with the list of valid categories |
| `GET /expenses/summary` | Correct per-category totals |
| `DELETE /expenses/abc` | `400` "Invalid expense id" — server stayed up |
| `DELETE` unknown but valid ObjectId | `404` "Expense not found" |
| `DELETE` real id | `200`, row removed |
| `npm run build` (client) | Builds clean |

---

## Deployment

Full write-up in **[DEPLOYMENT.md](DEPLOYMENT.md)**, with diagrams exported to [FLOWCHART/](FLOWCHART/):

| Diagram | Shows |
| --- | --- |
| [Target architecture](FLOWCHART/1_1_target_architecture_ecs_fargate.png) | S3 + CloudFront + ALB + ECS Fargate + Atlas inside a VPC |
| [CI/CD pipeline](FLOWCHART/2_2_ci_cd_pipeline.png) | GitHub Actions → OIDC → ECR → blue/green with automatic rollback |
| [Runtime request flow](FLOWCHART/3_3_runtime_request_flow.png) | How one request is routed to S3 or to the API |
| [Choosing a strategy](FLOWCHART/4_4_choosing_a_strategy.png) | EC2 vs PaaS vs serverless vs containers vs Kubernetes |

Short version: the React bundle goes to **S3 behind CloudFront**, the API runs as **containers on ECS
Fargate behind an ALB**, and data lives in **MongoDB Atlas**. One CloudFront distribution serves `/*` from
S3 and proxies `/api/*` to the ALB, which means the browser only ever calls its own origin — no CORS in
production, and a single bundle that works in every environment.

---

## Possible next steps

- **Auth** — JWT plus a `user` field on every expense, scoped in every query.
- **Pagination** — keyset pagination (`createdAt < cursor`, `limit 20`) instead of `skip`, which degrades
  as the offset grows.
- **Edit an expense** — `PUT /api/expenses/:id` with `runValidators: true`.
- **Automated tests** — Supertest against an in-memory MongoDB, covering the validation and 404 paths that
  were checked by hand.
- **Date range filter** and a month-over-month view, which the existing index already supports.

---

## Discussion notes

**How would you add login so each user sees only their own expenses?**
A `User` model and JWT auth. Sign a token on login; a middleware verifies it and sets `req.userId`. Add
`user: { type: ObjectId, ref: 'User', index: true }` to the expense schema and scope every query —
`find({ user: req.userId })`, and `findOneAndDelete({ _id: id, user: req.userId })` so one user can never
delete another's row. The summary aggregation gains a `$match` on `user` as its first stage.

**What would you index, and why?**
The compound `{ category: 1, createdAt: -1 }` that is already in the schema: the equality field first, the
sort field second, so one index serves both the unfiltered newest-first list and the filtered list without
an in-memory sort. Once auth exists it becomes `{ user: 1, createdAt: -1 }`, since user is then the
highest-selectivity field on every query.

**How would you handle pagination with 100,000 expenses?**
Keyset (cursor) pagination rather than `skip`. `skip(n)` has to walk and discard n documents, so page 500
is far slower than page 1. Instead, pass the last-seen `createdAt` and query
`find({ createdAt: { $lt: cursor } }).limit(20)` — that seeks directly into the index and costs the same on
every page. `_id` breaks ties for documents sharing a timestamp.

**Why is the code structured this way?**
So that each question has exactly one place to look: *what URLs exist?* → routes; *what happens on this
request?* → controller; *what is valid?* → model; *what does an error look like?* → middleware. On the
frontend the same instinct puts all fetching in `api.js` and all shared state in `App.jsx`, so components
stay presentational and the list can never disagree with the summary.
