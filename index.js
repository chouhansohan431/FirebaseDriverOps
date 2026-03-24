import { AppRegistry } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import App from './App';
import { name as appName } from './app.json';
import { displayRemoteNotification } from './src/services/localNotificationService';

messaging().setBackgroundMessageHandler(async remoteMessage => {
  if (remoteMessage) {
    console.log('[NOTIFICATION] background message received', {
      messageId: remoteMessage.messageId ?? null,
      from: remoteMessage.from ?? null,
      data: remoteMessage.data ?? {},
      hasNotificationPayload: Boolean(remoteMessage.notification),
    });
    await displayRemoteNotification(remoteMessage);
  }
});


AppRegistry.registerComponent(appName, () => App);
