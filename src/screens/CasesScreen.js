import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';
import colors from '../constants/colors';
import { getCases } from '../services/api';
import { formatLongDate } from '../utils/date';

export default function CasesScreen({ navigation }) {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadCases = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError('');
      const items = await getCases();
      setCases(items);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCases();
    }, [loadCases])
  );

  if (loading && !cases.length) {
    return <LoadingState message="Estamos cargando las causas activas y su contexto judicial." title="Cargando causas" />;
  }

  if (error && !cases.length) {
    return <ErrorState message={error} onRetry={loadCases} title="No pudimos traer las causas" />;
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Causas</Text>
          <Text style={styles.subtitle}>Seguimiento de expedientes, estados y próximos hitos.</Text>
        </View>

        <Pressable onPress={() => navigation.navigate('NewCase')} style={styles.primaryButton}>
          <MaterialCommunityIcons color={colors.card} name="plus" size={18} />
          <Text style={styles.primaryButtonText}>Nueva Causa</Text>
        </Pressable>
      </View>

      <FlatList
        contentContainerStyle={styles.listContent}
        data={cases}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl onRefresh={() => loadCases(true)} refreshing={refreshing} tintColor={colors.primary} />}
        renderItem={({ item }) => (
          <Pressable onPress={() => navigation.navigate('CaseDetail', { caseId: item.id })} style={styles.card}>
            <View style={styles.cardTopRow}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <View
                style={[
                  styles.statusPill,
                  item.status === 'Activa'
                    ? styles.statusActive
                    : item.status === 'Cerrada'
                      ? styles.statusClosed
                      : styles.statusReview,
                ]}
              >
                <Text style={styles.statusText}>{item.status}</Text>
              </View>
            </View>

            <Text style={styles.description}>{item.description}</Text>

            <View style={styles.metaRow}>
              <MaterialCommunityIcons color={colors.textSecondary} name="scale-balance" size={16} />
              <Text style={styles.metaText}>{item.court || 'Juzgado a confirmar'}</Text>
            </View>

            <View style={styles.metaRow}>
              <MaterialCommunityIcons color={colors.textSecondary} name="calendar-outline" size={16} />
              <Text style={styles.metaText}>Creada el {formatLongDate(item.createdAt)}</Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="briefcase-search-outline"
            message="Todavía no se cargaron causas. Podés empezar creando la primera desde este módulo."
            title="Sin causas registradas"
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
    maxWidth: '80%',
  },
  primaryButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: colors.card,
    fontSize: 14,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 18,
    paddingBottom: 28,
    gap: 12,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 18,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
  },
  cardTopRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  cardTitle: {
    flex: 1,
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  statusActive: {
    backgroundColor: '#E7F4EA',
  },
  statusClosed: {
    backgroundColor: '#FCEBEC',
  },
  statusReview: {
    backgroundColor: '#FFF4DA',
  },
  statusText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  description: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
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
});
