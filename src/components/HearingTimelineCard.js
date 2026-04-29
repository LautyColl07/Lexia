import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import colors from '../constants/colors';
import { formatLongDate, formatShortDate, formatTime } from '../utils/date';

export default function HearingTimelineCard({
  hearing,
  isLast = false,
  showAction = true,
  onPressAction,
}) {
  return (
    <View style={styles.row}>
      <View style={styles.timeline}>
        <View style={styles.point} />
        {!isLast && <View style={styles.line} />}
      </View>

      <View style={styles.content}>
        <View style={styles.dateBadge}>
          <Text style={styles.dateBadgeText}>{formatShortDate(hearing.date)}</Text>
          <Text style={styles.dateBadgeTime}>{formatTime(hearing.date)}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>{hearing.title}</Text>
          <Text style={styles.caseTitle}>{hearing.caseTitle}</Text>

          <View style={styles.metaRow}>
            <MaterialCommunityIcons color={colors.textSecondary} name="calendar-clock" size={16} />
            <Text style={styles.metaText}>{formatLongDate(hearing.date)}</Text>
          </View>

          <View style={styles.metaRow}>
            <MaterialCommunityIcons color={colors.textSecondary} name="scale-balance" size={16} />
            <Text style={styles.metaText}>{hearing.court || 'Juzgado a confirmar'}</Text>
          </View>

          <View style={styles.metaRow}>
            <MaterialCommunityIcons color={colors.textSecondary} name="map-marker-outline" size={16} />
            <Text style={styles.metaText}>
              {hearing.modality || 'Modalidad pendiente'}
              {hearing.location ? ` · ${hearing.location}` : ''}
            </Text>
          </View>

          {showAction ? (
            <Pressable onPress={onPressAction} style={styles.actionButton}>
              <Text style={styles.actionText}>Iniciar Audiencia</Text>
              <MaterialCommunityIcons color={colors.card} name="arrow-right" size={18} />
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  timeline: {
    width: 26,
    alignItems: 'center',
  },
  point: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
    marginTop: 14,
    zIndex: 2,
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: colors.accent,
    marginTop: 6,
    marginBottom: -12,
  },
  content: {
    flex: 1,
    paddingBottom: 18,
  },
  dateBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accentSoft,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  dateBadgeText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  dateBadgeTime: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 18,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  caseTitle: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  metaText: {
    color: colors.textSecondary,
    fontSize: 13,
    flex: 1,
  },
  actionButton: {
    marginTop: 16,
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionText: {
    color: colors.card,
    fontSize: 14,
    fontWeight: '700',
  },
});
