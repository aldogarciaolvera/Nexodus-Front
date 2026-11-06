import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Scale, Ruler, Zap, Target, Clock } from 'lucide-react-native';
import { useTheme } from '../../../utils/ThemeContext';
import { ThemeColors } from '../../../utils/theme';

interface DietHelpModalProps {
  visible: boolean;
  onClose: () => void;
}

export const DietHelpModal: React.FC<DietHelpModalProps> = ({
  visible,
  onClose,
}) => {
  const theme = useTheme();
  const styles = createStyles(theme.colors);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Guía de Medición & Ayudas</Text>
            <Text style={styles.headerSubtitle}>Cómo obtener tus datos fácilmente en casa</Text>
          </View>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Cerrar guía de ayuda"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={20} color={theme.colors.mutedText} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Card 1: Peso */}
          <View style={styles.guideCard}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.iconBox}>
                <Scale size={18} color={theme.colors.neonCyan} />
              </View>
              <Text style={styles.cardHeaderTitle}>¿Cómo obtener tu Peso?</Text>
            </View>

            <Text style={styles.guideText}>
              • <Text style={styles.boldText}>Con báscula:</Text> Pésate por la mañana, en ayunas, después de ir al baño y sin ropa para mayor exactitud.
            </Text>
            <Text style={styles.guideText}>
              • <Text style={styles.boldText}>Sin báscula en casa:</Text> La mayoría de farmacias y supermercados tienen básculas digitales en la entrada. También puedes consultar tu último chequeo médico.
            </Text>
          </View>

          {/* Card 2: Altura */}
          <View style={styles.guideCard}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.iconBox}>
                <Ruler size={18} color={theme.colors.neonCyan} />
              </View>
              <Text style={styles.cardHeaderTitle}>¿Cómo medir tu Altura?</Text>
            </View>

            <Text style={styles.guideText}>
              • <Text style={styles.boldText}>Técnica de la pared y el libro:</Text>
            </Text>
            <Text style={styles.stepText}>1. Quítate el calzado y párate descalzo de espaldas contra una pared lisa.</Text>
            <Text style={styles.stepText}>2. Junta los talones y mantén glúteos, hombros y cabeza tocando la pared con la vista al frente.</Text>
            <Text style={styles.stepText}>3. Apoya un libro o libreta plana en tu cabeza perpendicularmente a la pared.</Text>
            <Text style={styles.stepText}>4. Marca la pared con un lápiz justo debajo del libro y mide la distancia al suelo con una cinta métrica.</Text>
            <Text style={styles.guideText}>
              • <Text style={styles.boldText}>Documentos:</Text> Puedes revisar tu estatura oficial en tu licencia de conducir o examen médico reciente.
            </Text>
          </View>

          {/* Card 3: Nivel de Actividad */}
          <View style={styles.guideCard}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.iconBox}>
                <Zap size={18} color={theme.colors.neonCyan} />
              </View>
              <Text style={styles.cardHeaderTitle}>¿Qué Nivel de Actividad elegir?</Text>
            </View>

            <Text style={styles.guideText}>
              • <Text style={styles.boldText}>Sedentario (x1.2):</Text> Trabajo de oficina / estudio, menos de 5,000 pasos al día y sin ejercicio regular.
            </Text>
            <Text style={styles.guideText}>
              • <Text style={styles.boldText}>Ligero (x1.375):</Text> Caminatas diarias o 1 a 2 sesiones de entrenamiento a la semana.
            </Text>
            <Text style={styles.guideText}>
              • <Text style={styles.boldText}>Moderado (x1.55):</Text> 3 a 5 días de entrenamiento con pesas o cardio (la opción recomendada para la mayoría de usuarios de Gym).
            </Text>
            <Text style={styles.guideText}>
              • <Text style={styles.boldText}>Muy Activo (x1.725):</Text> 6 a 7 días de entrenamiento intenso semanal o trabajo físico pesado.
            </Text>
          </View>

          {/* Card 4: Objetivo Nutricional */}
          <View style={styles.guideCard}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.iconBox}>
                <Target size={18} color={theme.colors.neonCyan} />
              </View>
              <Text style={styles.cardHeaderTitle}>¿Cuál es tu Objetivo?</Text>
            </View>

            <Text style={styles.guideText}>
              • <Text style={styles.boldText}>Definición (-450 kcal):</Text> Ideal si tienes grasa abdominal o corporal que deseas reducir manteniendo el músculo que construyes en el gym.
            </Text>
            <Text style={styles.guideText}>
              • <Text style={styles.boldText}>Mantenimiento (±0 kcal):</Text> Ideal si te gusta tu peso actual y buscas recomposición corporal (perder grasa y ganar músculo simultáneamente) con máxima energía.
            </Text>
            <Text style={styles.guideText}>
              • <Text style={styles.boldText}>Volumen Magro (+300 kcal):</Text> Ideal si eres delgado, te cuesta subir de peso o buscas aumentar el tamaño muscular y fuerza de forma prioritaria.
            </Text>
          </View>

          {/* Card 5: Ayuno Intermitente */}
          <View style={styles.guideCard}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.iconBox}>
                <Clock size={18} color={theme.colors.neonCyan} />
              </View>
              <Text style={styles.cardHeaderTitle}>Protocolos de Ayuno</Text>
            </View>

            <Text style={styles.guideText}>
              • <Text style={styles.boldText}>Ayuno 16:8:</Text> Comes durante una ventana de 8 horas (ej. de 12:00 PM a 08:00 PM) y ayunas las 16 horas restantes (la mayor parte mientras duermes). Mejora la sensibilidad a la insulina y facilita el control calórico.
            </Text>
            <Text style={styles.guideText}>
              • <Text style={styles.boldText}>Tradicional:</Text> Si te gusta desayunar temprano o repartir tus comidas a lo largo de todo el día sin restricción de reloj.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.obsidian,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderGlow,
  },
  headerTitle: {
    fontFamily: 'Geist_700Bold',
    fontSize: 18,
    color: colors.text,
  },
  headerSubtitle: {
    fontFamily: 'Geist_400Regular',
    fontSize: 12,
    color: colors.mutedText,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    backgroundColor: colors.surfaceLight,
    borderRadius: 8,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 16,
    paddingBottom: 40,
  },
  guideCard: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderGlow,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.3)',
  },
  cardHeaderTitle: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 15,
    color: colors.text,
  },
  guideText: {
    fontFamily: 'Geist_400Regular',
    fontSize: 13,
    color: colors.slate300,
    lineHeight: 19,
    marginBottom: 8,
  },
  stepText: {
    fontFamily: 'Geist_400Regular',
    fontSize: 12,
    color: colors.mutedText,
    lineHeight: 18,
    marginLeft: 12,
    marginBottom: 4,
  },
  boldText: {
    fontFamily: 'Geist_600SemiBold',
    color: colors.text,
  },
});
