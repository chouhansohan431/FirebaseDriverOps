import { firestore } from './firebase';
import { Order, OrderLocation, OrderStatus } from '../types/models';

const ORDERS_COLLECTION = 'orders';
const ORDER_STATUSES: ReadonlyArray<OrderStatus> = ['pending', 'accepted', 'on_the_way', 'delivered'];

type CreateOrderInput = {
  assignedDriverId: string;
  orderId: string;
  customerName: string;
  address: string;
  status: OrderStatus;
  location: OrderLocation;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isValidLatitude(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= -90 && value <= 90;
}

function isValidLongitude(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= -180 && value <= 180;
}

function assertValidOrderInput(input: CreateOrderInput): void {
  if (!isNonEmptyString(input.assignedDriverId)) {
    throw new Error('assignedDriverId is required');
  }
  if (!isNonEmptyString(input.orderId)) {
    throw new Error('orderId is required');
  }
  if (!isNonEmptyString(input.customerName)) {
    throw new Error('customerName is required');
  }
  if (!isNonEmptyString(input.address)) {
    throw new Error('address is required');
  }
  if (!ORDER_STATUSES.includes(input.status)) {
    throw new Error('status must be one of: pending, accepted, on_the_way, delivered');
  }
  if (!input.location || !isValidLatitude(input.location.lat) || !isValidLongitude(input.location.lng)) {
    throw new Error('location must include valid lat and lng values');
  }
}

function normalizeFirestoreError(error: unknown, fallbackMessage: string): Error {
  if (error instanceof Error && error.message) {
    return error;
  }
  return new Error(fallbackMessage);
}

export const ordersService = {
  async createOrder(input: CreateOrderInput): Promise<string> {
    try {
      assertValidOrderInput(input);

      const docRef = await firestore().collection(ORDERS_COLLECTION).add({
        assignedDriverId: input.assignedDriverId.trim(),
        orderId: input.orderId.trim(),
        customerName: input.customerName.trim(),
        address: input.address.trim(),
        status: input.status,
        location: {
          lat: input.location.lat,
          lng: input.location.lng,
        },
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

      return docRef.id;
    } catch (error) {
      throw normalizeFirestoreError(error, 'Failed to create order');
    }
  },

  async updateOrderStatus(orderDocId: string, status: OrderStatus): Promise<void> {
    try {
      if (!isNonEmptyString(orderDocId)) {
        throw new Error('order document id is required');
      }
      if (!ORDER_STATUSES.includes(status)) {
        throw new Error('status must be one of: pending, accepted, on_the_way, delivered');
      }

      await firestore().collection(ORDERS_COLLECTION).doc(orderDocId).update({
        status,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      throw normalizeFirestoreError(error, 'Failed to update order status');
    }
  },

  subscribeDriverOrders(
    driverId: string,
    onData: (orders: Order[]) => void,
    onError: (error: Error) => void,
    options?: { limit?: number },
  ): () => void {
    if (!isNonEmptyString(driverId)) {
      throw new Error('driverId is required');
    }

    const query = firestore()
      .collection(ORDERS_COLLECTION)
      .where('assignedDriverId', '==', driverId.trim())
      .orderBy('updatedAt', 'desc')
      .limit(options?.limit ?? 100);

    return query.onSnapshot(
      snapshot => {
        const orders = snapshot.docs.map(
          doc =>
            ({
              id: doc.id,
              ...(doc.data() as Omit<Order, 'id'>),
            }) satisfies Order,
        );
        onData(orders);
      },
      error => {
        onError(normalizeFirestoreError(error, 'Failed to subscribe to orders'));
      },
    );
  },
};

export type { CreateOrderInput };
