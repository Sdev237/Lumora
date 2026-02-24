# Voyageo - Next-Generation Social Media for Travelers

A full-featured social media application designed specifically for travelers, with advanced features beyond traditional platforms like Instagram.

## 🌟 Features

### Core Features

- ✅ **User Authentication** - Secure JWT-based registration/login/logout
- ✅ **Posts** - Create posts with images, captions, and geolocation
- ✅ **Real-time Live Location Sharing** - Share your current location with followers
- ✅ **Interactive World Map** - View nearby posts and active users on a map
- ✅ **Follow/Unfollow System** - Connect with other travelers
- ✅ **Like/Comment System** - Engage with content
- ✅ **Stories** - 24-hour auto-deleting stories
- ✅ **Local Network Mode** - See local content first when entering a new city
- ✅ **Time Capsules** - Posts that unlock at a future date
- ✅ **Explore Page** - Smart filtering by location, popularity, and interests

### Advanced Features

- 🗺️ **MongoDB Geospatial Indexing** - Efficient location-based queries
- 🚦 **Rate Limiting** - Prevent API abuse
- ✅ **Input Validation** - Secure data validation
- ♾️ **Infinite Scroll Feed** - Smooth content loading
- 🔔 **Real-time Notifications** - Socket.io powered
- 🧩 **Clean Reusable Components** - Modern React architecture

## 🛠️ Tech Stack

### Backend

- **Node.js** with Express
- **MongoDB** with Mongoose (geospatial support)
- **JWT** authentication
- **Socket.io** for real-time features
- **Multer** for image uploads
- **Express Rate Limit** for API protection
- **Express Validator** for input validation
- MVC architecture
- REST API structure

### Frontend

- **Next.js 14** (App Router)
- **React** with Hooks
- **TypeScript**
- **TailwindCSS** for styling
- **Socket.io Client** for real-time
- **Mapbox GL** for interactive maps
- **Axios** for API calls
- **React Hot Toast** for notifications
- **Date-fns** for date formatting

## 📋 Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Mapbox account (for map features)
- Docker & Docker Compose (optional)

## 🚀 Quick Start

### Option 1: Docker (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd voyageo

# Create .env file
cp .env.example .env
# Edit .env with your configuration

# Build and start containers
docker-compose up --build

# Backend will be available at http://localhost:5000
# Frontend should be started separately (see below)
```

### Option 2: Manual Setup

#### 1. Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

#### 2. Configure Environment

Create a `.env` file in the root directory:

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/voyageo

# JWT Secret (change in production!)
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Client URL
CLIENT_URL=http://localhost:3000

# Mapbox Token (get from https://www.mapbox.com/)
NEXT_PUBLIC_MAPBOX_TOKEN=your-mapbox-token
```

#### 3. Create Uploads Directory

```bash
mkdir uploads
```

#### 4. Start MongoDB

**Local MongoDB:**

```bash
# Windows
mongod

# macOS/Linux
sudo systemctl start mongod
```

**Or use MongoDB Atlas** (cloud) and update `MONGODB_URI` in `.env`

#### 5. Start the Application

**Development mode (both backend and frontend):**

```bash
npm run dev
```

**Or start separately:**

Backend:

```bash
npm run server
```

Frontend:

```bash
cd client
npm run dev
```

## 📁 Project Structure

```
voyageo/
├── server/
│   ├── config/          # Configuration files
│   ├── controllers/     # Request handlers (MVC)
│   ├── models/          # Mongoose models
│   ├── routes/          # Express routes
│   ├── middleware/      # Custom middleware
│   ├── sockets/         # Socket.io handlers
│   ├── jobs/            # Scheduled jobs (time capsules, cleanup)
│   └── server.js         # Entry point
├── client/
│   ├── app/             # Next.js pages (App Router)
│   ├── components/      # React components
│   ├── contexts/        # React contexts (Auth, etc.)
│   ├── lib/             # Utilities (API, Socket, etc.)
│   └── styles/          # CSS/Tailwind config
├── uploads/             # Uploaded images
├── docker-compose.yml    # Docker configuration
├── Dockerfile           # Backend Docker image
└── README.md
```

## 🔑 API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Users

- `GET /api/users/:id` - Get user profile
- `PUT /api/users/profile` - Update profile
- `PUT /api/users/location` - Update current location
- `GET /api/users/search?q=query` - Search users
- `GET /api/users/nearby` - Get nearby users (local network mode)
- `GET /api/users/active` - Get active users (sharing location)

