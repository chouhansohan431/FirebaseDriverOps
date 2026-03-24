import { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import { auth, firestore, hasFirebaseApp, messaging } from './firebase';
import { navigationRef } from '../app/navigation/RootNavigator';
import { Alert, InteractionManager, Linking, PermissionsAndroid, Platform } from 'react-native';
import { displayRemoteNotification } from './localNotificationService';

let tokenSetupInProgress = false;
let listenersBound = false;
let deferredRetryScheduled = false;

function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function waitForUiReady(): Promise<void> {
  return new Promise(resolve => {
    InteractionManager.runAfterInteractions(() => resolve());
  });
}

async function waitForFirebaseReady(maxAttempts = 20, intervalMs = 500): Promise<boolean> {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (hasFirebaseApp()) {
      return true;
    }
    await wait(intervalMs);
  }
  return hasFirebaseApp();
}

async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    if (Platform.Version < 33) {
      return true;
    }

    const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }

  const status = await messaging().requestPermission();
  return (
    status === messaging.AuthorizationStatus.AUTHORIZED ||
    status === messaging.AuthorizationStatus.PROVISIONAL
  );
}

async function upsertFcmToken(token: string) {
  const uid = auth().currentUser?.uid;
  if (!uid) {
    return;
  }

  await firestore().collection('users').doc(uid).set(
    {
      fcmTokens: firestore.FieldValue.arrayUnion(token),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
}

async function fetchAndLogFcmToken(): Promise<string | null> {
  try {
    await messaging().registerDeviceForRemoteMessages();
  } catch {}

  try {
    const token = await messaging().getToken();
    if (token) {
      console.log('[FCM_TOKEN]', token);
      return token;
    }
    console.log('[FCM_TOKEN] token unavailable');
    return null;
  } catch (error) {
    console.log('[FCM_TOKEN_ERROR]', (error as Error).message);
    return null;
  }
}

function routeFromNotification(message: FirebaseMessagingTypes.RemoteMessage | null) {
  if (!message?.data) {
    return;
  }
  const target = message.data.target;
  if (target === 'deliveries') {
    setTimeout(() => {
      if (navigationRef.isReady()) {
        navigationRef.navigate('MainTabs');
      }
    }, 250);
  }
}

function bindNotificationListeners() {
  if (listenersBound) {
    return;
  }

  listenersBound = true;

  auth().onAuthStateChanged(async user => {
    if (!user) {
      return;
    }
    const freshToken = await fetchAndLogFcmToken();
    if (freshToken) {
      await upsertFcmToken(freshToken);
    }
  });

  messaging().onTokenRefresh(async refreshedToken => {
    console.log('[FCM_TOKEN_REFRESHED]', refreshedToken);
    await upsertFcmToken(refreshedToken);
  });

  messaging().onMessage(async remoteMessage => {
    console.log('[NOTIFICATION] foreground message received', {
      messageId: remoteMessage.messageId ?? null,
      from: remoteMessage.from ?? null,
      data: remoteMessage.data ?? {},
      hasNotificationPayload: Boolean(remoteMessage.notification),
    });
    const title = String(remoteMessage.notification?.title ?? remoteMessage.data?.title ?? 'New Notification');
    const body = String(remoteMessage.notification?.body ?? remoteMessage.data?.body ?? 'You have a new update.');

    Alert.alert(title, body, [
      {
        text: 'Open',
        onPress: () => routeFromNotification(remoteMessage),
      },
      { text: 'Dismiss', style: 'cancel' },
    ]);

    await displayRemoteNotification(remoteMessage);
  });

  messaging().onNotificationOpenedApp(remoteMessage => {
    console.log('[NOTIFICATION] onNotificationOpenedApp triggered', {
      messageId: remoteMessage.messageId ?? null,
      data: remoteMessage.data ?? {},
    });
    routeFromNotification(remoteMessage);
  });
}

async function setupFcmWithRetry() {
  if (tokenSetupInProgress) {
    return;
  }

  tokenSetupInProgress = true;
  try {
    const firebaseReady = await waitForFirebaseReady();
    if (!firebaseReady) {
      console.log('[NOTIFICATION] firebase app not ready, scheduling deferred token setup retry');
      if (!deferredRetryScheduled) {
        deferredRetryScheduled = true;
        setTimeout(() => {
          deferredRetryScheduled = false;
          setupFcmWithRetry().catch(() => {});
        }, 3000);
      }
      return;
    }

    const token = await fetchAndLogFcmToken();
    if (token) {
      await upsertFcmToken(token);
    }

    bindNotificationListeners();
  } finally {
    tokenSetupInProgress = false;
  }
}

export const notificationService = {
  async bootstrap() {
    await waitForUiReady();
    await wait(500);

    console.log('[NOTIFICATION] bootstrap started');

    const postNotificationsAlreadyGranted =
      Platform.OS !== 'android' ||
      Platform.Version < 33 ||
      (await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS));
    console.log('[NOTIFICATION] POST_NOTIFICATIONS already granted:', postNotificationsAlreadyGranted);
    const hasPermission = await requestNotificationPermission();
    console.log('[NOTIFICATION] os permission result:', hasPermission);
    if (!hasPermission) {
      Alert.alert(
        'Enable Notifications',
        'Please allow notification permission to receive delivery alerts.',
        [
          { text: 'Not now', style: 'cancel' },
          {
            text: 'Open Settings',
            onPress: () => {
              Linking.openSettings().catch(() => {});
            },
          },
        ],
      );
      return;
    }

    await setupFcmWithRetry();

    const initial = await messaging().getInitialNotification();
    if (initial) {
      console.log('[NOTIFICATION] getInitialNotification found payload', {
        messageId: initial.messageId ?? null,
        data: initial.data ?? {},
      });
    } else {
      console.log('[NOTIFICATION] getInitialNotification empty');
    }
    routeFromNotification(initial);
  },
};
