// Bills on live Firestore data (apps/mobile/src/app/(tabs)/bills.tsx).
// Full CRUD on bills/{id}: due-day countdown computed in IST, autopay
// toggles, subscriptions section. Autopay is display-only in V1 —
// no money moves.
import { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, Pressable, Modal, TextInput,
  KeyboardAvoidingView, Platform, Alert, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { toPaise, CATEGORIES } from '@dalex/shared';
import { colors } from '../../theme';
import GlassCard from '../../components/GlassCard';
import { useAuth } from '../../data/auth';
import { watchBills, addBill, updateBill, deleteBill } from '../../data/bills';
import type { Bill, Category, NewBill } from '../../data/types';
import { categoryMeta } from '../../categoryMeta';
import { inrPaise } from '../../money';
import { TabScreen, EmptyState, SectionLabel } from './_shared';

function istToday(): { day: number; month: number; year: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 1);
  return { day: get('day'), month: get('month'), year: get('year') };
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Days until the next occurrence of dueDay, computed in Asia/Kolkata. */
function daysUntilDue(dueDay: number): number {
  const t = istToday();
  const thisMonthDue = Math.min(dueDay, daysInMonth(t.year, t.month));
  if (thisMonthDue >= t.day) return thisMonthDue - t.day;
  const nm = t.month === 12 ? 1 : t.month + 1;
  const ny = t.month === 12 ? t.year + 1 : t.year;
  const nextMonthDue = Math.min(dueDay, daysInMonth(ny, nm));
  return daysInMonth(t.year, t.month) - t.day + nextMonthDue;
}

function dueLabel(dueDay: number): { text: string; urgent: boolean } {
  const d = daysUntilDue(dueDay);
  if (d === 0) return { text: 'Due today', urgent: true };
  if (d === 1) return { text: 'Due tomorrow', urgent: true };
  if (d <= 5) return { text: `Due in ${d} days`, urgent: true };
  return { text: `Due in ${d} days`, urgent: false };
}

interface BillForm {
  name: string;
  amount: string;
  dueDay: string;
  category: Category;
  autopay: boolean;
  isSubscription: boolean;
}

const EMPTY_FORM: BillForm = {
  name: '',
  amount: '',
  dueDay: '',
  category: 'bills',
  autopay: false,
  isSubscription: false,
};

export default function BillsScreen() {
  const { user } = useAuth();
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BillForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    return watchBills(
      user.uid,
      (b) => {
        setBills(b);
        setLoading(false);
      },
      () => setLoading(false)
    );
  }, [user]);

  const { regular, subscriptions, upcomingTotal } = useMemo(() => {
    const regular = bills.filter((b) => !b.isSubscription);
    const subscriptions = bills.filter((b) => b.isSubscription);
    const upcomingTotal = bills
      .filter((b) => daysUntilDue(b.dueDay) <= 7)
      .reduce((s, b) => s + b.amountPaise, 0);
    return { regular, subscriptions, upcomingTotal };
  }, [bills]);

  function openAdd() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  }

  function openEdit(b: Bill) {
    setEditingId(b.id);
    setForm({
      name: b.name,
      amount: String(Math.round(b.amountPaise / 100)),
      dueDay: String(b.dueDay),
      category: b.category,
      autopay: b.autopay,
      isSubscription: b.isSubscription ?? false,
    });
    setFormOpen(true);
  }

  async function save() {
    if (!user) return;
    const name = form.name.trim();
    const paise = toPaise(form.amount.trim() === '' ? '0' : form.amount);
    const dueDay = Number(form.dueDay);
    if (!name) {
      Alert.alert('Missing name', 'Give the bill a name, e.g. Electricity.');
      return;
    }
    if (paise === null || paise < 0) {
      Alert.alert('Invalid amount', 'Enter a valid rupee amount.');
      return;
    }
    if (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31) {
      Alert.alert('Invalid due day', 'Due day must be between 1 and 31.');
      return;
    }
    const input: NewBill = {
      name,
      amountPaise: paise,
      dueDay,
      category: form.category,
      autopay: form.autopay,
      isSubscription: form.isSubscription,
    };
    setSaving(true);
    try {
      if (editingId) {
        await updateBill(user.uid, editingId, input);
      } else {
        await addBill(user.uid, input);
      }
      setFormOpen(false);
    } catch (e) {
      Alert.alert('Could not save', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete(b: Bill) {
    Alert.alert('Delete bill?', `"${b.name}" will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => user && deleteBill(user.uid, b.id).catch(() => {}),
      },
    ]);
  }

  function renderBill(b: Bill) {
    const meta = categoryMeta(b.category);
    const due = dueLabel(b.dueDay);
    return (
      <GlassCard key={b.id} style={styles.row}>
        <View style={styles.rowHead}>
          <View style={[styles.icon, { backgroundColor: meta.hue + '22' }]}>
            <Ionicons name={meta.glyph as never} size={17} color={meta.hue} />
          </View>
          <View style={styles.rowText}>
            <Text style={styles.rowName} numberOfLines={1}>
              {b.name}
            </Text>
            <Text style={[styles.due, due.urgent && styles.dueUrgent]}>{due.text}</Text>
          </View>
          <View style={styles.rowAmt}>
            <Text style={styles.amt}>{inrPaise(b.amountPaise)}</Text>
            <Text style={styles.dueDay}>day {b.dueDay}</Text>
          </View>
        </View>
        <View style={styles.rowFoot}>
          <Pressable
            style={styles.footBtn}
            onPress={() =>
              user && updateBill(user.uid, b.id, { autopay: !b.autopay }).catch(() => {})
            }
            accessibilityRole="switch"
            accessibilityLabel={`Autopay for ${b.name}`}
            accessibilityState={{ checked: b.autopay }}
          >
            <Ionicons
              name={b.autopay ? 'checkmark-circle' : 'ellipse-outline'}
              size={17}
              color={b.autopay ? colors.primary : colors.faint}
            />
            <Text style={[styles.footText, b.autopay && styles.footTextOn]}>Autopay</Text>
          </Pressable>
          <Pressable
            style={styles.footBtn}
            onPress={() => openEdit(b)}
            accessibilityRole="button"
            accessibilityLabel={`Edit bill ${b.name}`}
          >
            <Ionicons name="pencil-outline" size={15} color={colors.faint} />
            <Text style={styles.footText}>Edit</Text>
          </Pressable>
          <Pressable
            style={styles.footBtn}
            onPress={() => confirmDelete(b)}
            accessibilityRole="button"
            accessibilityLabel={`Delete bill ${b.name}`}
          >
            <Ionicons name="trash-outline" size={15} color={colors.faint} />
            <Text style={styles.footText}>Delete</Text>
          </Pressable>
        </View>
      </GlassCard>
    );
  }

  return (
    <TabScreen
      title="Bills"
      subtitle={
        bills.length > 0
          ? `${inrPaise(upcomingTotal)} due in the next 7 days`
          : 'Never miss a due date'
      }
      overlay={
        <Pressable
          style={styles.fab}
          onPress={openAdd}
          accessibilityRole="button"
          accessibilityLabel="Add a bill"
        >
          <Ionicons name="add" size={26} color="#05281C" />
        </Pressable>
      }
    >
      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : bills.length === 0 ? (
        <EmptyState
          icon="receipt-outline"
          title="No bills tracked"
          body="Add rent, electricity, credit-card dues — Hisab will count down to each due date."
        />
      ) : (
        <>
          {regular.length > 0 && <SectionLabel>Upcoming bills</SectionLabel>}
          {regular.map(renderBill)}
          {subscriptions.length > 0 && (
            <>
              <SectionLabel>Subscriptions</SectionLabel>
              {subscriptions.map(renderBill)}
            </>
          )}
        </>
      )}

      <Pressable
        style={styles.fab}
        onPress={openAdd}
        accessibilityRole="button"
        accessibilityLabel="Add a bill"
      >
        <Ionicons name="add" size={26} color="#05281C" />
      </Pressable>

      <Modal visible={formOpen} transparent animationType="slide" onRequestClose={() => setFormOpen(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.sheetWrap}
        >
          <Pressable
            style={styles.sheetBackdrop}
            onPress={() => setFormOpen(false)}
            accessibilityRole="button"
            accessibilityLabel="Close bill form"
          />
          <GlassCard strong intensity={70} style={styles.sheet}>
            <View style={styles.grabber} />
            <Text style={styles.sheetTitle}>{editingId ? 'Edit bill' : 'Add bill'}</Text>

            <Text style={styles.label}>NAME</Text>
            <TextInput
              value={form.name}
              onChangeText={(v) => setForm({ ...form, name: v })}
              placeholder="Electricity"
              placeholderTextColor={colors.faint}
              style={styles.input}
            />

            <View style={styles.twoCol}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>AMOUNT (₹)</Text>
                <TextInput
                  value={form.amount}
                  onChangeText={(v) => setForm({ ...form, amount: v })}
                  keyboardType="numeric"
                  placeholder="1200"
                  placeholderTextColor={colors.faint}
                  style={styles.input}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>DUE DAY (1–31)</Text>
                <TextInput
                  value={form.dueDay}
                  onChangeText={(v) => setForm({ ...form, dueDay: v.replace(/[^0-9]/g, '') })}
                  keyboardType="numeric"
                  placeholder="5"
                  placeholderTextColor={colors.faint}
                  style={styles.input}
                  maxLength={2}
                />
              </View>
            </View>

            <Text style={styles.label}>CATEGORY</Text>
            <View style={styles.chips}>
              {(CATEGORIES as Category[]).map((c) => {
                const meta = categoryMeta(c);
                const active = form.category === c;
                return (
                  <Pressable
                    key={c}
                    onPress={() => setForm({ ...form, category: c })}
                    style={[styles.chip, active && { backgroundColor: meta.hue + '2E', borderColor: meta.hue + '88' }]}
                  >
                    <Ionicons name={meta.glyph as never} size={13} color={active ? meta.hue : colors.muted} />
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{meta.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Autopay on</Text>
              <Switch
                value={form.autopay}
                onValueChange={(v) => setForm({ ...form, autopay: v })}
                trackColor={{ true: colors.primary }}
              />
            </View>
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>It’s a subscription</Text>
              <Switch
                value={form.isSubscription}
                onValueChange={(v) => setForm({ ...form, isSubscription: v })}
                trackColor={{ true: colors.primary }}
              />
            </View>

            <Pressable
              onPress={save}
              style={[styles.saveBtn, saving && styles.disabled]}
              disabled={saving}
              accessibilityRole="button"
              accessibilityLabel="Save bill"
            >
              <Text style={styles.saveText}>{saving ? 'Saving…' : editingId ? 'Save changes' : 'Add bill'}</Text>
            </Pressable>
          </GlassCard>
        </KeyboardAvoidingView>
      </Modal>
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  row: { padding: 16, marginBottom: 10 },
  rowHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  icon: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  rowText: { flex: 1 },
  rowName: { fontSize: 15.5, fontWeight: '700', color: colors.ink },
  due: { fontSize: 12.5, color: colors.muted, marginTop: 3, fontWeight: '600' },
  dueUrgent: { color: colors.amber },
  rowAmt: { alignItems: 'flex-end' },
  amt: { fontSize: 16, fontWeight: '800', color: colors.ink, fontVariant: ['tabular-nums'] },
  dueDay: { fontSize: 12, color: colors.faint, marginTop: 2 },
  rowFoot: { flexDirection: 'row', gap: 6, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', paddingTop: 10 },
  footBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingRight: 14 },
  footText: { fontSize: 13, color: colors.muted, fontWeight: '600' },
  footTextOn: { color: colors.primary },
  fab: {
    position: 'absolute', right: 22, bottom: 170,
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16,
    elevation: 8,
  },
  sheetWrap: { flex: 1, justifyContent: 'flex-end' },
  sheetBackdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { padding: 20, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '88%' },
  grabber: {
    width: 40, height: 5, borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignSelf: 'center', marginBottom: 14,
  },
  sheetTitle: { fontSize: 19, fontWeight: '800', color: colors.ink, marginBottom: 14 },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 1.6, color: colors.faint, marginBottom: 8, marginTop: 12 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1, borderColor: colors.glassBorder,
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 15.5, color: colors.ink, fontWeight: '600',
  },
  twoCol: { flexDirection: 'row', gap: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 18, paddingHorizontal: 11, paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)',
  },
  chipText: { fontSize: 12.5, fontWeight: '600', color: colors.inkSoft },
  chipTextActive: { color: colors.ink, fontWeight: '700' },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 10, marginTop: 4,
  },
  toggleLabel: { fontSize: 14.5, fontWeight: '600', color: colors.inkSoft },
  saveBtn: {
    backgroundColor: colors.primary, borderRadius: 18,
    paddingVertical: 14, alignItems: 'center', marginTop: 14,
  },
  saveText: { fontSize: 15.5, fontWeight: '800', color: '#05281C' },
  disabled: { opacity: 0.6 },
});
