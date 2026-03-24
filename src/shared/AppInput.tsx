import React from 'react';
import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import { colors } from '../theme/colors';
import { radius, rs, spacing } from '../theme/responsive';

type Props = TextInputProps;

export function AppInput(props: Props) {
  return (
    <View style={styles.wrapper}>
      <TextInput
        {...props}
        style={styles.input}
        placeholderTextColor="#6b7280"
        autoCapitalize="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.md },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    fontSize: rs(15),
  },
});
