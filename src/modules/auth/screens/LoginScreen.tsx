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

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const setUser = useAuthStore(state => state.setUser);
  const setPhoneVerified = useAuthStore(state => state.setPhoneVerified);
  const setOtpPending = useAuthStore(state => state.setOtpPending);
  const setBootstrapping = useAuthStore(state => state.setBootstrapping);

  const onLogin = async () => {
    if (!email || !password) {
      Alert.alert('Validation', 'Email and password are required');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Validation', 'Password must be at least 6 characters.');
      return;
    }

    try {
      setLoading(true);
      const credential = await authService.signInWithEmailPassword(email, password);
      const activeUser = credential.user;
      if (activeUser) {
        const profile = await authService.getUserProfile(activeUser.uid);
        const isPhoneVerified = Boolean(profile.phoneVerified);

        setUser({ uid: activeUser.uid, email: activeUser.email, name: profile.name });
        setPhoneVerified(isPhoneVerified);
        setOtpPending(!isPhoneVerified);
        setBootstrapping(false);

        if (!isPhoneVerified) {
          navigation.navigate('PhoneVerification', {
            phoneNumber: profile.phoneNumber ?? undefined,
            name: profile.name ?? undefined,
            email: activeUser.email ?? undefined,
          });
        }
      }
    } catch (error) {
      Alert.alert('Login failed', getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to continue your deliveries</Text>
        <AppInput value={email} onChangeText={setEmail} placeholder="Email" keyboardType="email-address" />
        <AppInput value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry />
        <AppButton label="Login" loading={loading} onPress={onLogin} />
        <Pressable onPress={() => navigation.navigate('Signup')} style={styles.secondaryAction}>
          <Text style={styles.secondaryText}>New user? Create account</Text>
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
  title: { fontSize: rs(26), fontWeight: '700', marginBottom: spacing.xs, color: colors.textPrimary },
  subtitle: { fontSize: rs(14), color: colors.textSecondary, marginBottom: spacing.lg },
  secondaryAction: { marginTop: spacing.md, alignItems: 'center' },
  secondaryText: { color: colors.primary, fontWeight: '600' },
});
