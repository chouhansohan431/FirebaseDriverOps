import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../../../shared/AppButton';
import { useAuthStore } from '../../../store/authStore';
import { authService } from '../../../services/authService';
import { colors } from '../../../theme/colors';
import { radius, rs, spacing } from '../../../theme/responsive';

export function ProfileScreen() {
  const user = useAuthStore(state => state.user);
  const setUser = useAuthStore(state => state.setUser);
  const setPhoneVerified = useAuthStore(state => state.setPhoneVerified);
  const setOtpPending = useAuthStore(state => state.setOtpPending);
  const [loading, setLoading] = useState(false);

  const onLogout = async () => {
    try {
      setLoading(true);
      await authService.signOut();
      setUser(null);
      setPhoneVerified(false);
      setOtpPending(false);
    } catch (error) {
      Alert.alert('Logout failed', (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.label}>Logged in as</Text>
        <Text style={styles.value}>{user?.email ?? 'Unknown user'}</Text>
      </View>
      <View style={styles.footer}>
        <AppButton label="Log out" loading={loading} onPress={onLogout} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, justifyContent: 'space-between', backgroundColor: colors.background },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  title: { fontSize: rs(24), fontWeight: '700', color: colors.textPrimary },
  label: { marginTop: spacing.lg, color: colors.textSecondary },
  value: { marginTop: spacing.xs, fontSize: rs(16), fontWeight: '600', color: colors.textPrimary },
  footer: { marginBottom: spacing.sm },
});
