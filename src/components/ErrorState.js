import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import colors from '../constants/colors';

export default function ErrorState({ title = 'No pudimos cargar esta vista', message, onRetry }) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrapper}>
        <MaterialCommunityIcons color={colors.danger} name="alert-circle-outline" size={30} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message || 'Reintentá en unos segundos.'}</Text>
      {onRetry ? (
        <Pressable onPress={onRetry} style={styles.button}>
          <Text style={styles.buttonText}>Reintentar</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    backgroundColor: colors.background,
  },
  iconWrapper: {
    width: 62,
    height: 62,
    borderRadius: 22,
    backgroundColor: '#FCEBEC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '700',
    textAlign: 'center',
  },
  message: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 21,
  },
  button: {
    marginTop: 18,
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  buttonText: {
    color: colors.card,
    fontSize: 14,
    fontWeight: '700',
  },
});
