// Add-expense route (apps/mobile/src/app/add.tsx). Modal-style screen with its
// own header; the root Stack hides headers globally.
import { View, Text, Pressable, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import { useAuth } from '../data/auth';
import AddTransactionForm from '../components/AddTransactionForm';
import GlassBackground from '../components/GlassBackground';

export default function AddExpenseScreen() {
  const { user } = useAuth();

  return (
    <View style={styles.root}>
      <GlassBackground />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <KeyboardAvoidingView
          style={styles.safe}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.header}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={12}
              style={styles.backBtn}
              accessibilityRole="button"
              accessibilityLabel="Back"
            >
              <Ionicons name="chevron-back" size={22} color={colors.ink} />
            </Pressable>
            <Text style={styles.title}>Add expense</Text>
            <View style={styles.backBtn} />
          </View>
          <ScrollView
            contentContainerStyle={styles.container}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {user ? (
              <AddTransactionForm uid={user.uid} onSuccess={() => router.back()} />
            ) : (
              <Text style={styles.signedOut}>Sign in to add expenses.</Text>
            )}
            <View style={{ height: 60 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: { width: 40, alignItems: 'flex-start' },
  title: { fontSize: 18, fontWeight: '800', color: colors.ink, letterSpacing: -0.3 },
  container: { paddingHorizontal: 20, paddingTop: 4 },
  signedOut: { fontSize: 14, color: colors.muted, marginTop: 24 },
});
