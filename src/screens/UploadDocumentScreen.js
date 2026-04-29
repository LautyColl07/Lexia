import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';
import colors from '../constants/colors';
import { getHearings, uploadDocument } from '../services/api';

const DOCUMENT_TYPES = ['Demanda', 'Escrito', 'Prueba', 'Anexo'];

export default function UploadDocumentScreen({ navigation }) {
  const [hearings, setHearings] = useState([]);
  const [loadingHearings, setLoadingHearings] = useState(true);
  const [hearingsError, setHearingsError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState('');
  const [form, setForm] = useState({
    hearingId: '',
    fileName: '',
    documentType: 'Escrito',
  });

  useEffect(() => {
    loadHearings();
  }, []);

  const loadHearings = async () => {
    try {
      setLoadingHearings(true);
      setHearingsError('');
      const items = await getHearings();
      setHearings(items);
    } catch (error) {
      setHearings([]);
      setHearingsError(error.message);
    } finally {
      setLoadingHearings(false);
    }
  };

  const selectedHearing = useMemo(
    () => hearings.find((item) => String(item.id) === form.hearingId),
    [hearings, form.hearingId]
  );

  const updateField = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const handleSelectFile = () => {
    const fileLabel = `pieza_procesal_${Date.now()}.pdf`;
    setSelectedFile(fileLabel);
    if (!form.fileName) {
      updateField('fileName', fileLabel);
    }
    Alert.alert('Archivo seleccionado', `${fileLabel} quedó listo para simular la subida.`);
  };

  const handleUpload = async () => {
    if (!form.hearingId || !form.fileName.trim()) {
      Alert.alert('Campos requeridos', 'Seleccioná una audiencia y definí el nombre del archivo.');
      return;
    }

    try {
      setSubmitting(true);
      await uploadDocument({
        hearingId: form.hearingId,
        fileName: form.fileName.trim(),
        documentType: form.documentType,
        localUri: selectedFile || 'archivo_simulado.pdf',
      });

      Alert.alert('Documento subido', 'La carga quedó registrada dentro del módulo visual.', [
        {
          text: 'Continuar',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      Alert.alert('No pudimos subir el documento', error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingHearings && !hearings.length) {
    return <LoadingState message="Estamos cargando las audiencias reales para asociar el documento." title="Cargando audiencias" />;
  }

  if (hearingsError && !hearings.length) {
    return <ErrorState message={hearingsError} onRetry={loadHearings} title="No pudimos cargar las audiencias" />;
  }

  if (!hearings.length) {
    return (
      <EmptyState
        icon="calendar-blank-outline"
        message="Necesitás al menos una audiencia creada para registrar un documento simulado."
        title="Sin audiencias disponibles"
      />
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} style={styles.screen}>
      <Text style={styles.title}>Subir documento</Text>
      <Text style={styles.subtitle}>Prepará el flujo de carga y dejalo listo para integrarse con storage real.</Text>

      <Field label="Audiencia">
        <View style={styles.selectorList}>
          {hearings.map((item) => {
            const selected = String(item.id) === form.hearingId;
            return (
              <Pressable
                key={item.id}
                onPress={() => updateField('hearingId', String(item.id))}
                style={[styles.selectorCard, selected && styles.selectorCardActive]}
              >
                <Text style={[styles.selectorTitle, selected && styles.selectorTitleActive]}>{item.title}</Text>
                <Text style={[styles.selectorMeta, selected && styles.selectorMetaActive]}>{item.caseTitle}</Text>
              </Pressable>
            );
          })}
        </View>
      </Field>

      <Field label="Nombre del archivo">
        <TextInput
          onChangeText={(value) => updateField('fileName', value)}
          placeholder="Ej. contestacion_demanda.pdf"
          placeholderTextColor="#94A3B8"
          style={styles.input}
          value={form.fileName}
        />
      </Field>

      <Field label="Tipo de documento">
        <View style={styles.optionRow}>
          {DOCUMENT_TYPES.map((option) => (
            <Pressable
              key={option}
              onPress={() => updateField('documentType', option)}
              style={[styles.optionChip, form.documentType === option && styles.optionChipActive]}
            >
              <Text style={[styles.optionChipText, form.documentType === option && styles.optionChipTextActive]}>{option}</Text>
            </Pressable>
          ))}
        </View>
      </Field>

      <Pressable onPress={handleSelectFile} style={styles.secondaryButton}>
        <Text style={styles.secondaryButtonText}>Seleccionar archivo</Text>
      </Pressable>

      {selectedHearing ? (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Resumen de carga</Text>
          <Text style={styles.summaryText}>Audiencia: {selectedHearing.title}</Text>
          <Text style={styles.summaryText}>Causa: {selectedHearing.caseTitle}</Text>
          <Text style={styles.summaryText}>Archivo: {selectedFile || form.fileName || 'Pendiente de selección'}</Text>
        </View>
      ) : null}

      <Pressable disabled={submitting} onPress={handleUpload} style={[styles.submitButton, submitting && styles.submitButtonDisabled]}>
        <Text style={styles.submitButtonText}>{submitting ? 'Subiendo...' : 'Subir documento'}</Text>
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
  secondaryButton: {
    backgroundColor: colors.card,
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: 22,
    padding: 18,
  },
  summaryTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
  },
  summaryText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  submitButton: {
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
