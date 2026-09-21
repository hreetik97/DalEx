// Shared tab-screen chrome (apps/mobile/src/app/(tabs)/_shared.tsx).
// Underscore prefix: not a route. Used by the Insights/Budgets/Bills/
// History/Settings screens. Keeps the approved Liquid Glass chrome in one place.
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';
import GlassBackground from '../../components/GlassBackground';

export function TabScreen({
  title,
  subtitle,
  children,
  scroll = true,
  overlay,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  scroll?: boolean;
  /** Rendered outside the scroll view, over the root (e.g. a FAB). */
  overlay?: React.ReactNode;
}) {
  const body = (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {children}
      <View style={{ height: 150 }} />
    </View>
  );
  return (
    <View style={styles.root}>
      <GlassBackground />
      <SafeAreaView style={styles.safe} edges={['top']}>
        {scroll ? (
          <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
            {body}
          </ScrollView>
        ) : (
          body
        )}
      </SafeAreaView>
      {overlay}
    </View>
  );
}

export function EmptyState({
  icon = 'telescope-outline',
  title,
  body,
}: {
  icon?: string;
  title: string;
  body: string;
}) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon as never} size={26} color={colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
    </View>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <Text style={styles.section}>{children}</Text>;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  container: { padding: 20, flexGrow: 1 },
  title: { fontSize: 26, fontWeight: '800', color: colors.ink, letterSpacing: -0.5 },
  subtitle: { fontSize: 13.5, color: colors.muted, marginTop: 3, marginBottom: 18 },
  section: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.ink,
    letterSpacing: -0.2,
    marginTop: 20,
    marginBottom: 10,
  },
  empty: { alignItems: 'center', paddingVertical: 44, paddingHorizontal: 32 },
  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(52,211,153,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(52,211,153,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: { fontSize: 16.5, fontWeight: '800', color: colors.ink, marginBottom: 6, textAlign: 'center' },
  emptyBody: { fontSize: 13.5, color: colors.muted, textAlign: 'center', lineHeight: 20 },
});
