import React from 'react';
import { DeliveriesScreen } from './DeliveriesScreen';

export function DeliveredOrdersScreen() {
  return (
    <DeliveriesScreen
      statusFilter="delivered"
      title="Delivered Orders"
      subtitle="Review all completed deliveries"
    />
  );
}
