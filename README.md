[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/QUdQy4ix)
# CS3219 Project (PeerPrep) - AY2526S1
## Group: G29

### Note: 
- You are required to develop individual microservices within separate folders within this repository.
- The teaching team should be given access to the repositories as we may require viewing the history of the repository in case of any disputes or disagreements. 
<br></br>

---

This repository contains PeerPrep — a small microservice-based platform for collaborative coding and interview practice. It demonstrates multi-service communication (HTTP + RabbitMQ + WebSockets), a collaborative code editor (Monaco), and per-user history storage backed by MongoDB.

---

## Project overview

- Short description: PeerPrep is a microservice application that lets users match with partners, collaborate on coding problems in a real-time editor, and save session history for later review.
- Key features:
	- Matchmaking service (topic/difficulty-based) using RabbitMQ.
	- Collaboration sessions with real-time syncing (WebSocket, Monaco Editor).
	- Question repository service with full-text search and popularity sorting.
	- Per-user history storage and retrieval.
	- Authentication and user management (JWT-based).

---

## Architecture / Services

The repo contains multiple microservices (each in `backend/*`) and a static frontend (`frontend/`). Key services:

- `frontend` (port 3000)
	- Static UI served for development, includes the collaboration screen (Monaco editor) and history/dashboard pages.

- `user-service` (default port 8004)
	- Handles authentication, user profiles and exposes endpoints used by other services.

- `question-service` (default port 8003)
	- Stores questions in MongoDB, exposes search/random/popular and CRUD endpoints.

- `matching-service` (default port 8002)
	- Accepts match requests, uses RabbitMQ to queue and pair users, fetches questions and notifies Collaboration Service when a match is ready.

- `collaboration-service` (default port 8001)
	- Manages live collaboration sessions over WebSocket, persists session start/close events and posts session history to the History Service.

- `history-service` (default port 8005)
	- Stores session history documents in MongoDB and exposes endpoints to save and query user history.

Infrastructure used:
- RabbitMQ — used by Matching Service to queue match requests.
- MongoDB — each service uses its own MongoDB collections/databases (local or Atlas).
- Docker & docker-compose — orchestration for local development.

How services communicate
- HTTP REST APIs (most communication between frontend and services, and between services when synchronous requests are required).
- RabbitMQ (AMQP) — asynchronous matching requests handled by the matching queue.
- WebSockets (ws) — real-time communication for collaborative sessions between browser and Collaboration Service.

---

## Getting started / Setup instructions

Prerequisites:
- Node.js (v16+ recommended)
- Docker & Docker Compose (for running the full stack locally)
- (Optional) MongoDB / RabbitMQ if running services individually without Docker

Clone the repo:

```bash
git clone https://github.com/CS3219-AY2526Sem1/cs3219-ay2526s1-project-g29.git
cd cs3219-ay2526s1-project-g29
```

Install (for running individual services locally):

```bash
# Example: install dependencies for backend services
cd backend/question-service && npm install
cd ../history-service && npm install
# ...repeat for other services as needed

# Frontend dependencies
cd frontend && npm install
```

Environment variables
- Create a `.env` file at the repository root or pass env vars when running Docker. The `docker-compose.yml` shows the expected variables; common ones:

- RABBITMQ_USER, RABBITMQ_PASS (RabbitMQ credentials)
- MONGO_PORT (if using local MongoDB mapping)
- FRONTEND_PORT, USER_PORT, QUESTION_PORT, MATCHING_PORT, COLLAB_PORT, HISTORY_PORT
- JWT_SECRET
- COLLAB_INTERNAL_TOKEN (internal API token used between services)
- QUESTION_SERVICE_URL, USER_SERVICE_URL, etc. (overrides when needed)

Sample `.env` (example values):

```ini
RABBITMQ_USER=admin
RABBITMQ_PASS=admin
JWT_SECRET=your_jwt_secret
COLLAB_INTERNAL_TOKEN=dev-internal-token
FRONTEND_PORT=3000
USER_PORT=8004
QUESTION_PORT=8003
MATCHING_PORT=8002
COLLAB_PORT=8001
HISTORY_PORT=8005
```

We've added a ready-to-edit [example](./.env.example) file at the repo root: `.env.example`.
Copy it to `.env` and fill in secrets (do NOT commit `.env` to source control):

```bash
cp .env.example .env
# then edit .env with your real values (MongoDB URIs, GEMINI_API_KEY, etc.)
```

Important example entries included in `.env.example`:

