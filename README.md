# Secure Notes with Expiring Share Links

A MERN note-taking application where authenticated users can create notes and share them through public or password-protected links. A shared link can expire after a chosen time, be consumed once, or be revoked by its owner.

## Features

- Register, sign in, and manage personal notes.
- Create public or password-protected share links.
- Create one-time links or links that expire after a selected number of minutes.
- Generate a cryptographically random link token and, when needed, a one-time display password.
- Revoke a link at any time.
- Count only successful note views.
- Use an atomic database update to ensure only one request consumes a one-time link.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, Vite, React Router, Zustand, React Hook Form, Axios |
| Backend | Node.js, Express 5 |
| Database | MongoDB with Mongoose |
| Authentication | JWT and bcryptjs |
| Link/password security | Node.js `crypto` and bcryptjs |

## Setup

### Prerequisites

- Node.js 18 or later
- MongoDB 4 or later, running locally or accessible through a connection string
- npm

### Install and run

```bash
git clone <your-repository-url>
cd note-app

cd backend
npm install

cd ../frontend
npm install
```

Create `backend/.env`:

```dotenv
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/noteapp
JWT_SECRET=replace-with-a-long-random-secret
CLIENT_URL=http://localhost:5173
```

Start the API in one terminal:

```bash
cd backend
npm run dev
```

Start the frontend in another terminal:

```bash
cd frontend
npm run dev
```

Open `http://localhost:5173`. The API is served at `http://localhost:5000` and defaults to `http://localhost:5000/api` in the frontend. Set `VITE_API_URL` in `frontend/.env` only when the API lives elsewhere.

## Database Schema

### `users`

| Field | Type | Notes |
| --- | --- | --- |
| `name` | String | Required |
| `email` | String | Required, lowercase, unique |
| `password` | String | bcrypt hash; never stored in plaintext |
| `createdAt` | Date | Creation time |

### `notes`

| Field | Type | Notes |
| --- | --- | --- |
| `title`, `content` | String | Required note data |
| `userId` | ObjectId | Reference to the note owner |
| `viewCount` | Number | Starts at 0; increments only after valid access |
| `shareToken` | String | Unique sparse token for the active link |
| `sharePassword` | String | bcrypt hash, excluded from normal queries |
| `shareType` | Enum | `none`, `one-time`, or `time-based` |
| `accessType` | Enum | `public` or `password-protected` |
| `expiresAt` | Date/null | Required for time-based links |
| `revoked` | Boolean | Blocks access immediately |
| `createdAt`, `updatedAt` | Date | Mongoose timestamps |

## Share-Link Flow

1. The owner creates a link through `POST /api/notes/:id/share` with `shareType`, `accessType`, and `expiresIn` for time-based links.
2. The server creates a token, configures expiry/access settings, hashes a generated password when requested, and returns the token plus the plaintext password once.
3. A recipient opens `/share/:token`. The API verifies that the token exists, is not revoked, and has not expired.
4. Public links are consumed immediately. Password-protected links first return `requiresPassword`, then the recipient submits the password to `POST /api/share/:token`.
5. A successful access atomically increments `viewCount`; a successful one-time access simultaneously consumes the link.

### Password and key generation

- Share tokens use `crypto.randomBytes(32).toString('hex')`: 32 random bytes, represented as a 64-character hexadecimal token.
- Password-protected links use `crypto.randomBytes(9).toString('base64url')` and store only a bcrypt hash with cost factor 12.
- The plaintext generated password is returned only when the owner creates the link. Later reads select the hash only to compare a submitted password.

### Expiry and revocation

- A time-based link stores `expiresAt = now + expiresIn minutes`; shared-note queries require `expiresAt` to be in the future.
- A one-time link has no clock expiry, but becomes unavailable after its first successful access.
- Revoking `DELETE /api/notes/:id/share` clears the token/password/settings and sets `revoked: true`. Subsequent access cannot find a valid link.

## Edge Cases and Status Codes

