// Add-transaction form (apps/mobile/src/components/AddTransactionForm.tsx).
// react-hook-form + zod. Amount is entered in ₹ and converted to integer paise.
import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { CATEGORIES, METHODS, toPaise } from '@dalex/shared';
import { colors, radius } from '../theme';
import { CATEGORY_META, METHOD_META } from '../categoryMeta';
import { addTransaction } from '../data/transactions';
import type { Category, Method } from '../data/types';

const schema = z.object({
  amount: z
    .string()
    .trim()
    .refine(
      (s) => {
        const p = toPaise(s);
        return p !== null && p > 0;
      },
      { message: 'Enter an amount greater than ₹0' }
    ),
  merchant: z.string().trim().min(1, 'Merchant is required').max(80, 'Keep it under 80 characters'),
  note: z.string().max(200, 'Keep the note under 200 characters').optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  uid: string;
  onSuccess: () => void;
}

export default function AddTransactionForm({ uid, onSuccess }: Props) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { amount: '', merchant: '', note: '' } });

  const [category, setCategory] = useState<Category>('food');
  const [method, setMethod] = useState<Method>('upi');
  const [useNow, setUseNow] = useState(true);
  const [pickedAt, setPickedAt] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const onSubmit = async (values: FormValues) => {
    setSubmitError(null);
    const amountPaise = toPaise(values.amount);
    if (amountPaise === null || amountPaise <= 0) {
      setSubmitError('Enter an amount greater than ₹0');
      return;
    }
    try {
      await addTransaction(uid, {
        amountPaise,
        merchant: values.merchant.trim(),
        category,
        method,
        source: 'manual',
        note: values.note?.trim() || undefined,
        txnAt: useNow ? new Date() : pickedAt,
      });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSuccess();
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Could not save the transaction.');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const whenLabel = useNow
    ? 'Now'
    : pickedAt.toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

  return (
    <View style={styles.form}>
      <Text style={styles.label}>AMOUNT</Text>
      <Controller
        control={control}
        name="amount"
        render={({ field: { onChange, onBlur, value } }) => (
          <View style={[styles.amountWrap, errors.amount && styles.inputError]}>
            <Text style={styles.rupee}>₹</Text>
            <TextInput
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="0"
              placeholderTextColor={colors.faint}
              keyboardType="decimal-pad"
              style={styles.amountInput}
              autoFocus
              accessibilityLabel="Amount in rupees"
            />
          </View>
        )}
      />
      {errors.amount ? <Text style={styles.err}>{errors.amount.message}</Text> : null}

      <Text style={styles.label}>MERCHANT</Text>
      <Controller
        control={control}
        name="merchant"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="e.g. Swiggy, Uber, DMart"
            placeholderTextColor={colors.faint}
            style={[styles.textInput, errors.merchant && styles.inputError]}
            autoCapitalize="words"
            returnKeyType="next"
            accessibilityLabel="Merchant"
          />
        )}
      />
      {errors.merchant ? <Text style={styles.err}>{errors.merchant.message}</Text> : null}

      <Text style={styles.label}>CATEGORY</Text>
      <View style={styles.chips}>
        {(CATEGORIES as Category[]).map((c) => {
          const meta = CATEGORY_META[c];
          const active = c === category;
          return (
            <Pressable
              key={c}
              onPress={() => {
                setCategory(c);
                void Haptics.selectionAsync();
              }}
              style={[
                styles.chip,
                active && { backgroundColor: meta.hue + '2E', borderColor: meta.hue + '88' },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Category: ${meta.label}`}
              accessibilityState={{ selected: active }}
            >
              <Ionicons name={meta.glyph as never} size={14} color={active ? meta.hue : colors.muted} />
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{meta.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.label}>PAID VIA</Text>
      <View style={styles.methods}>
        {(METHODS as Method[]).map((m) => {
          const meta = METHOD_META[m];
          const active = m === method;
          return (
            <Pressable
              key={m}
              onPress={() => {
                setMethod(m);
                void Haptics.selectionAsync();
              }}
              style={[
                styles.methodBtn,
                active && { backgroundColor: meta.badgeBg, borderColor: meta.badgeText + '66' },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Pay via ${meta.label}`}
              accessibilityState={{ selected: active }}
            >
              <Ionicons name={meta.glyph as never} size={15} color={active ? meta.badgeText : colors.muted} />
              <Text style={[styles.methodText, active && { color: meta.badgeText }]}>{meta.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.label}>WHEN</Text>
      <View style={styles.whenRow}>
        <Pressable
          onPress={() => setUseNow(true)}
          style={[styles.whenBtn, useNow && styles.whenBtnActive]}
          accessibilityRole="button"
          accessibilityLabel="Use current time"
          accessibilityState={{ selected: useNow }}
        >
          <Text style={[styles.whenText, useNow && styles.whenTextActive]}>Now</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            setUseNow(false);
            setShowPicker(true);
          }}
          style={[styles.whenBtn, !useNow && styles.whenBtnActive]}
          accessibilityRole="button"
          accessibilityLabel="Pick date and time"
          accessibilityState={{ selected: !useNow }}
        >
          <Ionicons
            name="calendar-outline"
            size={14}
            color={!useNow ? colors.primary : colors.muted}
          />
          <Text style={[styles.whenText, !useNow && styles.whenTextActive]}>{whenLabel}</Text>
        </Pressable>
      </View>
      {!useNow && (showPicker || Platform.OS === 'ios') && (
        <DateTimePicker
          value={pickedAt}
          mode="datetime"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          maximumDate={new Date()}
          onChange={(_, d) => {
            if (Platform.OS === 'android') setShowPicker(false);
            if (d) setPickedAt(d);
          }}
          style={styles.picker}
        />
      )}

      <Text style={styles.label}>NOTE (OPTIONAL)</Text>
      <Controller
        control={control}
        name="note"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="Anything worth remembering"
            placeholderTextColor={colors.faint}
            style={styles.textInput}
            multiline
            accessibilityLabel="Note (optional)"
          />
        )}
      />
      {errors.note ? <Text style={styles.err}>{errors.note.message}</Text> : null}

      {submitError ? <Text style={styles.err}>{submitError}</Text> : null}

      <Pressable
        onPress={handleSubmit(onSubmit)}
        disabled={isSubmitting}
        style={({ pressed }) => [styles.submit, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel="Save expense"
      >
        {isSubmitting ? (
          <ActivityIndicator size="small" color="#05281C" />
        ) : (
          <Text style={styles.submitText}>Save expense</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: 0 },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.6,
    color: colors.faint,
    marginTop: 18,
    marginBottom: 8,
  },
  amountWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  rupee: { fontSize: 26, fontWeight: '700', color: colors.faint, marginRight: 6 },
  amountInput: {
    flex: 1,
    fontSize: 34,
    fontWeight: '800',
    color: colors.ink,
    paddingVertical: 10,
    fontVariant: ['tabular-nums'],
  },
  textInput: {
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    color: colors.ink,
  },
  inputError: { borderColor: colors.rose },
  err: { fontSize: 12.5, color: colors.rose, marginTop: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: 20,
    paddingHorizontal: 13,
    paddingVertical: 9,
    minHeight: 44,
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  chipText: { fontSize: 13.5, fontWeight: '600', color: colors.inkSoft },
  chipTextActive: { color: colors.ink, fontWeight: '700' },
  methods: { flexDirection: 'row', gap: 8 },
  methodBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 16,
    paddingVertical: 11,
    minHeight: 44,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  methodText: { fontSize: 13, fontWeight: '700', color: colors.muted },
  whenRow: { flexDirection: 'row', gap: 8 },
  whenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 11,
    minHeight: 44,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  whenBtnActive: {
    backgroundColor: 'rgba(52,211,153,0.14)',
    borderColor: 'rgba(52,211,153,0.35)',
  },
  whenText: { fontSize: 13.5, fontWeight: '600', color: colors.muted },
  whenTextActive: { color: colors.primary, fontWeight: '700' },
  picker: { marginTop: 8 },
  submit: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 26,
  },
  pressed: { opacity: 0.75 },
  submitText: { fontSize: 16, fontWeight: '800', color: '#05281C' },
});
