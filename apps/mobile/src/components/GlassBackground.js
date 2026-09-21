import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme';

// Ambient luminous background: deep dark canvas with soft color orbs.
// Render once at the root of each screen, behind everything.
export default function GlassBackground() {
  return (
    <View style={styles.root} pointerEvents="none">
      <LinearGradient
        colors={[colors.orbMint, 'transparent']}
        style={[styles.orb, styles.orbTop]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
      />
      <LinearGradient
        colors={[colors.orbIndigo, 'transparent']}
        style={[styles.orb, styles.orbRight]}
        start={{ x: 1, y: 0.3 }}
        end={{ x: 0, y: 0.9 }}
      />
      <LinearGradient
        colors={[colors.orbRose, 'transparent']}
        style={[styles.orb, styles.orbBottom]}
        start={{ x: 0.5, y: 1 }}
        end={{ x: 0.5, y: 0 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.bg,
  },
  orb: {
    position: 'absolute',
    width: 340,
    height: 340,
    borderRadius: 170,
    opacity: 0.5,
  },
  orbTop: { top: -110, left: -90 },
  orbRight: { top: 120, right: -140 },
  orbBottom: { bottom: -140, left: 40 },
});
