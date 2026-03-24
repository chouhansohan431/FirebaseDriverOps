import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

admin.initializeApp();

export const onDeliveryAssigned = functions.firestore
  .document('deliveries/{deliveryId}')
  .onCreate(async (snapshot, context) => {
    const delivery = snapshot.data();
    const driverId = delivery.assignedDriverId as string;

    if (!driverId) {
      return null;
    }

    const userDoc = await admin.firestore().collection('users').doc(driverId).get();
    const tokens = (userDoc.data()?.fcmTokens ?? []) as string[];

    if (!tokens.length) {
      return null;
    }

    await admin.messaging().sendEachForMulticast({
      tokens,
      notification: {
        title: 'New Delivery Assigned',
        body: `${delivery.customerName} - ${delivery.address}`,
      },
      data: {
        target: 'deliveries',
        deliveryId: context.params.deliveryId,
      },
    });

    return null;
  });

export const optimizeRoute = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Unauthorized');
  }

  const { stops } = data as {
    origin: { lat: number; lng: number };
    stops: Array<{ id: string; lat: number; lng: number }>;
  };

  return {
    orderedStopIds: stops.map(stop => stop.id),
  };
});