### Posts

- `GET /api/posts/feed` - Get feed (with pagination)
- `POST /api/posts` - Create post
- `GET /api/posts/:id` - Get single post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post
- `GET /api/posts/location` - Get posts by location

### Stories

- `GET /api/stories` - Get stories from followed users
- `POST /api/stories` - Create story
- `POST /api/stories/:id/view` - Mark story as viewed
- `DELETE /api/stories/:id` - Delete story

### Time Capsules

- `GET /api/time-capsules/my` - Get my time capsules
- `GET /api/time-capsules/unlocked` - Get unlocked capsules
- `POST /api/time-capsules` - Create time capsule
- `POST /api/time-capsules/:id/unlock` - Manually unlock capsule
- `DELETE /api/time-capsules/:id` - Delete capsule

### Comments

- `GET /api/comments/:postId` - Get comments
- `POST /api/comments/:postId` - Create comment
- `DELETE /api/comments/:id` - Delete comment

### Likes

- `POST /api/likes/post/:postId` - Like/unlike post
- `POST /api/likes/comment/:commentId` - Like/unlike comment

### Follows

- `POST /api/follows/:userId` - Follow/unfollow user
- `GET /api/follows/:userId/followers` - Get followers
- `GET /api/follows/:userId/following` - Get following

### Notifications

- `GET /api/notifications` - Get notifications
- `PUT /api/notifications/read` - Mark as read
- `DELETE /api/notifications/:id` - Delete notification

### Explore

- `GET /api/explore/posts` - Explore posts with filters
- `GET /api/explore/trending` - Get trending posts
- `GET /api/explore/interest` - Get posts by interest
- `GET /api/explore/nearby` - Get nearby posts

## 🔌 Socket.io Events

### Client → Server

- `join-room` - Join user's personal room
- `update-location` - Update live location
- `stop-sharing-location` - Stop sharing location

### Server → Client

- `new-notification` - New notification received
- `location-update` - Follower location updated
- `nearby-user-location` - Nearby user location update
- `user-online` - User came online
- `user-offline` - User went offline

## 🎯 Key Features Explained

### Local Network Mode

When a user enters a new city, the app prioritizes showing content from users in the same city. This is implemented using MongoDB geospatial queries and city-based filtering.

### Time Capsules

Users can create posts that will automatically unlock at a future date. A background job runs hourly to check and unlock capsules when their time arrives.

### Stories

24-hour stories that automatically expire. MongoDB TTL indexes handle automatic deletion, with a backup cleanup job running daily.

### Real-time Location Sharing

Users can share their live location with followers. Updates are sent via Socket.io for real-time map updates.

## 🧪 Testing

```bash
# Run backend tests (when implemented)
npm test

# Run frontend tests (when implemented)
cd client
npm test
```

## 📝 Environment Variables

See `.env.example` for all required environment variables.

## 🐳 Docker Commands

```bash
# Build and start
docker-compose up --build

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

## 🔒 Security Features

- JWT authentication with secure token storage
- Password hashing with bcrypt (12 rounds)
- Rate limiting on API endpoints
- Input validation and sanitization
- CORS configuration
- Helmet.js for security headers
- Protected routes with authentication middleware

## 📱 Pages

- `/` - Login/Register
- `/feed` - Main feed
- `/create-post` - Create new post
- `/explore` - Explore with filters
- `/map` - Interactive map view
- `/stories` - View and create stories
- `/time-capsules` - Manage time capsules
- `/profile/:id` - User profile

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT

## 🆘 Troubleshooting

### MongoDB Connection Issues

- Ensure MongoDB is running
- Check `MONGODB_URI` in `.env`
- Verify network connectivity

### Images Not Loading

- Check `uploads/` directory exists
- Verify file permissions
- Check image URL paths

### Socket.io Not Working

- Verify `CLIENT_URL` matches frontend URL
- Check CORS configuration
- Ensure Socket.io server is running

### Map Not Displaying

- Verify `NEXT_PUBLIC_MAPBOX_TOKEN` is set
- Check Mapbox account has credits
- Verify token permissions

## 📞 Support

For issues and questions, please open an issue on GitHub.

---

Built with ❤️ for travelers around the world 🌍
