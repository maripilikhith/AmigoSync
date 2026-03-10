# AmigoSync

AmigoSync is a smart group coordination platform that helps friends stay connected when they split into smaller groups during trips or outings. It features real-time chat, live location tracking, and smart proximity alerts.

## Project Architecture

* **Frontend**: React (Vite), Tailwind CSS, Socket.io-client, React Router.
* **Backend**: Node.js, Express.js, Socket.io, MongoDB/Mongoose.
* **Authentication**: JWT-based authentication.

## Prerequisites

* Node.js (v16 or higher)
* MongoDB (Local instance or MongoDB Atlas)

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
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
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

* **User Authentication**: Secure password hashing and JWT issuance.
* **Room & Group System**: Automatic 6-character shortcode generation for trips.
* **Real-time Messaging**: Enabled by Socket.io, bridging frontend UI events directly with backend event listeners.
* **Live Proximity Alerts**: Built-in Haversine formula calculates coordinates; if under 200 meters, alerts are fired dynamically to both users.

---

*This is a starter boilerplate carefully generated to provide scalable monolithic structure for the vision of AmigoSync.*
