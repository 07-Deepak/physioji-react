# PhysioJi

PhysioJi is a complete MERN-based physiotherapy learning and consultation platform with separate User, Doctor, and Admin experiences.

## Features

- User authentication and registration
- Doctor login with separate professional panel
- Admin doctor management and account creation
- Notes upload, browsing, and public/private access controls
- Videos upload and playback
- Live streaming support
- Doubts management for users and admins
- Public doctor profiles with likes
- Responsive healthcare-focused UI
- MongoDB-backed content and authentication
- JWT-based session handling
- File upload support with Multer

## Tech Stack

- Frontend: React, React Router, Axios, Vite
- Backend: Node.js, Express
- Database: MongoDB, Mongoose
- Authentication: JWT, bcrypt
- File Uploads: Multer
- Media Streaming: FFmpeg, HLS, Node Media Server

## Installation

1. Clone the repository.
2. Install dependencies for both frontend and backend.
3. Create environment files for the server and client.
4. Start MongoDB.
5. Run the backend and frontend in development mode.

### Backend

```bash
cd server
npm install
npm run dev
```

### Frontend

```bash
cd client
npm install
npm run dev
```

## Environment Variables

### Server

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
COOKIE_SECRET=your_cookie_secret
NODE_ENV=development
```

### Client

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_STREAM_SERVER_URL=rtmp://localhost:1935/live
```

## Screenshots

Add screenshots here after deployment:

- Home page
- User Notes page
- User Videos page
- Doctor panel dashboard
- Admin dashboard

## Folder Structure

```text
physioji-react/
├── client/
│   └── src/
│       ├── components/
│       ├── contexts/
│       ├── doctor/
│       ├── layouts/
│       ├── pages/
│       ├── routes/
│       ├── styles/
│       └── utils/
├── server/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   └── utils/
└── README.md
```

## Future Scope

- Real doctor note/video ownership workflows
- Live stream scheduling and session management
- Notifications and reminders
- Analytics dashboard for doctors and admins
- Payment and appointment booking

## Author

PhysioJi Project

## License

MIT
