import { View, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

export default function InsightCard({ title, body, icon = 'bulb-outline', accent = colors.amber }) {
  return (
    <BlurView intensity={30} tint="dark" style={styles.card}>
      <View style={[styles.icon, { backgroundColor: accent + '22' }]}>
        <Ionicons name={icon} size={18} color={accent} />
      </View>
      <View style={styles.text}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
      </View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: 22,
    padding: 15,
    marginBottom: 10,
    overflow: 'hidden',
  },
  icon: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  text: { flex: 1 },
  title: { fontSize: 14.5, fontWeight: '700', color: colors.ink, marginBottom: 4, letterSpacing: -0.1 },
  body: { fontSize: 13.5, color: colors.muted, lineHeight: 19 },
});
