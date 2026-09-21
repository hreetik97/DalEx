import { StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors, floatShadow } from '../theme';

// Frosted glass card. Wraps children in a BlurView with a hairline
// highlight border and soft float shadow.
export default function GlassCard({ children, style, strong = false, intensity = 42 }) {
  return (
    <BlurView
      intensity={intensity}
      tint="dark"
      style={[styles.base, strong ? styles.strong : styles.card, floatShadow, style]}
    >
      {children}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  base: { borderWidth: 1, borderColor: colors.glassBorder, overflow: 'hidden' },
  card: {
    ...{
      backgroundColor: colors.glass,
      borderRadius: 26,
    },
  },
  strong: {
    backgroundColor: colors.glassStrong,
    borderRadius: 26,
  },
});
