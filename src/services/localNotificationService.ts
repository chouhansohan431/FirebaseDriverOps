import notifee, { AndroidImportance } from '@notifee/react-native';
import { FirebaseMessagingTypes } from '@react-native-firebase/messaging';

const DELIVERY_CHANNEL_ID = 'delivery-alerts';
let channelReady: Promise<string> | null = null;

async function ensureChannel(): Promise<string> {
  if (!channelReady) {
    channelReady = notifee.createChannel({
      id: DELIVERY_CHANNEL_ID,
      name: 'Delivery Alerts',
      importance: AndroidImportance.HIGH,
    });
  }

  return channelReady;
}

function extractTitle(message: FirebaseMessagingTypes.RemoteMessage): string {
  return message.notification?.title ?? message.data?.title ?? 'New Notification';
}

function extractBody(message: FirebaseMessagingTypes.RemoteMessage): string {
  return message.notification?.body ?? message.data?.body ?? 'You have a new update.';
}

export async function displayRemoteNotification(message: FirebaseMessagingTypes.RemoteMessage) {
  console.log('[NOTIFICATION] displayRemoteNotification called', {
    messageId: message.messageId ?? null,
    hasNotificationPayload: Boolean(message.notification),
    data: message.data ?? {},
  });
  const channelId = await ensureChannel();
  await notifee.displayNotification({
    title: extractTitle(message),
    body: extractBody(message),
    android: {
      channelId,
      smallIcon: 'ic_launcher',
      pressAction: {
        id: 'default',
      },
    },
    data: message.data,
  });
}
