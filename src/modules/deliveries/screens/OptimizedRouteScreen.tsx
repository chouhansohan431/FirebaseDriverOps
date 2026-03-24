import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { useAuthStore } from '../../../store/authStore';
import { AppButton } from '../../../shared/AppButton';
import { deliveryService } from '../../../services/deliveryService';
import { Delivery } from '../../../types/models';
import { colors } from '../../../theme/colors';
import { radius, rs, spacing } from '../../../theme/responsive';

type Stop = {
  id: string;
  label: string;
  lat: number;
  lng: number;
  status?: 'pending' | 'delivered';
  etaMinutes?: number;
  trafficMultiplier?: number;
};

const driverOrigin = { lat: 12.9716, lng: 77.5946 };
const MAPS_ENABLED = true;

export function OptimizedRouteScreen() {
  const user = useAuthStore(state => state.user);
  const [stops, setStops] = useState<Stop[]>([]);
  const [loading, setLoading] = useState(false);
  const [routeStart, setRouteStart] = useState(driverOrigin);
  const [isOptimized, setIsOptimized] = useState(false);

  const fetchPendingStops = (): Promise<Stop[]> =>
    new Promise((resolve, reject) => {
      if (!user?.uid) {
        resolve([]);
        return;
      }

      const unsubscribe = deliveryService.subscribeDriverDeliveries(
        user.uid,
        rows => {
          unsubscribe();
          const pending = rows.filter((delivery: Delivery) => delivery.status === 'pending');
          const routeStops = pending.map(delivery => ({
            id: delivery.id,
            label: delivery.customerName,
            lat: delivery.location.lat,
            lng: delivery.location.lng,
            status: delivery.status,
          }));
          resolve(routeStops);
        },
        error => {
          unsubscribe();
          reject(error);
        },
      );
    });

  const applyOptimizationResult = (
    routeStops: Stop[],
    optimizedData?: {
      orderedStopIds?: string[];
      legs?: Array<{ stopId: string; durationMinutes: number; trafficMultiplier: number }>;
    },
  ) => {
    if (!optimizedData?.orderedStopIds?.length) {
      setStops(routeStops);
      return;
    }

    const stopById = new Map(routeStops.map(stop => [stop.id, stop]));
    const legByStopId = new Map((optimizedData.legs ?? []).map(leg => [leg.stopId, leg]));

    const ordered = optimizedData.orderedStopIds
      .map(id => {
        const stop = stopById.get(id);
        if (!stop) {
          return null;
        }
        const leg = legByStopId.get(id);
        return {
          ...stop,
          etaMinutes: leg?.durationMinutes,
          trafficMultiplier: leg?.trafficMultiplier,
        };
      })
      .filter((stop): stop is Stop => Boolean(stop));

    setStops(ordered);
  };

  const loadRoute = async () => {
    if (!user?.uid) {
      return;
    }

    try {
      setLoading(true);
      const routeStops = await fetchPendingStops();
      if (!routeStops.length) {
        setStops([]);
        setRouteStart(driverOrigin);
        setIsOptimized(false);
        return;
      }
      const optimized = await deliveryService.optimizeRoute(routeStart, routeStops);
      applyOptimizationResult(routeStops, optimized?.data);
      setIsOptimized(true);
    } catch (error) {
      Alert.alert('Route optimization failed', (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const loadInitialStops = async () => {
      try {
        const routeStops = await fetchPendingStops();
        if (cancelled) {
          return;
        }
        setStops(routeStops);
        setRouteStart(driverOrigin);
        setIsOptimized(false);
      } catch (error) {
        if (!cancelled) {
          Alert.alert('Route error', (error as Error).message);
        }
      }
    };

    loadInitialStops().catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  const markDelivered = async (deliveryId: string) => {
    try {
      await deliveryService.markDelivered(deliveryId);
      const deliveredStop = stops.find(stop => stop.id === deliveryId);
      const nextOrigin = deliveredStop
        ? { lat: deliveredStop.lat, lng: deliveredStop.lng }
        : routeStart;
      const nextStops = stops.filter(stop => stop.id !== deliveryId);
      setRouteStart(nextOrigin);
      if (!isOptimized) {
        setStops(nextStops);
        return;
      }
      const optimized = await deliveryService.optimizeRoute(nextOrigin, nextStops);
      applyOptimizationResult(nextStops, optimized?.data);
    } catch (error) {
      Alert.alert('Update failed', (error as Error).message);
    }
  };

  const routeCoordinates = [
    { latitude: routeStart.lat, longitude: routeStart.lng },
    ...stops.map(stop => ({ latitude: stop.lat, longitude: stop.lng })),
  ];

  return (
    <View style={styles.container}>
      {MAPS_ENABLED ? (
        <MapView
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: driverOrigin.lat,
            longitude: driverOrigin.lng,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          showsUserLocation>
          <Marker
            coordinate={{ latitude: routeStart.lat, longitude: routeStart.lng }}
            title="Driver Current Location"
            pinColor="blue"
          />
          {stops.map(stop => (
            <Marker
              key={stop.id}
              coordinate={{ latitude: stop.lat, longitude: stop.lng }}
              title={stop.label}
              description={stop.status ?? 'pending'}
            />
          ))}
          {isOptimized && routeCoordinates.length >= 2 ? (
            <Polyline coordinates={routeCoordinates} strokeWidth={4} strokeColor="#2563eb" />
          ) : null}
        </MapView>
      ) : (
        <View style={styles.mapFallback}>
          <Text style={styles.mapFallbackTitle}>Map is disabled</Text>
          <Text style={styles.mapFallbackText}>
            Add Google Maps key in `android/app/src/main/res/values/strings.xml` and set `MAPS_ENABLED` to true.
          </Text>
        </View>
      )}

      <View style={styles.actions}>
        <AppButton label={loading ? 'Optimizing...' : 'Optimize Route'} loading={loading} onPress={loadRoute} />
      </View>

      <ScrollView style={styles.list}>
        {stops.map((stop, index) => (
          <View key={stop.id} style={styles.stopItem}>
            <Text style={styles.stopText}>
              {index + 1}. {stop.label}
            </Text>
            <Text style={styles.stopSubText}>
              Status: Pending | ETA: {stop.etaMinutes ?? '-'} min | Traffic x{stop.trafficMultiplier ?? '-'}
            </Text>
            <AppButton label="Delivered" onPress={() => markDelivered(stop.id)} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  map: { flex: 1 },
  mapFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surfaceMuted,
  },
  mapFallbackTitle: {
    fontSize: rs(18),
    fontWeight: '700',
    marginBottom: spacing.xs,
    color: colors.textPrimary,
  },
  mapFallbackText: {
    fontSize: rs(14),
    textAlign: 'center',
    color: colors.textSecondary,
  },
  actions: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  list: { maxHeight: rs(260), paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  stopItem: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
  },
  stopText: { marginBottom: spacing.sm, color: colors.textPrimary, fontWeight: '600', fontSize: rs(15) },
  stopSubText: { marginBottom: spacing.sm, color: colors.textSecondary, fontSize: rs(13) },
});
