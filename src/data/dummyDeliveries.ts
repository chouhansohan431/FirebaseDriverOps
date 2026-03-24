import { Delivery } from '../types/models';

type SeedDelivery = Omit<Delivery, 'id' | 'assignedDriverId'>;

const BASE_DUMMY_DELIVERIES: SeedDelivery[] = [
  {
    orderId: 'ORD-1001',
    customerName: 'Rahul Sharma',
    address: 'MG Road, Bengaluru',
    status: 'pending',
    location: { lat: 12.9752, lng: 77.6055 },
  },
  {
    orderId: 'ORD-1002',
    customerName: 'Priya Verma',
    address: 'Koramangala 5th Block, Bengaluru',
    status: 'pending',
    location: { lat: 12.9352, lng: 77.6245 },
  },
  {
    orderId: 'ORD-1003',
    customerName: 'Aman Gupta',
    address: 'Indiranagar 100 Feet Road, Bengaluru',
    status: 'delivered',
    location: { lat: 12.9719, lng: 77.6412 },
  },
  {
    orderId: 'ORD-1004',
    customerName: 'Neha Singh',
    address: 'HSR Layout Sector 2, Bengaluru',
    status: 'pending',
    location: { lat: 12.9116, lng: 77.6474 },
  },
];

export function buildDummyDeliveriesForDriver(driverId: string): Delivery[] {
  return BASE_DUMMY_DELIVERIES.map((delivery, index) => ({
    id: `dummy-${index + 1}`,
    assignedDriverId: driverId,
    ...delivery,
  }));
}
