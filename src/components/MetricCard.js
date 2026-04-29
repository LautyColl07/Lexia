import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import colors from '../constants/colors';

export default function MetricCard({ label, value, icon, accentColor }) {
  return (
    <View style={styles.card}>
      <View style={[styles.iconWrapper, { backgroundColor: `${accentColor}18` }]}>
        <MaterialCommunityIcons color={accentColor} name={icon} size={22} />
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 18,
    minHeight: 132,
    justifyContent: 'space-between',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
  },
  label: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
});
