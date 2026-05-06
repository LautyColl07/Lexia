import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import * as DocumentPicker from 'expo-document-picker';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '../context/ThemeContext';

const WHISPER_BASE_URL = 'http://172.16.4.48:5000';
const DEFAULT_AUDIO_MIME_TYPE = 'audio/m4a';
const HEALTH_TIMEOUT_MS = 45000;
const AUDIO_EXTENSION_TO_MIME_TYPE = {
  '.aac': 'audio/aac',
  '.m4a': 'audio/m4a',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
};

function formatDuration(durationMillis) {
  const totalSeconds = Math.max(0, Math.floor((Number(durationMillis) || 0) / 1000));
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function getFileExtension(fileName = '') {
  const lastDotIndex = fileName.lastIndexOf('.');

  if (lastDotIndex < 0) {
    return '';
  }

  return fileName.slice(lastDotIndex).toLowerCase();
}

function getMimeTypeFromFileName(fileName = '') {
  return AUDIO_EXTENSION_TO_MIME_TYPE[getFileExtension(fileName)] || null;
}

function getFileNameFromUri(uri = '') {
  if (!uri) {
    return '';
  }

  const uriWithoutQuery = uri.split('?')[0];
  const segments = uriWithoutQuery.split('/');
  return segments[segments.length - 1] || '';
}

function isSupportedAudioSelection({ fileName, mimeType }) {
  if (mimeType?.toLowerCase().startsWith('audio/')) {
    return true;
  }

  return Boolean(getMimeTypeFromFileName(fileName));
}

function describeAudio(audio, source) {
  if (!audio?.fileName) {
    return 'Todavia no hay un audio listo para enviar.';
  }

  const sourceLabel = source === 'selected' ? 'archivo seleccionado' : 'audio grabado';
  return `${audio.fileName} (${sourceLabel})`;
}

async function fetchWithTimeout(url, options = {}, timeoutMs = HEALTH_TIMEOUT_MS) {
  const controller = new AbortController();
  let didTimeout = false;
  const timeoutId = setTimeout(() => {
    didTimeout = true;
    controller.abort();
  }, timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } catch (error) {
    if (didTimeout) {
      throw new Error(`timeout:${timeoutMs}`);
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function parseApiResponse(response) {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    return response.json();
  }

  const text = await response.text();
  return text ? { raw: text } : {};
}

function buildNetworkErrorMessage(error) {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes('timeout:') || message.includes('timed out')) {
      return 'La solicitud supero el tiempo limite. Intenta nuevamente.';
    }

    if (message.includes('network request failed')) {
      return 'Error de red. Verifica que el dispositivo pueda alcanzar 172.16.4.48.';
    }

    if (message.includes('aborted')) {
      return 'La solicitud fue cancelada antes de completarse.';
    }

    return error.message;
  }

  return 'Ocurrio un error de red inesperado.';
}

export default function TranscriptionTestScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 250);
  const [statusText, setStatusText] = useState('Lista para probar el servidor de transcripcion.');
  const [recordedAudio, setRecordedAudio] = useState(null);
  const [selectedAudio, setSelectedAudio] = useState(null);
  const [activeAudioSource, setActiveAudioSource] = useState(null);
  const [transcriptText, setTranscriptText] = useState('');
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const activeAudio = useMemo(() => {
    if (activeAudioSource === 'selected') {
      return selectedAudio;
    }

    if (activeAudioSource === 'recorded') {
      return recordedAudio;
    }

    return null;
  }, [activeAudioSource, recordedAudio, selectedAudio]);
  const hasReadyAudio = Boolean(activeAudio?.uri);

  useEffect(() => () => {
    void setAudioModeAsync({
      allowsRecording: false,
      playsInSilentMode: true,
      interruptionMode: 'doNotMix',
      shouldPlayInBackground: false,
      shouldRouteThroughEarpiece: false,
    }).catch(() => null);
  }, []);

  const handleCheckConnection = useCallback(async () => {
    try {
      setIsCheckingConnection(true);
      setStatusText('Probando conexion con el servidor de transcripcion...');

      const response = await fetchWithTimeout(`${WHISPER_BASE_URL}/api/health`);
      const payload = await parseApiResponse(response);

      if (!response.ok) {
        throw new Error(
          payload?.message ||
            payload?.error ||
            `El servidor respondio con estado ${response.status}.`
        );
      }

      if (payload?.ok === false) {
        throw new Error(payload?.message || payload?.error || 'El backend devolvio ok:false.');
      }

      setStatusText('Conexion OK con el servidor de transcripcion.');
    } catch (error) {
      const message = buildNetworkErrorMessage(error);
      console.error('[TranscriptionTestScreen] Error probando conexion:', error);
      setStatusText(message);
      Alert.alert('No se pudo probar la conexion', message);
    } finally {
      setIsCheckingConnection(false);
    }
  }, []);

  const handleStartRecording = useCallback(async () => {
    try {
      const permission = await requestRecordingPermissionsAsync();

      if (!permission.granted) {
        const message = 'Sin permiso de microfono. Habilitalo para comenzar a grabar.';
        setStatusText(message);
        Alert.alert('Permiso requerido', message);
        return;
      }

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
        interruptionMode: 'doNotMix',
        shouldPlayInBackground: false,
        shouldRouteThroughEarpiece: false,
      });

      await recorder.prepareToRecordAsync();
      recorder.record();
      setRecordedAudio(null);
      setSelectedAudio(null);
      setActiveAudioSource(null);
      setTranscriptText('');
      setStatusText('Grabando audio...');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo iniciar la grabacion.';
      console.error('[TranscriptionTestScreen] Error iniciando grabacion:', error);
      setStatusText(message);
      Alert.alert('No se pudo iniciar la grabacion', message);
    }
  }, [recorder]);

  const handleStopRecording = useCallback(async () => {
    try {
      await recorder.stop();
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
        interruptionMode: 'doNotMix',
        shouldPlayInBackground: false,
        shouldRouteThroughEarpiece: false,
      });

      const recorderSnapshot = recorder.getStatus();
      const recordingUri = recorder.uri || recorderSnapshot?.url || recorderState.url;

      if (!recordingUri) {
        throw new Error('No se encontro el audio grabado.');
      }

      const nextRecording = {
        uri: recordingUri,
        fileName: `transcription-test-${Date.now()}.m4a`,
        mimeType: DEFAULT_AUDIO_MIME_TYPE,
        durationMillis: recorderState.durationMillis || 0,
      };

      setRecordedAudio(nextRecording);
      setSelectedAudio(null);
      setActiveAudioSource('recorded');
      setStatusText(`Audio grabado correctamente (${formatDuration(nextRecording.durationMillis)}).`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo detener la grabacion.';
      console.error('[TranscriptionTestScreen] Error deteniendo grabacion:', error);
      setStatusText(message);
      Alert.alert('No se pudo detener la grabacion', message);
    }
  }, [recorder, recorderState.durationMillis, recorderState.url]);

  const handleSelectAudioFile = useCallback(async () => {
    try {
      setStatusText('Abriendo selector de audio...');

      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) {
        setStatusText('Seleccion de audio cancelada por el usuario.');
        return;
      }

      const asset = result.assets?.[0];

      if (!asset) {
        throw new Error('No se recibio ningun archivo de audio.');
      }

      if (!asset.uri) {
        throw new Error('El archivo seleccionado no tiene una URI valida.');
      }

      const resolvedFileName =
        asset.name || getFileNameFromUri(asset.uri) || `audio-${Date.now()}.m4a`;
      const resolvedMimeType = asset.mimeType || getMimeTypeFromFileName(resolvedFileName);

      if (!isSupportedAudioSelection({ fileName: resolvedFileName, mimeType: resolvedMimeType })) {
        throw new Error('Archivo no compatible. Usa .m4a, .mp3, .wav, .aac u .ogg.');
      }

      setSelectedAudio({
        uri: asset.uri,
        fileName: resolvedFileName,
        mimeType: resolvedMimeType || DEFAULT_AUDIO_MIME_TYPE,
      });
      setActiveAudioSource('selected');
      setTranscriptText('');
      setStatusText('Audio seleccionado correctamente.');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'No se pudo seleccionar el archivo de audio.';
      console.error('[TranscriptionTestScreen] Error seleccionando audio:', error);
      setStatusText(message);
      Alert.alert('No se pudo seleccionar el audio', message);
    }
  }, []);

  const handleUploadForTranscription = useCallback(async () => {
    if (!activeAudio?.uri) {
      const message = 'No hay audio seleccionado ni grabado para enviar a transcribir.';
      setStatusText(message);
      Alert.alert('Audio no disponible', message);
      return;
    }

    try {
      setIsUploading(true);
      setTranscriptText('');
      setStatusText(
        'Transcribiendo con Whisper, esto puede tardar varios minutos. No cierres la app.'
      );

      const formData = new FormData();
      formData.append('audio', {
        uri: activeAudio.uri,
        name: activeAudio.fileName || 'audio.m4a',
        type: activeAudio.mimeType || DEFAULT_AUDIO_MIME_TYPE,
      });

      const response = await fetch(`${WHISPER_BASE_URL}/api/transcribir`, {
        body: formData,
        method: 'POST',
      });
      const payload = await parseApiResponse(response);

      if (!response.ok) {
        throw new Error(
          payload?.message ||
            payload?.error ||
            `El servidor respondio con estado ${response.status}.`
        );
      }

      if (payload?.ok === false) {
        throw new Error(payload?.message || payload?.error || 'El backend devolvio ok:false.');
      }

      const nextTranscript =
        payload?.transcript ||
        payload?.transcripcion ||
        payload?.text ||
        payload?.texto ||
        payload?.result?.transcript ||
        payload?.data?.transcript ||
        '';

      setTranscriptText(nextTranscript);
      setStatusText(
        nextTranscript
          ? 'Transcripcion recibida correctamente.'
          : 'El servidor respondio, pero no devolvio texto transcripto.'
      );
    } catch (error) {
      const message = buildNetworkErrorMessage(error);
      console.error('[TranscriptionTestScreen] Error transcribiendo audio:', error);
      setTranscriptText('');
      setStatusText(message);
      Alert.alert('No se pudo transcribir el audio', message);
    } finally {
      setIsUploading(false);
    }
  }, [activeAudio]);

  const liveStatus = useMemo(() => {
    if (recorderState.isRecording) {
      return `Grabando... ${formatDuration(recorderState.durationMillis)}`;
    }

    return statusText;
  }, [recorderState.durationMillis, recorderState.isRecording, statusText]);

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      style={styles.screen}
    >
      <View style={styles.heroCard}>
        <View style={styles.heroIcon}>
          <MaterialCommunityIcons color={colors.textOnPrimary} name="microphone-message" size={28} />
        </View>
        <Text style={styles.heroTitle}>Prueba de transcripcion</Text>
        <Text style={styles.heroSubtitle}>
          Graba o selecciona un audio, verifica conexion con Whisper y envia el archivo al endpoint
          configurado.
        </Text>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Controles</Text>
        <Text style={styles.sectionSubtitle}>
          Usa esta pantalla para validar permisos, seleccion de archivos y respuesta del backend.
        </Text>

        <View style={styles.buttonGrid}>
          <ActionButton
            disabled={isCheckingConnection || isUploading || recorderState.isRecording}
            label={isCheckingConnection ? 'Probando conexion...' : 'Probar conexion'}
            onPress={() => void handleCheckConnection()}
            styles={styles}
            variant="secondary"
          />
          <ActionButton
            disabled={recorderState.isRecording || isUploading}
            label="Iniciar grabacion"
            onPress={() => void handleStartRecording()}
            styles={styles}
            variant="primary"
          />
          <ActionButton
            disabled={!recorderState.isRecording}
            label="Detener grabacion"
            onPress={() => void handleStopRecording()}
            styles={styles}
            variant="secondary"
          />
          <ActionButton
            disabled={isUploading || recorderState.isRecording}
            label="Seleccionar audio"
            onPress={() => void handleSelectAudioFile()}
            styles={styles}
            variant="secondary"
          />
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoLabel}>Estado</Text>
        <Text style={styles.infoText}>{liveStatus}</Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoLabel}>Audio grabado</Text>
        <Text style={styles.infoText}>
          {recordedAudio?.fileName
            ? `${recordedAudio.fileName} (${formatDuration(recordedAudio.durationMillis)})`
            : 'Todavia no se genero un archivo local.'}
        </Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoLabel}>Archivo seleccionado</Text>
        <Text style={styles.infoText}>
          {selectedAudio?.fileName || 'Todavia no se selecciono ningun archivo.'}
        </Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoLabel}>Audio listo para enviar</Text>
        <Text style={styles.infoText}>{describeAudio(activeAudio, activeAudioSource)}</Text>
      </View>

      <View style={styles.uploadActionContainer}>
        <ActionButton
          disabled={!hasReadyAudio || isUploading || recorderState.isRecording}
          label={
            isUploading ? 'Enviando audio a transcribir...' : 'Enviar audio a transcribir'
          }
          onPress={() => void handleUploadForTranscription()}
          styles={styles}
          variant="uploadPrimary"
        />
      </View>

      <View style={styles.transcriptCard}>
        <Text style={styles.infoLabel}>Texto transcripto</Text>
        <Text style={styles.transcriptText}>
          {transcriptText || 'La transcripcion aparecera aqui cuando el servidor responda.'}
        </Text>
      </View>
    </ScrollView>
  );
}