- Local MongoDB (docker-compose):
	- `DB_LOCAL_URI=mongodb://mongodb:27017/peerprep`
	- Per-service local URIs: `QUESTION_DB_LOCAL_URI`, `USER_DB_LOCAL_URI`, `HISTORY_DB_LOCAL_URI`
- Atlas / Cloud placeholders:
	- `DB_CLOUD_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority`
- Gemini / Google generative AI key (used by Collaboration Service):
	- `GEMINI_API_KEY=your_gemini_api_key_here`
	- `AI_PROVIDER`, `AI_MODEL`, `AI_TEMPERATURE`, `AI_MAX_TOKENS`, `AI_RATE_LIMIT`, `AI_RATE_WINDOW`


Run the whole stack with Docker Compose (recommended for dev):

```bash
docker compose up --build
```

This brings up RabbitMQ, MongoDB, all backend services and the frontend. See `docker-compose.yml` for ports and environment wiring.

Run a single service (example):

```bash
cd backend/question-service
npm run dev
```

---

## Database / Configuration

- Database: MongoDB is used by multiple services. The compose file mounts a `mongodb` container for local dev. Services also support MongoDB Atlas/cloud via env vars (e.g., `QUESTION_DB_CLOUD_URI`).

- Collections / notable indexes (examples from code):
	- `questions` (Question Service)
		- Text index on `title`, `description`, `topics` with weights (title high weight).
		- Compound indexes on `difficulty`, `isActive`, and `topics` for efficient filtering and sorting.
		- Index on `stats.attempts` (descending) for popularity ranking.
	- `history` (History Service)
		- `history` documents store `sessionId`, `participants`, `questionId` and timestamps.
		- Index on `participants.id` to quickly query all sessions a user participated in.

- If you seed data: Question Service includes a `utils/seed-questions.js` script; run `npm run seed` in `backend/question-service` to load sample questions.

---

## API Documentation (summary)

Note: Each service exposes its own routes. Below are the main endpoints used by the frontend and services.

Question Service (mounted at `/api/questions`)
- GET `/api/questions` — list questions (supports filters)
- GET `/api/questions/:id` — get question by id
- POST `/api/questions` — create question (requires input validation)
- PUT `/api/questions/:id` — update question
- DELETE `/api/questions/:id` — delete a question
- GET `/api/questions/random?difficulty=&topics=` — fetch a random question matching criteria
- GET `/api/questions/search?q=...` — full-text search (uses text index)

History Service (mounted at `/api/history`)
- POST `/api/history/saveHistory` — save/update session history
	- Body: { sessionId, userId, username, questionId, submittedCode }
- GET `/api/history/users/:userId?page=&limit=` — fetch all history documents for a user (paginated)

User Service
- POST `/auth/login` — login
- GET `/auth/verify-token` — verify session cookie (frontend uses this)
- POST `/auth/logout` — logout
- GET `/users/:id` and internal endpoints for user profile (used by matching service)

Matching Service
- POST `/match/request` — request a match (topics, difficulty)
- POST `/match/cancel` — cancel an outstanding match request
- The matching service fetches random questions from Question Service (`/questions/random`) and pushes results to Collaboration Service when a match is found.

Collaboration Service
- POST `/matches` — (internal) create a collaboration session (matching posts here)
- GET `/matches/:id` — retrieve public session info
- WebSocket endpoints for real-time collaboration (see collaboration screen frontend)

Example cURL: get user history

```bash
curl "http://localhost:8005/api/history/users/<USER_ID>?page=1&limit=10"
```

---

## Deployment

- Local development: use `docker compose up --build` from repo root.
- Each service is containerized and can be deployed separately. `docker-compose.yml` shows port mapping and environment variables.
- For production, configure secure env vars, enable MongoDB Atlas URIs, and secure internal tokens (`COLLAB_INTERNAL_TOKEN`) and `JWT_SECRET`.

Ports (defaults used in docker-compose):
- Frontend: 3000
- Collaboration Service: 8001
- Matching Service: 8002
- Question Service: 8003
- User Service: 8004
- History Service: 8005

---

## Developer notes / Contributing

- Coding conventions: the repo uses plain JavaScript (ES modules in some services via `type: module`). Keep consistent styling and write small, well-tested changes.
- Tests: unit/integration tests are not yet provided — add tests under each service as needed.
- Adding new services: follow the microservice layout in `backend/` and wire ports/env vars in `docker-compose.yml`.
- Known libraries: Socket.io & ws (WebSockets), RabbitMQ (AMQP), Monaco Editor for the code editor.

---
