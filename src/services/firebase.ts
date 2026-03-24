import app from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import messaging from '@react-native-firebase/messaging';
import functions from '@react-native-firebase/functions';

export function hasFirebaseApp(): boolean {
  try {
    return Boolean(app.app().name);
  } catch {
    return false;
  }
}

export { auth, firestore, messaging, functions };
