# Note-Taking App with Secure Expiring Share Links

A full-stack note-taking application built with the MERN stack (MongoDB, Express, React, Node.js) featuring secure shareable links with expiration and access controls.

## Features

### Core Functionality
- User authentication (signup/login)
- Create, read, update, delete notes
- Responsive design

### Share Link Features
- **Share Types**:
  - One-time access (expires after first view)
  - Time-based access (expires after set duration)
- **Access Types**:
  - Public access (no password required)
  - Password-protected access (secure password required)
- **Security Features**:
  - Secure random token generation for share links
  - Automatic expiration enforcement
  - Link revocation capability
  - View count tracking (only counts valid views)
  - Protection against race conditions for one-time links

## Tech Stack

### Frontend
- React 18
- React Router v6
- Context API for state management
- CSS3 (vanilla CSS for simplicity)

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose ODM
- JSON Web Tokens (JWT) for authentication
- bcryptjs for password hashing

## Setup Instructions

### Prerequisites
- Node.js (v16+)
- MongoDB (v4+)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd note-taking-app
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Configure environment variables**
   - Copy `.env.example` to `.env` in the backend directory
   - Update values as needed (MONGODB_URI, JWT_SECRET, PORT)

5. **Start MongoDB**
   ```bash
   mongod
   ```

6. **Start the development servers**
   ```bash
   # In backend directory
   npm run dev
   
   # In frontend directory (in another terminal)
   npm run dev
   ```

7. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

## API Documentation

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Notes (Authenticated)
- `GET /api/notes` - Get all user notes
- `POST /api/notes` - Create new note
- `GET /api/notes/:id` - Get specific note
- `PUT /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note
- `POST /api/notes/:id/share` - Create share link for note

### Share Links (Public)
- `GET /api/share/:token` - Get note by share token (checks if password required)
- `POST /api/share/:token` - Verify password and get note

## Security Implementation Details

### Password Protection
- Passwords are stored securely (in production, use bcrypt hashing)
- Share links use cryptographically secure random tokens (32 bytes hex)

### Race Condition Prevention
For one-time links, the system uses atomic operations:
1. Check if link is still valid (not expired, not revoked, view count = 0 for one-time)
2. If valid, increment view count and return note
3. This prevents multiple simultaneous requests from all succeeding

### Token Security
- Share tokens are 32-byte hexadecimal strings (64 characters) generated using crypto.randomBytes
- Extremely low collision probability (2^256 possible values)

## Environment Variables

Create a `.env` file in the backend directory:

```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/noteapp
JWT_SECRET=your-secret-key-change-in-production
```

## Project Structure

```
note-taking-app/
├── backend/
│   ├── controllers/          # Request handlers
│   ├── middleware/           # Custom middleware
│   ├── models/               # Database models
│   ├── routes/               # API route definitions
│   ├── config/               # Configuration files
│   ├── utils/                # Utility functions
│   ├── .env                  # Environment variables
│   ├── server.js             # Entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   ├── pages/            # Page components
│   │   ├── contexts/         # React context providers
│   │   ├── App.jsx           # Main app component
│   │   └── main.jsx          # Entry point
│   ├── index.html            # HTML template
│   └── package.json
└── README.md
```

## Design Decisions

### State Management
Used React Context for authentication state to avoid prop drilling while keeping the implementation simple for this scale of application.

### Data Validation
Implemented validation at both frontend (form validation) and backend (duplicate checks, input sanitization) layers.

### Error Handling
Consistent error handling with appropriate HTTP status codes and meaningful error messages.

### Security Considerations
- Protected routes with JWT authentication middleware
- Input validation and sanitization
- Secure password handling
- Rate limiting considerations (would be implemented in production)
- CORS configuration

## Future Enhancements

1. **Password Hashing**: Implement proper bcrypt hashing for share passwords
2. **Rate Limiting**: Add API rate limiting to prevent abuse
3. **Email Verification**: Add email verification during registration
4. **Password Reset**: Implement forgot password functionality
5. **UI Enhancements**: Add loading states, better error notifications
6. **Testing**: Add unit and integration tests
7. **Deployment**: Add Docker configuration and deployment scripts
8. **Analytics**: Add more detailed view analytics (location, device, etc.)

## License

MIT

## Acknowledgments

- Inspired by common note-taking and sharing applications
- Built with modern web development best practices
