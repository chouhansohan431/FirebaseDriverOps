import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../../app/navigation/types';
import { AppButton } from '../../../shared/AppButton';
import { authService } from '../../../services/authService';
import { getAuthErrorMessage } from '../../../utils/authErrorMessage';
import { colors } from '../../../theme/colors';
import { radius, rs, spacing } from '../../../theme/responsive';

type Props = NativeStackScreenProps<AuthStackParamList, 'PhoneVerification'>;
const DUMMY_PHONE_NUMBER = '1234567890';

export function PhoneVerificationScreen({ navigation, route }: Props) {
  const [loading, setLoading] = useState(false);

  const onSendOtp = async () => {
    try {
      setLoading(true);
      const confirmation = await authService.sendDummyOtp(DUMMY_PHONE_NUMBER);
      navigation.navigate('OtpVerify', {
        verificationId: confirmation.verificationId,
        phoneNumber: DUMMY_PHONE_NUMBER,
        name: route.params?.name,
        email: route.params?.email,
      });
    } catch (error) {
      Alert.alert('OTP failed', getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Verify phone number</Text>
        <Text style={styles.subtitle}>Dummy verification mode is enabled for all users.</Text>
        <Text style={styles.hint}>Phone: {DUMMY_PHONE_NUMBER}</Text>
        <AppButton label="Continue to OTP" loading={loading} onPress={onSendOtp} />
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
  subtitle: { fontSize: rs(14), color: colors.textSecondary, marginBottom: spacing.lg },
  hint: { marginBottom: spacing.md, color: colors.primary, fontWeight: '600' },
});
