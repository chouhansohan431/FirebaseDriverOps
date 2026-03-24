import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../../app/navigation/types';
import { AppInput } from '../../../shared/AppInput';
import { AppButton } from '../../../shared/AppButton';
import { authService } from '../../../services/authService';
import { getAuthErrorMessage } from '../../../utils/authErrorMessage';
import { useAuthStore } from '../../../store/authStore';
import { colors } from '../../../theme/colors';
import { radius, rs, spacing } from '../../../theme/responsive';

type Props = NativeStackScreenProps<AuthStackParamList, 'Signup'>;

export function SignupScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const setUser = useAuthStore(state => state.setUser);
  const setPhoneVerified = useAuthStore(state => state.setPhoneVerified);
  const setOtpPending = useAuthStore(state => state.setOtpPending);
  const setBootstrapping = useAuthStore(state => state.setBootstrapping);

  const onSignup = async () => {
    if (!name.trim() || !email.trim() || !phoneNumber.trim() || !password) {
      Alert.alert('Validation', 'Name, email, phone number, and password are required.');
      return;
    }
    if (!/^\d{10}$/.test(phoneNumber.trim())) {
      Alert.alert('Validation', 'Phone number must be exactly 10 digits.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Validation', 'Password must be at least 6 characters.');
      return;
    }

    try {
      setLoading(true);
      const credential = await authService.signUpWithEmailPassword(name, email, password, phoneNumber);
      const activeUser = credential.user;
      if (activeUser) {
        setUser({ uid: activeUser.uid, email: activeUser.email, name: name.trim() });
        setPhoneVerified(false);
        setOtpPending(true);
        setBootstrapping(false);
        navigation.navigate('PhoneVerification', {
          phoneNumber: phoneNumber.trim(),
          name: name.trim(),
          email: activeUser.email ?? email.trim(),
        });
      }
    } catch (error) {
      Alert.alert('Signup failed', getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Create account</Text>
        <Text style={styles.subtitle}>Register with email first, then verify phone using OTP</Text>
        <AppInput value={name} onChangeText={setName} placeholder="Full name" />
        <AppInput value={email} onChangeText={setEmail} placeholder="Email" keyboardType="email-address" />
        <AppInput value={phoneNumber} onChangeText={setPhoneNumber} placeholder="10-digit phone number" keyboardType="phone-pad" />
        <AppInput value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry />
        <AppButton label="Sign up" loading={loading} onPress={onSignup} />
        <Pressable onPress={() => navigation.navigate('Login')} style={styles.secondaryAction}>
          <Text style={styles.secondaryText}>Already have an account? Log in</Text>
        </Pressable>
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
  secondaryAction: { marginTop: spacing.md, alignItems: 'center' },
  secondaryText: { color: colors.primary, fontWeight: '600' },
});
