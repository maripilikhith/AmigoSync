# AmigoSync

AmigoSync is a smart group coordination platform that helps friends stay connected when they split into smaller groups during trips or outings. It features real-time chat, live location tracking on an interactive map, subgroup management, and direct messaging.

## Project Architecture

* **Frontend**: React (Vite), Tailwind CSS, Socket.io-client, React Router, Leaflet.js (OpenStreetMap).
* **Backend**: Node.js, Express.js, Socket.io, MongoDB/Mongoose.
* **Authentication**: JWT-based authentication.
* **Image Hosting**: Cloudinary for profile photo uploads.

## Prerequisites

* Node.js (v16 or higher)
* MongoDB (Local instance or MongoDB Atlas)
* Cloudinary account (for profile photo uploads)

## Environment Variables

### Backend (`server/.env`)
Create a `.env` file in the `server` directory with the following variables:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/amigosync
JWT_SECRET=your_super_secret_jwt_key
```

### Frontend (`client/.env`)
Create a `.env` file in the `client` directory (Vite automatically handles variables prefixed with `VITE_`):
```env
VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_cloudinary_upload_preset
```

## Running the Project Locally

### 1. Start the Backend
```bash
cd server
npm install
npm start (or node server.js)
```
The server will run on `http://localhost:5000`.

### 2. Start the Frontend
```bash
cd client
npm install
npm run dev
```
The frontend will normally be available at `http://localhost:3000` or whatever port Vite assigns.

## Deployment Instructions

* **Backend**: Can be deployed on Render, Heroku, or Railway. Ensure to set the Environment Variables in the hosting dashboard.
* **Frontend**: Can be deployed easily on Vercel or Netlify. Set the Build Command to `npm run build` and Output Directory to `dist`. Remember to configure the Environment Variables.

## Core Features Implemented

* **User Authentication**: Secure password hashing (bcrypt) and JWT issuance, with password change support.
* **Profile Management**: Upload profile photos via Cloudinary, update name, phone, and password.
* **Trip (Room) System**: Automatic 6-character shortcode generation for trips. Admin-only trip deletion.
* **Subgroups**: Create smaller groups within a trip for specific activities. Creator and Admin can delete subgroups.
* **Direct Messaging**: Private 1-on-1 chats between trip members.
* **Real-time Messaging**: Powered by Socket.io for instant message delivery.
* **Live Map**: Interactive Leaflet.js map showing all online members' locations with distance indicators (OpenStreetMap — no API key required).
* **Admin Controls**: Trip creator is marked as ADMIN and has elevated permissions for group and trip deletion.

---

*AmigoSync — Keeping friends in sync during group activities.*
