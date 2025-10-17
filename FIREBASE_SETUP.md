# Firebase Setup Instructions

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project" or select an existing project
3. Follow the setup wizard

## Step 2: Get Your Firebase Configuration

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to "Your apps" section
3. Click the **Web app** icon (`</>`)
4. Register your app with a nickname
5. Copy the `firebaseConfig` object values

## Step 3: Add Configuration to Your Project

### Option 1: Direct Configuration (Quick Setup)
Edit `src/config/firebase.ts` and replace the empty strings:

```typescript
const firebaseConfig = {
  apiKey: "AIza...",  // Replace with your actual values
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

### Option 2: Environment Variables (Recommended for Production)
1. Create a `.env.local` file in your project root (this file is git-ignored)
2. Add your Firebase credentials:

```env
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

## Step 4: Enable Authentication

1. In Firebase Console, go to **Authentication**
2. Click "Get Started"
3. Enable **Email/Password** sign-in method
4. Click "Save"

## Step 5: Create Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click "Create database"
3. Choose **Start in test mode** (for development)
4. Select a location
5. Click "Enable"

## Step 6: Set Up Security Rules (Important!)

In Firestore, go to the **Rules** tab and add:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Tournament rules
    match /tournaments/{tournamentId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        resource.data.createdBy == request.auth.uid;
      
      // Groups subcollection
      match /groups/{groupId} {
        allow read: if true;
        allow write: if request.auth != null && 
          get(/databases/$(database)/documents/tournaments/$(tournamentId)).data.createdBy == request.auth.uid;
      }
      
      // Matches subcollection
      match /matches/{matchId} {
        allow read: if true;
        allow write: if request.auth != null && 
          get(/databases/$(database)/documents/tournaments/$(tournamentId)).data.createdBy == request.auth.uid;
      }
      
      // Fixtures subcollection
      match /fixtures/{fixtureId} {
        allow read: if true;
        allow write: if request.auth != null && 
          get(/databases/$(database)/documents/tournaments/$(tournamentId)).data.createdBy == request.auth.uid;
      }
      
      // Knockout subcollection
      match /knockout/{knockoutId} {
        allow read: if true;
        allow write: if request.auth != null && 
          get(/databases/$(database)/documents/tournaments/$(tournamentId)).data.createdBy == request.auth.uid;
      }
    }
  }
}
```

## Step 7: Test Your Setup

1. Restart your development server after adding credentials
2. The app should now allow you to sign up and create tournaments
3. Each admin can only manage their own tournaments

## Troubleshooting

- **Error: "Firebase not configured"** - You haven't added your credentials yet
- **Error: "auth/invalid-api-key"** - Your API key is incorrect
- **Can't sign up** - Make sure Email/Password authentication is enabled
- **Can't save data** - Check Firestore security rules are configured

## Security Notes

- Never commit `.env.local` or credentials to git
- Use test mode only for development
- Update Firestore rules before deploying to production
- Each admin sees only their own tournaments
