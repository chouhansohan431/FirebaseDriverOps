import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { useAuthStore } from '../../../store/authStore';
import { deliveryService } from '../../../services/deliveryService';
import { Delivery } from '../../../types/models';
import { DeliveryCard } from '../components/DeliveryCard';
import { AppButton } from '../../../shared/AppButton';
import { colors } from '../../../theme/colors';
import { radius, rs, spacing } from '../../../theme/responsive';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../../app/navigation/types';

const ITEM_HEIGHT = 110;

type Props = {
  statusFilter: Delivery['status'];
  title: string;
  subtitle: string;
  showOptimizeButton?: boolean;
};

export function DeliveriesScreen({ statusFilter, title, subtitle, showOptimizeButton = false }: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const user = useAuthStore(state => state.user);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const unsub = deliveryService.subscribeDriverDeliveries(
      user.uid,
      rows => {
        setDeliveries(rows.filter(row => row.status === statusFilter));
        setLoading(false);
      },
      error => {
        Alert.alert('Delivery error', error.message);
        setLoading(false);
      },
    );

    return unsub;
  }, [statusFilter, user?.uid]);

  const renderItem = useCallback(({ item }: { item: Delivery }) => <DeliveryCard item={item} />, []);
  const keyExtractor = useCallback((item: Delivery) => item.id, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Assigned Deliveries</Text>
      <Text style={styles.heading}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      <FlatList
        data={deliveries}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        refreshing={loading}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={7}
        removeClippedSubviews
        contentContainerStyle={styles.listContent}
        getItemLayout={(_, index) => ({
          length: ITEM_HEIGHT,
          offset: ITEM_HEIGHT * index,
          index,
        })}
      />

      <View style={styles.footer}>
        {showOptimizeButton ? (
          <AppButton label="View Route" onPress={() => navigation.navigate('OptimizedRoute')} />
        ) : (
          <Text style={styles.footerHint}>Delivered orders update in real time.</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: spacing.md, backgroundColor: colors.background },
  title: {
    fontSize: rs(14),
    fontWeight: '600',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xs,
    color: colors.textSecondary,
  },
  heading: {
    fontSize: rs(24),
    fontWeight: '700',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xs,
    color: colors.textPrimary,
  },
  subtitle: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    color: colors.textSecondary,
    fontSize: rs(14),
  },
  listContent: {
    paddingBottom: spacing.md,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  footerHint: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: rs(13),
    paddingVertical: spacing.xs,
  },
});