| Case | Behavior |
| --- | --- |
| Invalid link | The API returns `404 Invalid or expired link`. |
| Public link | A valid `GET` returns the note and increments `viewCount`. |
| Password-protected link | `GET` returns `requiresPassword`; a valid `POST` returns the note and increments `viewCount`. |
| Wrong password/key | The API returns `401 Invalid password`; it does not increment `viewCount`. |
| Time-expired link | The validity query excludes it. It returns `404`. |
| One-time link already used | The conditional consume fails and returns `410`. |
| Revoked link | The validity query excludes it and returns `404`. |
| Simultaneous one-time access | Only one conditional update can match `viewCount: 0`; all other callers receive `410`. |
| View count | The successful conditional update uses `$inc: { viewCount: 1 }`, avoiding read-modify-write losses. |

## Race Conditions and Safe View Counting

The server does not read a one-time link, increment it in application memory, and save it later. It issues a single MongoDB `findOneAndUpdate` request with all validity constraints:

```js
{
  shareToken: token,
  revoked: false,
  $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  shareType: 'one-time',
  viewCount: 0
}
```

The update is `$inc: { viewCount: 1 }`. MongoDB applies a single-document update atomically, so two concurrent requests cannot both match `viewCount: 0`. The winner receives the note; the loser finds no matching document and gets `410 Gone`. Time-based and public links use the same atomic `$inc`, so increments are not overwritten under concurrent access.

## Brief Design Answers

**How do you prevent two users from using a one-time link at the same time?**  Use one conditional, atomic `findOneAndUpdate` that requires `viewCount: 0` and increments it. Exactly one request can match.

**How do you update view count safely?**  Increment it in the database with `$inc` as part of the successful access operation. Do not calculate and save a new count in application memory.

**How would this work if 1 million people opened the link?**  The current atomic update remains correct, but a frequently viewed single note becomes a write hotspot. Run stateless API instances behind a load balancer, use a properly sized MongoDB deployment and indexes, cache non-sensitive metadata where appropriate, and move high-volume analytics to an asynchronous event stream or sharded counters if exact per-request synchronous counts are no longer required.

**How would you prevent brute-force attempts on password-protected links?**  Add rate limiting by token and IP at the edge/API, progressive backoff, short lockouts after repeated failures, monitoring and alerts, and a CAPTCHA or challenge when abuse is detected. This repository hashes passwords with bcrypt but does **not** yet include those rate-limiting controls.

## API Summary

| Method | Endpoint | Authentication | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | No | Create an account |
| `POST` | `/api/auth/login` | No | Sign in |
| `GET`, `POST` | `/api/notes` | Bearer token | List or create notes |
| `GET`, `PUT`, `DELETE` | `/api/notes/:id` | Bearer token | Read, update, or delete one note |
| `POST` | `/api/notes/:id/share` | Bearer token | Create a share link |
| `DELETE` | `/api/notes/:id/share` | Bearer token | Revoke a share link |
| `GET` | `/api/share/:token` | No | Open public link or request password |
| `POST` | `/api/share/:token` | No | Submit password and open protected link |

## Demo Checklist

The demo should show:

1. Note creation.
2. Share-link generation.
3. A public share link opening successfully.
4. A password-protected share link and its generated password.
5. A rejected wrong-password attempt.
6. A one-time link succeeding once and failing on its second open.
7. A time-based link failing after expiry.
8. Force invalidation through the owner’s revoke action.
9. The updated view count after successful access.

## Deliverables

| Item | Link / value |
| --- | --- |
| Live demo URL | Add deployment URL |
| GitHub repository | Add repository URL |
| Demo video | Add video URL |
| Test credentials | Register a demo account locally, or add deployed demo credentials here |

## Project Structure

```text
note-app/
  backend/
    config/          # MongoDB connection
    controllers/     # Auth and note/share handlers
    middleware/      # JWT protection
    models/          # User and Note schemas
    routes/          # API routes
    server.js        # API entry point
  frontend/
    src/             # React pages, state, and API client
  README.md
```

## License

MIT
