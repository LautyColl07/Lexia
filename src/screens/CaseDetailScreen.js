import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';
import colors from '../constants/colors';
import { getCaseById } from '../services/api';
import { formatLongDate, formatTime } from '../utils/date';

export default function CaseDetailScreen({ navigation, route }) {
  const caseId = route.params?.caseId;
  const [caseDetail, setCaseDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadCase = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const item = await getCaseById(caseId);
      setCaseDetail(item);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useFocusEffect(
    useCallback(() => {
      loadCase();
    }, [loadCase])
  );

  if (loading && !caseDetail) {
    return <LoadingState message="Estamos cargando el expediente completo y sus vínculos." title="Detalle de causa" />;
  }

  if (error && !caseDetail) {
    return <ErrorState message={error} onRetry={loadCase} title="No pudimos abrir esta causa" />;
  }

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} style={styles.screen}>
      <View style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <Text style={styles.title}>{caseDetail.title}</Text>
          <View style={styles.statusPill}>
            <Text style={styles.statusText}>{caseDetail.status}</Text>
          </View>
        </View>

        <Text style={styles.description}>{caseDetail.description}</Text>

        <View style={styles.metaRow}>
          <MaterialCommunityIcons color={colors.textSecondary} name="scale-balance" size={16} />
          <Text style={styles.metaText}>{caseDetail.court}</Text>
        </View>

        <View style={styles.metaRow}>
          <MaterialCommunityIcons color={colors.textSecondary} name="calendar-outline" size={16} />
          <Text style={styles.metaText}>Alta el {formatLongDate(caseDetail.createdAt)}</Text>
        </View>

        <Pressable
          onPress={() => navigation.navigate('NewHearing', { caseId: caseDetail.id })}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>Programar audiencia</Text>
          <MaterialCommunityIcons color={colors.card} name="arrow-right" size={18} />
        </Pressable>
      </View>

      <Section title="Audiencias">
        {caseDetail.hearings.length ? (
          caseDetail.hearings.map((hearing) => (
            <View key={hearing.id} style={styles.sectionCard}>
              <Text style={styles.sectionCardTitle}>{hearing.title}</Text>
              <Text style={styles.sectionCardSubtitle}>
                {formatLongDate(hearing.date)} · {formatTime(hearing.date)}
              </Text>
              <Text style={styles.sectionCardMeta}>
                {hearing.modality || 'Modalidad pendiente'}
                {hearing.location ? ` · ${hearing.location}` : ''}
              </Text>
            </View>
          ))
        ) : (
          <EmptyState
            icon="calendar-blank-outline"
            message="Esta causa todavía no tiene audiencias asociadas."
            title="Sin audiencias"
          />
        )}
      </Section>

      <Section title="Documentos">
        {caseDetail.documents.length ? (
          caseDetail.documents.map((document) => (
            <View key={document.id} style={styles.sectionCard}>
              <Text style={styles.sectionCardTitle}>{document.fileName}</Text>
              <Text style={styles.sectionCardSubtitle}>{document.documentType}</Text>
              <Text style={styles.sectionCardMeta}>Cargado el {formatLongDate(document.uploadedAt)}</Text>
            </View>
          ))
        ) : (
          <EmptyState
            icon="file-document-outline"
            message="Todavía no se adjuntaron documentos para este expediente."
            title="Sin documentos"
          />
        )}
      </Section>

      <Section title="Tareas">
        {caseDetail.tasks.length ? (
          caseDetail.tasks.map((task) => (
            <View key={task.id} style={styles.taskRow}>
              <View style={[styles.taskIcon, task.completed ? styles.taskIconDone : styles.taskIconPending]}>
                <MaterialCommunityIcons
                  color={task.completed ? colors.success : colors.primary}
                  name={task.completed ? 'check' : 'clock-outline'}
                  size={18}
                />
              </View>
              <View style={styles.taskContent}>
                <Text style={styles.sectionCardTitle}>{task.title}</Text>
                <Text style={styles.sectionCardMeta}>
                  {task.completed ? 'Completada' : 'Pendiente'}
                  {task.dueDate ? ` · vence ${formatLongDate(task.dueDate)}` : ''}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <EmptyState
            icon="clipboard-check-outline"
            message="No hay tareas registradas para esta causa."
            title="Sin tareas"
          />
        )}
      </Section>

      {error ? <Text style={styles.inlineError}>{error}</Text> : null}
    </ScrollView>
  );
}

function Section({ children, title }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>{children}</View>
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
    gap: 22,
    paddingBottom: 34,
  },
  heroCard: {
    backgroundColor: colors.card,
    borderRadius: 28,
    padding: 22,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    flex: 1,
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
  },
  statusPill: {
    backgroundColor: colors.accentSoft,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statusText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  description: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 12,
    marginBottom: 14,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginTop: 6,
  },
  metaText: {
    color: colors.textSecondary,
    fontSize: 13,
    flex: 1,
  },
  primaryButton: {
    marginTop: 18,
    backgroundColor: colors.primary,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 13,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: colors.card,
    fontSize: 14,
    fontWeight: '700',
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  sectionContent: {
    gap: 12,
  },
  sectionCard: {
    backgroundColor: colors.card,
    borderRadius: 22,
    padding: 18,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 3,
  },
  sectionCardTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  sectionCardSubtitle: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 6,
  },
  sectionCardMeta: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 6,
    lineHeight: 20,
  },
  taskRow: {
    backgroundColor: colors.card,
    borderRadius: 22,
    padding: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 3,
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  taskIcon: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskIconPending: {
    backgroundColor: colors.accentSoft,
  },
  taskIconDone: {
    backgroundColor: '#E7F4EA',
  },
  taskContent: {
    flex: 1,
  },
  inlineError: {
    color: colors.danger,
    fontSize: 13,
    textAlign: 'center',
  },
});
