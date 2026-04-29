import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import colors from '../constants/colors';
import { createCase } from '../services/api';

const STATUS_OPTIONS = ['Activa', 'En revisión', 'Cerrada'];

export default function NewCaseScreen({ navigation }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    court: '',
    status: 'Activa',
  });
  const [submitting, setSubmitting] = useState(false);

  const updateField = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      Alert.alert('Campo requerido', 'Ingresá un título para la causa.');
      return;
    }

    try {
      setSubmitting(true);
      await createCase({
        title: form.title.trim(),
        description: form.description.trim(),
        court: form.court.trim(),
        status: form.status,
      });

      Alert.alert('Causa creada', 'La causa se agregó correctamente al módulo.', [
        {
          text: 'Continuar',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      Alert.alert('No pudimos crear la causa', error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} style={styles.screen}>
      <Text style={styles.title}>Nueva causa</Text>
      <Text style={styles.subtitle}>Dejá listo el alta visual de un nuevo expediente para el flujo real.</Text>

      <Field label="Título">
        <TextInput
          onChangeText={(value) => updateField('title', value)}
          placeholder="Ej. Gonzalez c/ Lopez"
          placeholderTextColor="#94A3B8"
          style={styles.input}
          value={form.title}
        />
      </Field>

      <Field label="Descripción">
        <TextInput
          multiline
          numberOfLines={4}
          onChangeText={(value) => updateField('description', value)}
          placeholder="Descripción breve del expediente"
          placeholderTextColor="#94A3B8"
          style={[styles.input, styles.textArea]}
          textAlignVertical="top"
          value={form.description}
        />
      </Field>

      <Field label="Juzgado">
        <TextInput
          onChangeText={(value) => updateField('court', value)}
          placeholder="Ej. Juzgado Civil N° 12"
          placeholderTextColor="#94A3B8"
          style={styles.input}
          value={form.court}
        />
      </Field>

      <Field label="Estado">
        <View style={styles.optionRow}>
          {STATUS_OPTIONS.map((option) => (
            <Pressable
              key={option}
              onPress={() => updateField('status', option)}
              style={[styles.optionChip, form.status === option && styles.optionChipActive]}
            >
              <Text style={[styles.optionChipText, form.status === option && styles.optionChipTextActive]}>{option}</Text>
            </Pressable>
          ))}
        </View>
      </Field>

      <Pressable disabled={submitting} onPress={handleSubmit} style={[styles.submitButton, submitting && styles.submitButtonDisabled]}>
        <Text style={styles.submitButtonText}>{submitting ? 'Guardando...' : 'Crear causa'}</Text>
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
  textArea: {
    minHeight: 116,
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
