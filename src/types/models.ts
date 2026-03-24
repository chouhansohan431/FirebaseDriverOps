import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

export interface AppUser {
  uid: string;
  email: string | null;
  name?: string | null;
}

export type DeliveryStatus = 'pending' | 'delivered';
export type OrderStatus = 'pending' | 'accepted' | 'on_the_way' | 'delivered';

export interface Delivery {
  id: string;
  orderId: string;
  customerName: string;
  address: string;
  assignedDriverId: string;
  status: DeliveryStatus;
  location: {
    lat: number;
    lng: number;
  };
  updatedAt?: FirebaseFirestoreTypes.Timestamp;
}

export interface OrderLocation {
  lat: number;
  lng: number;
}

export interface Order {
  id: string;
  assignedDriverId: string;
  orderId: string;
  customerName: string;
  address: string;
  status: OrderStatus;
  location: OrderLocation;
  updatedAt?: FirebaseFirestoreTypes.Timestamp;
}
