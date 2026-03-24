# Driver Delivery App (React Native + Firebase)

Production-style Driver Delivery application built with React Native and Firebase, with end-to-end flows for auth, deliveries, route optimization, and notifications.

## Features implemented

- Email/password authentication with Firebase Auth
- Separate `Sign up` and `Login` screens
- Phone verification step after account creation/login
- Dummy OTP mode enabled for demo stability:
  - Dummy phone number: `1234567890`
  - Dummy OTP: `123456`
- Bottom tab navigation:
  - `Pending Orders`
  - `Delivered Orders`
  - `Profile`
- Route screen with map markers + route optimization + re-optimization after delivery
- FCM token registration and push handling in foreground, background, and killed states
- Navigation from notification tap into app main flow

## OTP note (important for reviewers)

Firebase Phone Auth may require billing (Blaze) and additional phone auth setup for real OTP delivery.  
For predictable demo behavior, this project currently uses dummy phone OTP verification in-app.

- Current demo verification:
  - Phone: `1234567890`
  - OTP: `123456`

The service still contains real phone auth methods, but active screen flow is configured for dummy OTP.

## Setup

### 1) Install dependencies

```sh
npm install
```

### 2) iOS pods (if running iOS)

```sh
cd ios && bundle exec pod install && cd ..
```

### 3) Firebase native config

- Place `google-services.json` in `android/app/`
- Place `GoogleService-Info.plist` in `ios/firebaseTask/`
- Enable `Email/Password` auth in Firebase Console
- Keep these files local only (do not commit)

### 4) Local environment and secrets

- Copy `.env.example` to `.env`
- Fill required values
- Copy `android/gradle.properties.example` to `android/gradle.properties`
- Set `GOOGLE_MAPS_API_KEY` in `android/gradle.properties`

Secrets are ignored by git via `.gitignore`:
- `.env*` (except `.env.example`)
- `android/app/google-services.json`
- `ios/**/GoogleService-Info.plist`
- `android/gradle.properties`
- key/cert files (`*.jks`, `*.pem`, etc.)

### 5) Firestore rules/indexes and functions

```sh
firebase deploy --only firestore:rules,firestore:indexes
cd functions
npm install
firebase deploy --only functions
cd ..
```

### 6) Run app

```sh
npm run start
npm run android
# or
npm run ios
```

## App flow

1. User can create account from `Sign up` (name, email, phone, password)
2. User verifies OTP (dummy mode)
3. App opens `Pending Orders` tab
4. User can move to `Delivered Orders` and `Profile` from bottom tabs
5. Route screen is available from pending tab (`View Route`)

## Notification behavior

Notifications are handled in all app states:

- Foreground: in-app alert + local notification
- Background: system notification and tap handling
- Killed state: app launch from notification tap and route handling

## How to trigger a test notification

1. Log in once on device/emulator so FCM token is saved in `users/{uid}.fcmTokens`.
2. Copy the logged-in Firebase `uid`.
3. Create a document in Firestore `deliveries` collection with that `assignedDriverId`.

Example document:

```json
{
  "assignedDriverId": "YOUR_DRIVER_UID",
  "orderId": "ORD-1001",
  "customerName": "Test Customer",
  "address": "Test Address",
  "status": "pending",
  "location": { "lat": 12.9716, "lng": 77.5946 },
  "updatedAt": "serverTimestamp"
}
```

4. Cloud Function `onDeliveryAssigned` sends push to assigned driver tokens.
5. Tap notification to open app and continue in main delivery flow.

## Project structure

- `src/app/` navigation and app root
- `src/modules/auth/` login/signup/verification/profile screens
- `src/modules/deliveries/` pending, delivered, route screens
- `src/services/` Firebase/auth/delivery/notification services
- `src/store/` Zustand auth state
- `src/theme/` colors and responsive tokens
- `functions/src/` Firebase Cloud Functions
