import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';
import colors from '../constants/colors';
import { createHearing, getCases } from '../services/api';

const MODALITY_OPTIONS = ['Presencial', 'Virtual', 'Híbrida'];

export default function NewHearingScreen({ navigation, route }) {
  const initialCaseId = route.params?.caseId ? String(route.params.caseId) : '';
  const [cases, setCases] = useState([]);
  const [loadingCases, setLoadingCases] = useState(true);
  const [casesError, setCasesError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '',
    caseId: initialCaseId,
    date: '',
    time: '',
    modality: 'Presencial',
    location: '',
  });

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    try {
      setLoadingCases(true);
      setCasesError('');
      const items = await getCases();
      setCases(items);
    } catch (error) {
      setCases([]);
      setCasesError(error.message);
    } finally {
      setLoadingCases(false);
    }
  };

  const updateField = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.caseId || !form.date.trim() || !form.time.trim()) {
      Alert.alert('Campos requeridos', 'Completá título, causa, fecha y hora para programar la audiencia.');
      return;
    }

    try {
      setSubmitting(true);
      await createHearing({
        title: form.title.trim(),
        caseId: form.caseId,
        date: form.date.trim(),
        time: form.time.trim(),
        modality: form.modality,
        location: form.location.trim(),
      });

      Alert.alert('Audiencia programada', 'La audiencia quedó registrada en el calendario del módulo.', [
        {
          text: 'Continuar',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      Alert.alert('No pudimos programar la audiencia', error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingCases && !cases.length) {
    return <LoadingState message="Estamos cargando las causas reales para programar la audiencia." title="Cargando causas" />;
  }

  if (casesError && !cases.length) {
    return <ErrorState message={casesError} onRetry={loadCases} title="No pudimos cargar las causas" />;
  }

  if (!cases.length) {
    return (
      <EmptyState
        icon="briefcase-search-outline"
        message="Necesitás al menos una causa creada para poder asociarle una audiencia."
        title="Sin causas disponibles"
      />
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} style={styles.screen}>
      <Text style={styles.title}>Programar audiencia</Text>
      <Text style={styles.subtitle}>Este formulario simula el alta y deja el flujo listo para el backend real.</Text>

      <Field label="Título">
        <TextInput
          onChangeText={(value) => updateField('title', value)}
          placeholder="Ej. Audiencia preliminar"
          placeholderTextColor="#94A3B8"
          style={styles.input}
          value={form.title}
        />
      </Field>

      <Field label="Causa">
        <View style={styles.selectorList}>
          {cases.map((item) => {
            const selected = String(item.id) === form.caseId;
            return (
              <Pressable
                key={item.id}
                onPress={() => updateField('caseId', String(item.id))}
                style={[styles.selectorCard, selected && styles.selectorCardActive]}
              >
                <Text style={[styles.selectorTitle, selected && styles.selectorTitleActive]}>{item.title}</Text>
                <Text style={[styles.selectorMeta, selected && styles.selectorMetaActive]}>{item.court}</Text>
              </Pressable>
            );
          })}
        </View>
      </Field>

      <View style={styles.dualRow}>
        <Field label="Fecha">
          <TextInput
            onChangeText={(value) => updateField('date', value)}
            placeholder="AAAA-MM-DD"
            placeholderTextColor="#94A3B8"
            style={styles.input}
            value={form.date}
          />
        </Field>

        <Field label="Hora">
          <TextInput
            onChangeText={(value) => updateField('time', value)}
            placeholder="10:30"
            placeholderTextColor="#94A3B8"
            style={styles.input}
            value={form.time}
          />
        </Field>
      </View>

      <Field label="Modalidad">
        <View style={styles.optionRow}>
          {MODALITY_OPTIONS.map((option) => (
            <Pressable
              key={option}
              onPress={() => updateField('modality', option)}
              style={[styles.optionChip, form.modality === option && styles.optionChipActive]}
            >
              <Text style={[styles.optionChipText, form.modality === option && styles.optionChipTextActive]}>{option}</Text>
            </Pressable>
          ))}
        </View>
      </Field>

      <Field label="Ubicación / Sala">
        <TextInput
          onChangeText={(value) => updateField('location', value)}
          placeholder="Ej. Sala 3 o Zoom institucional"
          placeholderTextColor="#94A3B8"
          style={styles.input}
          value={form.location}
        />
      </Field>

      <Pressable disabled={submitting} onPress={handleSubmit} style={[styles.submitButton, submitting && styles.submitButtonDisabled]}>
        <Text style={styles.submitButtonText}>{submitting ? 'Guardando...' : 'Programar audiencia'}</Text>
      </Pressable>
    </ScrollView>
  );
}

function Field({ children, label }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    gap: 18,
    paddingBottom: 34,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  field: {
    gap: 10,
  },
  label: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: colors.text,
    fontSize: 15,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  selectorList: {
    gap: 10,
  },
  selectorCard: {
    backgroundColor: colors.card,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectorCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.accentSoft,
  },
  selectorTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  selectorTitleActive: {
    color: colors.primary,
  },
  selectorMeta: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 6,
  },
  selectorMetaActive: {
    color: colors.primary,
  },
  dualRow: {
    flexDirection: 'row',
    gap: 12,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionChip: {
    backgroundColor: colors.card,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  optionChipActive: {
    backgroundColor: colors.primary,
  },
  optionChipText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  optionChipTextActive: {
    color: colors.card,
  },
  submitButton: {
    marginTop: 8,
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: colors.card,
    fontSize: 15,
    fontWeight: '700',
  },
});
