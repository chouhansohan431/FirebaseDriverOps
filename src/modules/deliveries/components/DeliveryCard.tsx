import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Delivery } from '../../../types/models';
import { colors } from '../../../theme/colors';
import { radius, rs, spacing } from '../../../theme/responsive';

type Props = {
  item: Delivery;
};

function DeliveryCardComponent({ item }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.orderId}>Order: {item.orderId}</Text>
      <Text style={styles.text}>Customer: {item.customerName}</Text>
      <Text style={styles.text}>Address: {item.address}</Text>
      <View style={styles.statusPill}>
        <Text style={styles.status}>Status: {item.status}</Text>
      </View>
    </View>
  );
}

export const DeliveryCard = memo(DeliveryCardComponent);

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  orderId: { fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.xs, fontSize: rs(15) },
  text: { color: colors.textSecondary, marginBottom: spacing.xs, fontSize: rs(14) },
  statusPill: {
    marginTop: spacing.xs,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceMuted,
  },
  status: { fontWeight: '600', color: colors.primary, fontSize: rs(13) },
});
