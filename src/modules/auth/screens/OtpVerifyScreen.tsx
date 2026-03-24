import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../../app/navigation/types';
import { AppInput } from '../../../shared/AppInput';
import { AppButton } from '../../../shared/AppButton';
import { authService } from '../../../services/authService';
import { auth } from '../../../services/firebase';
import { getAuthErrorMessage } from '../../../utils/authErrorMessage';
import { useAuthStore } from '../../../store/authStore';
import { colors } from '../../../theme/colors';
import { radius, rs, spacing } from '../../../theme/responsive';

type Props = NativeStackScreenProps<AuthStackParamList, 'OtpVerify'>;

export function OtpVerifyScreen({ route }: Props) {
  const { phoneNumber, name } = route.params;
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const setUser = useAuthStore(state => state.setUser);
  const setPhoneVerified = useAuthStore(state => state.setPhoneVerified);
  const setOtpPending = useAuthStore(state => state.setOtpPending);
  const setBootstrapping = useAuthStore(state => state.setBootstrapping);

  const onVerify = async () => {
    if (!code) {
      Alert.alert('Validation', 'OTP is required');
      return;
    }

    try {
      setLoading(true);
      await authService.verifyDummyOtp(phoneNumber, code);
      const active = auth().currentUser;
      if (active) {
        setUser({ uid: active.uid, email: active.email, name: name ?? null });
      }
      setPhoneVerified(true);
      setOtpPending(false);
      setBootstrapping(false);
    } catch (error) {
      Alert.alert('Verification failed', getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Enter OTP</Text>
        <Text style={styles.subtitle}>Dummy OTP mode is enabled</Text>
        <Text style={styles.hint}>Use OTP: 123456</Text>
        <AppInput value={code} onChangeText={setCode} placeholder="6-digit code" keyboardType="number-pad" />
        <AppButton label="Verify OTP" loading={loading} onPress={onVerify} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, justifyContent: 'center', backgroundColor: colors.background },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { fontSize: rs(24), fontWeight: '700', marginBottom: spacing.xs, color: colors.textPrimary },
  subtitle: { fontSize: rs(14), color: colors.textSecondary, marginBottom: spacing.sm },
  hint: { marginBottom: spacing.sm, color: colors.primary, fontWeight: '600' },
});