function ActionButton({ disabled, label, onPress, styles, variant }) {
  const isPrimary = variant === 'primary';
  const isUploadPrimary = variant === 'uploadPrimary';
  const buttonStyle = isUploadPrimary
    ? styles.uploadPrimaryButton
    : isPrimary
      ? styles.primaryButton
      : styles.secondaryButton;
  const textStyle = isUploadPrimary
    ? styles.uploadPrimaryButtonText
    : isPrimary
      ? styles.primaryButtonText
      : styles.secondaryButtonText;

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={[buttonStyle, disabled && styles.buttonDisabled]}
    >
      <Text style={[textStyle, disabled && styles.buttonTextDisabled]}>{label}</Text>
    </Pressable>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      paddingHorizontal: 20,
      paddingTop: 24,
      paddingBottom: 34,
      gap: 18,
    },
    heroCard: {
      backgroundColor: colors.primaryDeep,
      borderRadius: 30,
      padding: 24,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 14 },
      shadowOpacity: 0.22,
      shadowRadius: 24,
      elevation: 8,
    },
    heroIcon: {
      width: 56,
      height: 56,
      borderRadius: 18,
      backgroundColor: 'rgba(255,255,255,0.14)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroTitle: {
      color: colors.textOnPrimary,
      fontSize: 24,
      fontWeight: '800',
      marginTop: 18,
    },
    heroSubtitle: {
      color: 'rgba(255,255,255,0.8)',
      fontSize: 14,
      lineHeight: 21,
      marginTop: 8,
    },
    sectionCard: {
      backgroundColor: colors.card,
      borderRadius: 26,
      padding: 18,
      borderWidth: 1,
      borderColor: colors.borderSoft,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.12,
      shadowRadius: 20,
      elevation: 4,
    },
    sectionTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '700',
    },
    sectionSubtitle: {
      color: colors.textSecondary,
      fontSize: 13,
      lineHeight: 20,
      marginTop: 6,
    },
    buttonGrid: {
      gap: 10,
      marginTop: 18,
    },
    uploadActionContainer: {
      marginTop: -4,
    },
    primaryButton: {
      minHeight: 48,
      borderRadius: 16,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 14,
    },
    secondaryButton: {
      minHeight: 48,
      borderRadius: 16,
      backgroundColor: colors.backgroundAlt,
      borderWidth: 1,
      borderColor: colors.borderSoft,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 14,
    },
    uploadPrimaryButton: {
      minHeight: 54,
      borderRadius: 18,
      backgroundColor: '#2563EB',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 20,
      paddingVertical: 14,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.18,
      shadowRadius: 16,
      elevation: 4,
    },
    buttonDisabled: {
      opacity: 0.55,
    },
    primaryButtonText: {
      color: colors.textOnPrimary,
      fontSize: 14,
      fontWeight: '700',
      textAlign: 'center',
    },
    uploadPrimaryButtonText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '800',
      textAlign: 'center',
    },
    secondaryButtonText: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '700',
      textAlign: 'center',
    },
    buttonTextDisabled: {
      color: colors.textMuted,
    },
    infoCard: {
      backgroundColor: colors.card,
      borderRadius: 22,
      padding: 18,
      borderWidth: 1,
      borderColor: colors.borderSoft,
      gap: 8,
    },
    infoLabel: {
      color: colors.text,
      fontSize: 13,
      fontWeight: '700',
    },
    infoText: {
      color: colors.textSecondary,
      fontSize: 13,
      lineHeight: 20,
    },
    transcriptCard: {
      backgroundColor: colors.accentSoft,
      borderRadius: 22,
      padding: 18,
      gap: 8,
      borderWidth: 1,
      borderColor: colors.borderSoft,
    },
    transcriptText: {
      color: colors.text,
      fontSize: 14,
      lineHeight: 22,
    },
  });
