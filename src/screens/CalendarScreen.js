import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import HearingTimelineCard from '../components/HearingTimelineCard';
import LoadingState from '../components/LoadingState';
import colors from '../constants/colors';
import { getHearings } from '../services/api';
import { isUpcoming, matchesCalendarFilter } from '../utils/date';

const FILTERS = [
  { key: 'today', label: 'Hoy' },
  { key: 'week', label: 'Semana' },
  { key: 'month', label: 'Mes' },
];

export default function CalendarScreen({ navigation }) {
  const [hearings, setHearings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState('week');

  const loadHearings = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const items = await getHearings();
      setHearings(items);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHearings();
    }, [loadHearings])
  );

  const filteredHearings = useMemo(
    () => hearings.filter((item) => matchesCalendarFilter(item.date, activeFilter)),
    [hearings, activeFilter]
  );

  if (loading && !hearings.length) {
    return <LoadingState message="Estamos ordenando la agenda judicial del período." title="Cargando calendario" />;
  }

  if (error && !hearings.length) {
    return <ErrorState message={error} onRetry={loadHearings} title="No pudimos cargar el calendario" />;
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Calendario</Text>
          <Text style={styles.subtitle}>Audiencias ordenadas por fecha para que priorices el día.</Text>
        </View>

        <Pressable onPress={() => navigation.navigate('NewHearing')} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Programar Audiencia</Text>
        </Pressable>
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map((filter) => (
          <Pressable
            key={filter.key}
            onPress={() => setActiveFilter(filter.key)}
            style={[styles.filterChip, activeFilter === filter.key && styles.filterChipActive]}
          >
            <Text style={[styles.filterChipText, activeFilter === filter.key && styles.filterChipTextActive]}>
              {filter.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        contentContainerStyle={styles.listContent}
        data={filteredHearings}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item, index }) => (
          <HearingTimelineCard
            hearing={item}
            isLast={index === filteredHearings.length - 1}
            onPressAction={() =>
              Alert.alert('Audiencia preparada', `El inicio en vivo de "${item.title}" se integrará con el flujo real.`)
            }
            showAction={isUpcoming(item.date)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="calendar-remove-outline"
            message="No hay audiencias para el filtro seleccionado. Probá otro rango o programá una nueva."
            title="Agenda sin eventos"
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: 62,
    paddingHorizontal: 22,
    paddingBottom: 18,
    gap: 16,
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
    marginTop: 6,
    maxWidth: '82%',
  },
  primaryButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  primaryButtonText: {
    color: colors.card,
    fontSize: 14,
    fontWeight: '700',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 22,
    marginBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: colors.card,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
  },
  filterChipText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  filterChipTextActive: {
    color: colors.card,
  },
  listContent: {
    paddingHorizontal: 22,
    paddingBottom: 28,
    paddingTop: 14,
  },
});
