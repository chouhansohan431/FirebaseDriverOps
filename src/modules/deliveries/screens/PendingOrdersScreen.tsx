import React from 'react';
import { DeliveriesScreen } from './DeliveriesScreen';

export function PendingOrdersScreen() {
  return (
    <DeliveriesScreen
      statusFilter="pending"
      title="Pending Orders"
      subtitle="Track pending deliveries and optimize your route"
      showOptimizeButton
    />
  );
}
