import { firestore, functions } from './firebase';
import { Delivery } from '../types/models';
import { buildDummyDeliveriesForDriver } from '../data/dummyDeliveries';

const deliveriesCollection = firestore().collection('deliveries');
const USE_DUMMY_DELIVERIES = true

const deliveryStoreByDriver = new Map<string, Delivery[]>();
const listenersByDriver = new Map<string, Set<(deliveries: Delivery[]) => void>>();

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function distanceInKm(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
): number {
  const earthRadiusKm = 6371;
  const dLat = toRadians(to.lat - from.lat);
  const dLng = toRadians(to.lng - from.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(from.lat)) *
      Math.cos(toRadians(to.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

function getTrafficMultiplier(stop: { id: string; lat: number; lng: number }): number {
  const hashBase = Math.abs(Math.round((stop.lat + stop.lng) * 1000)) + stop.id.length;
  const bucket = hashBase % 3;
  if (bucket === 0) {
    return 1.0;
  }
  if (bucket === 1) {
    return 1.2;
  }
  return 1.45;
}

function getDriverDeliveries(driverId: string): Delivery[] {
  const existing = deliveryStoreByDriver.get(driverId);
  if (existing) {
    return existing;
  }

  const seeded = buildDummyDeliveriesForDriver(driverId);
  deliveryStoreByDriver.set(driverId, seeded);
  return seeded;
}

function emitDriverDeliveries(driverId: string) {
  const listeners = listenersByDriver.get(driverId);
  if (!listeners?.size) {
    return;
  }

  const snapshot = [...getDriverDeliveries(driverId)];
  listeners.forEach(listener => listener(snapshot));
}

export const deliveryService = {
  subscribeDriverDeliveries(
    driverId: string,
    onData: (deliveries: Delivery[]) => void,
    onError: (error: Error) => void,
  ) {
    if (USE_DUMMY_DELIVERIES) {
      const listeners = listenersByDriver.get(driverId) ?? new Set<(deliveries: Delivery[]) => void>();
      listeners.add(onData);
      listenersByDriver.set(driverId, listeners);

      setTimeout(() => onData([...getDriverDeliveries(driverId)]), 0);

      return () => {
        const current = listenersByDriver.get(driverId);
        if (!current) {
          return;
        }
        current.delete(onData);
        if (!current.size) {
          listenersByDriver.delete(driverId);
        }
      };
    }

    return deliveriesCollection
      .where('assignedDriverId', '==', driverId)
      .orderBy('updatedAt', 'desc')
      .onSnapshot(
        snapshot => {
          const items = snapshot.docs.map(doc => ({
            id: doc.id,
            ...(doc.data() as Omit<Delivery, 'id'>),
          }));
          onData(items);
        },
        error => onError(error as Error),
      );
  },

  markDelivered(deliveryId: string) {
    if (USE_DUMMY_DELIVERIES) {
      let touchedDriverId: string | null = null;
      deliveryStoreByDriver.forEach((deliveries, driverId) => {
        const index = deliveries.findIndex(delivery => delivery.id === deliveryId);
        if (index === -1) {
          return;
        }

        touchedDriverId = driverId;
        deliveries[index] = { ...deliveries[index], status: 'delivered' };
      });

      if (touchedDriverId) {
        emitDriverDeliveries(touchedDriverId);
      }

      return Promise.resolve();
    }

    return deliveriesCollection.doc(deliveryId).update({
      status: 'delivered',
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
  },

  optimizeRoute(origin: { lat: number; lng: number }, stops: Array<{ id: string; lat: number; lng: number }>) {
    if (USE_DUMMY_DELIVERIES) {
      const remaining = [...stops];
      const orderedStopIds: string[] = [];
      const legs: Array<{
        stopId: string;
        distanceKm: number;
        durationMinutes: number;
        trafficMultiplier: number;
      }> = [];

      let cursor = { ...origin };

      while (remaining.length) {
        let bestIdx = 0;
        let bestScore = Number.POSITIVE_INFINITY;
        let bestDistanceKm = 0;
        let bestTrafficMultiplier = 1;
        let bestDurationMinutes = 0;

        remaining.forEach((candidate, idx) => {
          const distanceKm = distanceInKm(cursor, candidate);
          const trafficMultiplier = getTrafficMultiplier(candidate);
          const etaMinutes = (distanceKm / 28) * 60 * trafficMultiplier;
          const score = etaMinutes * 0.6 + trafficMultiplier * 0.3 + distanceKm * 0.1;

          if (score < bestScore) {
            bestScore = score;
            bestIdx = idx;
            bestDistanceKm = distanceKm;
            bestTrafficMultiplier = trafficMultiplier;
            bestDurationMinutes = etaMinutes;
          }
        });

        const best = remaining.splice(bestIdx, 1)[0];
        orderedStopIds.push(best.id);
        legs.push({
          stopId: best.id,
          distanceKm: Number(bestDistanceKm.toFixed(2)),
          durationMinutes: Number(bestDurationMinutes.toFixed(1)),
          trafficMultiplier: Number(bestTrafficMultiplier.toFixed(2)),
        });
        cursor = { lat: best.lat, lng: best.lng };
      }

      return Promise.resolve({
        data: {
          origin,
          orderedStopIds,
          legs,
        },
      });
    }

    const callable = functions().httpsCallable('optimizeRoute');
    return callable({ origin, stops });
  },
};
