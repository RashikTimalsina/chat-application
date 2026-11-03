# chat-application

A real-time group chat application built as a monorepo:

| Folder      | Stack                                                        | Port  |
|-------------|--------------------------------------------------------------|-------|
| `chat-api/` | Java 21, Spring Boot 4 (WebFlux), Reactive MongoDB, Jackson 3 | 8088  |
| `chat-ui/`  | React 19, Vite 8                                             | 5173  |

## Architecture

```
 ┌──────────────┐   WebSocket  ws://…/ws/chat/{groupId}   ┌─────────────────────────┐
 │   chat-ui    │ ───────────────────────────────────────▶ │        chat-api         │
 │ React + Vite │ ◀─────────────────────────────────────── │  Spring WebFlux         │
 │              │        broadcast of saved Message        │                         │
 │              │                                          │  ChatWebSocketHandler   │
 │              │   REST   http://…/api/messages           │   └ per-group Sinks.Many│
 │              │ ───────────────────────────────────────▶ │  MessageController      │
 └──────────────┘                                          │   └ MessageService      │
                                                           └───────────┬─────────────┘
                                                                       │ reactive driver
                                                                       ▼
                                                              ┌──────────────────┐
                                                              │ MongoDB          │
                                                              │ collection:      │
                                                              │   messages       │
                                                              └──────────────────┘
```

**Message flow over WebSocket**

1. The client opens `ws://localhost:8088/ws/chat/{groupId}`.
2. The server takes `groupId` from the last path segment and attaches the
   session to that group's in-memory `Sinks.Many<Message>` (created on first use).
3. Every inbound frame is deserialized into a `Message`, its `groupId` is
   overwritten with the one from the URL, it is saved to MongoDB, and the
   saved document is emitted to the group sink.
4. Every session in that group, including the sender, receives the saved
   message as JSON.

## Message contract

### `Message` (MongoDB collection `messages`)

| Field       | Type              | Set by                                   |
|-------------|-------------------|------------------------------------------|
| `id`        | string            | MongoDB                                  |
| `sender`    | string            | client                                   |
| `groupId`   | string            | server (from the WebSocket URL path)     |
| `content`   | string            | client                                   |
| `timestamp` | ISO-8601 instant  | `@CreatedDate` (see Known issues)        |

### WebSocket `/ws/chat/{groupId}`

Client → server:

```json
{ "sender": "Abdul", "content": "Hello" }
```

Server → every client in the group:

```json
{
  "id": "6720f1c2a9e4b51d2c3f9a10",
  "sender": "Abdul",
  "groupId": "general",
  "content": "Hello",
  "timestamp": "2026-11-03T06:05:00Z"
}
```

### REST `/api/messages`

| Method | Path                       | Description                          |
|--------|----------------------------|--------------------------------------|
| GET    | `/api/messages/{groupId}`  | History for one group                |
| GET    | `/api/messages`            | All messages                         |
| POST   | `/api/messages`            | Save a message (not broadcast, see Known issues) |

## Running locally

### Prerequisites

- JDK 21
- Node.js 20+ and npm
- A MongoDB instance: either your Atlas cluster, or a local one via Docker

### 1. Database

Option A, local MongoDB via Docker:

```bash
docker compose up -d mongo
```

Option B, MongoDB Atlas: use your cluster's connection string.

### 2. Backend (`chat-api`)

```bash
cd chat-api
cp src/main/resources/application-example.yaml src/main/resources/application.yaml
# edit application.yaml, or export the variables instead:
export MONGODB_URI="mongodb://localhost:27017/chatdb"
./mvnw spring-boot:run
```

The API listens on `http://localhost:8088`.

### 3. Frontend (`chat-ui`)

```bash
cd chat-ui
npm install
npm run dev
```

Open `http://localhost:5173`.

## Configuration and secrets

- `chat-api/src/main/resources/application.yaml` is **gitignored**. It holds
  the real MongoDB URI, including credentials. Never commit it.
- `application-example.yaml` is the committed template. It reads
  `MONGODB_URI` and `SERVER_PORT` from the environment.
- `.env*` files are gitignored, except `.env.example`.

## Known issues

Tracked here so they are fixed deliberately rather than forgotten:

- **Typing events are persisted as messages.** `chat-ui` sends
  `{"type":"typing", ...}` over the same socket. The backend has no `type`
  field, deserializes it as a `Message` with no content, saves it and
  broadcasts it.
- **`timestamp` is likely always `null`.** `@CreatedDate` only works when
  reactive Mongo auditing is enabled, and it is not configured.
- **REST `POST` does not broadcast.** Messages created over REST are saved
  but never reach connected WebSocket clients.
- **Group fan-out is in-memory.** Group sinks live inside one JVM, so running
  two instances of `chat-api` would split each group in two. Group sinks are
  also never removed.
- **CORS allows every origin while also allowing credentials.**
- **Frontend URLs are hard-coded** (`http://localhost:8088`) in `App.jsx`
  rather than read from a Vite env variable.
