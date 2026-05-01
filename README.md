# WildHaven Mobile App System

This workspace contains the WildHaven mobile application and backend used for resort stays, room bookings, safari transportation, package bookings, food orders, equipment rentals, reviews, and admin management.

## Project Structure

- `Tourism-and-Hotel_frontend/mobile-app`
  Expo React Native mobile application.
- `Tourism-and-Hotel_Manage`
  Node.js, Express, and MongoDB backend API.
- `_tmp_package_ui`
  Temporary extracted package UI reference files.
- `_tmp_vehicle_ui`
  Temporary extracted vehicle UI reference files.

## Main Features

- User authentication and profile
- Room availability search and room booking
- Package booking with vehicle and add-ons
- Safari vehicle booking
- Restaurant food ordering
- Equipment rental / storage orders
- Reviews and inquiry submission
- Admin dashboards and management tools

## Prerequisites

- Node.js 18+
- npm
- MongoDB connection string
- Expo Go or Android/iOS emulator

## Frontend Setup

Open the mobile app folder:

```bash
cd "Tourism-and-Hotel_frontend/mobile-app"
```

Install dependencies:

```bash
npm install
```

Start the Expo app:

```bash
npx expo start
```

To clear the Expo cache:

```bash
npx expo start -c
```

## Backend Setup

Open the backend folder:

```bash
cd "Tourism-and-Hotel_Manage"
```

Install dependencies:

```bash
npm install
```

Create a `.env` file with your backend configuration, for example:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

Start the backend:

```bash
npm start
```

## Running the Full System

1. Start the backend first from `Tourism-and-Hotel_Manage`
2. Start the mobile app from `Tourism-and-Hotel_frontend/mobile-app`
3. Make sure the mobile app API base URL points to the backend machine IP, not `localhost`

Example backend API URL for physical-device testing:

```txt
http://192.168.x.x:5000/api
```

## Notes

- The mobile app uses Expo Router for navigation.
- Admin and customer flows share the same mobile app.
- Some temporary folders in this workspace are UI references used during development.

## Recommended Git Workflow

- commit frontend and backend changes together when they are part of the same feature
- avoid committing `.env`, `node_modules`, Expo cache files, and temporary UI extraction folders
- keep feature changes small and testable

