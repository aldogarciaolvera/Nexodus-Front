import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, TextInput } from 'react-native';
import { useTheme } from '../../utils/ThemeContext';
import { ThemeColors } from '../../utils/theme';
import { Activity, Clock, Flame, Play, Search, Target, CheckCircle2, MoreHorizontal } from 'lucide-react-native';

export const GymScreen = () => {
  const theme = useTheme();
  const styles = createStyles(theme.colors);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.dateText}>TUESDAY, SEPT 10 • SPLIT DAY 2</Text>
            <Text style={styles.title}>Legs & Core Split</Text>
          </View>
          <TouchableOpacity style={styles.logButton}>
            <Text style={styles.logText}>+ Log</Text>
          </TouchableOpacity>
        </View>

        {/* Session Execution Card */}
        <View style={styles.sessionCard}>
          <View style={styles.sessionTop}>
            <View style={styles.sessionInfo}>
              <Text style={styles.microcycleText}>HYPERTROPHY MICROCYCLE</Text>
              <Text style={styles.sessionTitle}>Session Execution</Text>
              <Text style={styles.sessionFocus}>Focus: Mechanical Tension & Pelvic Alignment</Text>
            </View>
            <View style={styles.progressCircle}>
              <Text style={styles.progressText}>50%</Text>
              <Text style={styles.progressSub}>2/4</Text>
            </View>
          </View>

          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>DURATION</Text>
              <Text style={styles.metricValue}>28:45</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>EXERCISES</Text>
              <Text style={styles.metricValue}>2 / 4</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>TOTAL SETS</Text>
              <Text style={styles.metricValue}>7 / 14</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>BURN</Text>
              <Text style={[styles.metricValue, { color: theme.colors.neonCyan }]}>384 kcal</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.resumeButton}>
            <View style={styles.playIconContainer}>
              <Play color={theme.colors.obsidian} size={12} fill={theme.colors.obsidian} />
            </View>
            <View>
              <Text style={styles.resumeTitle}>Resume Protocol</Text>
              <Text style={styles.resumeSub}>Next: Set 3 Bulgarian Split Squat</Text>
            </View>
            <View style={{flex:1}}/>
            <Text style={{color: theme.colors.mutedText}}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Strain Distribution */}
        <View style={styles.strainContainer}>
          <View style={styles.strainHeader}>
            <Text style={styles.sectionTitle}>STRAIN DISTRIBUTION</Text>
            <Text style={styles.volumeBalanced}>Volume Balanced</Text>
          </View>
          <View style={styles.strainTags}>
            <View style={styles.strainTag}><View style={[styles.dot, {backgroundColor: theme.colors.error}]}/><Text style={styles.strainText}>Quads: High</Text></View>
            <View style={styles.strainTag}><View style={[styles.dot, {backgroundColor: theme.colors.warning}]}/><Text style={styles.strainText}>Hamstrings: Mod</Text></View>
            <View style={styles.strainTag}><View style={[styles.dot, {backgroundColor: theme.colors.error}]}/><Text style={styles.strainText}>Core: High</Text></View>
            <View style={styles.strainTag}><View style={[styles.dot, {backgroundColor: theme.colors.mutedText}]}/><Text style={styles.strainText}>Calves: Base</Text></View>
          </View>
          <View style={styles.streakRow}>
            <Text style={styles.streakLabel}>STREAK: 4 DAYS</Text>
            <View style={styles.daysContainer}>
              {['M','T','W','T','F','S','S'].map((day, i) => (
                <View key={i} style={[styles.dayCircle, i === 1 && styles.dayCircleActive, i < 1 && styles.dayCircleCompleted]}>
                  {i < 1 ? <CheckCircle2 size={12} color={theme.colors.neonCyan} /> : <Text style={[styles.dayText, i === 1 && styles.dayTextActive]}>{day}</Text>}
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Exercise Protocol */}
        <View style={styles.protocolHeader}>
          <Text style={styles.sectionTitle}>Exercise Protocol</Text>
          <Text style={styles.targetText}>TARGET: 4 TOTAL</Text>
        </View>

        <View style={styles.exerciseCard}>
          <View style={styles.exerciseTop}>
            <View style={styles.exerciseIcon}><Activity color={theme.colors.obsidian} size={16}/></View>
            <View style={styles.exerciseInfo}>
              <Text style={styles.exerciseTitle}>Barbell Back Squats</Text>
              <Text style={styles.exerciseSub}><Text style={{color: theme.colors.neonCyan}}>COMPLETED</Text> • 4 SETS • RPE 8.5</Text>
            </View>
            <Text style={styles.volumeText}>1,820 kg Vol</Text>
          </View>
          <View style={styles.setsRow}>
            {['100k × 10', '110k × 8', '115k × 6', '120k × 4'].map((set, i) => (
              <View key={i} style={styles.setBox}>
                <Text style={styles.setLabel}>S{i+1}</Text>
                <Text style={styles.setValue}>{set}</Text>
                <Text style={styles.setDone}>✓ Done</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.activeExerciseCard}>
          <View style={styles.activeTop}>
            <View>
              <Text style={styles.activeFocus}>CURRENT FOCUS • SET 3 OF 4</Text>
              <Text style={styles.activeTitle}>Bulgarian Split Squats</Text>
              <Text style={styles.activeSub}>Dual 28kg Hex Dumbbells • Target 10 reps / leg</Text>
            </View>
            <View style={styles.expandIcon}><MoreHorizontal color={theme.colors.neonCyan} size={16}/></View>
          </View>

          <View style={styles.restCard}>
            <View style={styles.restIcon}><Clock color={theme.colors.neonCyan} size={16}/></View>
            <View style={{flex:1}}>
              <Text style={styles.restTitle}>Rest Window: 00:45</Text>
              <Text style={styles.restSub}>Auto-advances next interval</Text>
            </View>
            <TouchableOpacity style={styles.addTimeBtn}><Text style={styles.addTimeText}>+30s</Text></TouchableOpacity>
          </View>

          <View style={styles.actionRow}>
            <View style={styles.repsControl}>
              <TouchableOpacity><Text style={styles.repsBtn}>-</Text></TouchableOpacity>
              <View style={styles.repsValueContainer}>
                <Text style={styles.repsValue}>10</Text>
                <Text style={styles.repsLabel}>REPS</Text>
              </View>
              <TouchableOpacity><Text style={styles.repsBtn}>+</Text></TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.completeBtn}>
              <CheckCircle2 color={theme.colors.obsidian} size={16} />
              <Text style={styles.completeBtnText}>Complete Set 3</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.queuedCard}>
          <View style={styles.queuedNumber}><Text style={styles.queuedNumberText}>3</Text></View>
          <View style={styles.queuedInfo}>
            <Text style={styles.queuedTitle}>Hanging Leg Raises</Text>
            <View style={styles.queuedSubRow}>
              <Text style={styles.queuedSub}>3 SETS • 15 REPS</Text>
              <Text style={styles.queuedSub}>• Bodyweight + 5kg Ankle</Text>
            </View>
          </View>
          <Text style={styles.queuedLabel}>QUEUED</Text>
        </View>

        <View style={styles.queuedCard}>
          <View style={styles.queuedNumber}><Text style={styles.queuedNumberText}>4</Text></View>
          <View style={styles.queuedInfo}>
            <Text style={styles.queuedTitle}>Plank to Push-up Finisher</Text>
            <View style={styles.queuedSubRow}>
              <Text style={styles.queuedSub}>3 ROUNDS • 60S HOLD</Text>
              <Text style={styles.queuedSub}>• Core Stability</Text>
            </View>
          </View>
          <Text style={styles.queuedLabel}>QUEUED</Text>
        </View>

        <View style={styles.readinessCard}>
          <View style={styles.readinessHeader}>
            <Activity color={theme.colors.neonCyan} size={16} />
            <Text style={styles.readinessTitle}>PHYSIOLOGY READINESS</Text>
            <Text style={styles.readinessScore}>88% Optimal</Text>
          </View>
          <View style={styles.readinessMetrics}>
            <View style={styles.rMetric}>
              <Text style={styles.rLabel}>HRV BASELINE</Text>
              <Text style={styles.rValue}>74 ms <Text style={{color: theme.colors.mutedText}}>(+6%)</Text></Text>
              <View style={[styles.rBar, { backgroundColor: theme.colors.neonCyan }]} />
            </View>
            <View style={styles.rMetric}>
              <Text style={styles.rLabel}>CNS FATIGUE</Text>
              <Text style={styles.rValue}>Mild • <Text style={{color: theme.colors.mutedText}}>Recovered</Text></Text>
              <View style={[styles.rBar, { backgroundColor: theme.colors.surfaceLight }]} />
            </View>
          </View>
          <Text style={styles.rNotice}>ⓘ Next scheduled lower-body strain: 48 hr window recommended before Heavy Compound Hinges.</Text>
        </View>

        <View style={styles.appendInputContainer}>
          <Search color={theme.colors.mutedText} size={16} />
          <TextInput 
            style={styles.appendInput}
            placeholder="Append exercise, superset or tempo"
            placeholderTextColor={theme.colors.mutedText}
          />
          <TouchableOpacity style={styles.addExerciseBtn}>
            <Activity color={theme.colors.text} size={12} />
            <Text style={styles.addExerciseText}>ADD</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.obsidian,
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    marginTop: 20,
  },
  dateText: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 10,
    color: colors.neonCyan,
    letterSpacing: 1,
    marginBottom: 8,
  },
  title: {
    fontFamily: 'Geist_700Bold',
    fontSize: 28,
    color: colors.text,
  },
  logButton: {
    backgroundColor: colors.neonCyan,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  logText: {
    color: colors.obsidian,
    fontFamily: 'Geist_700Bold',
    fontSize: 13,
  },
  sessionCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.borderGlow,
  },
  sessionTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  sessionInfo: {
    flex: 1,
  },
  microcycleText: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 10,
    color: colors.neonCyan,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  sessionTitle: {
    fontFamily: 'Geist_700Bold',
    fontSize: 18,
    color: colors.text,
    marginBottom: 4,
  },
  sessionFocus: {
    fontFamily: 'Geist_400Regular',
    fontSize: 13,
    color: colors.mutedText,
  },
  progressCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: colors.neonCyan,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    fontFamily: 'Geist_700Bold',
    fontSize: 12,
    color: colors.text,
  },
  progressSub: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 9,
    color: colors.mutedText,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  metricItem: {
    alignItems: 'flex-start',
  },
  metricLabel: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 9,
    color: colors.mutedText,
    marginBottom: 4,
  },
  metricValue: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 13,
    color: colors.text,
  },
  resumeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    padding: 12,
    borderRadius: 12,
  },
  playIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.neonCyan,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  resumeTitle: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 13,
    color: colors.text,
  },
  resumeSub: {
    fontFamily: 'Geist_400Regular',
    fontSize: 11,
    color: colors.mutedText,
  },
  strainContainer: {
    marginBottom: 24,
  },
  strainHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 11,
    color: colors.mutedText,
    letterSpacing: 1,
  },
  volumeBalanced: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 10,
    color: colors.neonCyan,
  },
  strainTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  strainTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderGlow,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  strainText: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 10,
    color: colors.text,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakLabel: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 10,
    color: colors.mutedText,
    marginRight: 12,
  },
  daysContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  dayCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleActive: {
    backgroundColor: colors.neonCyan,
  },
  dayCircleCompleted: {
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
  },
  dayText: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 10,
    color: colors.mutedText,
  },
  dayTextActive: {
    color: colors.obsidian,
  },
  protocolHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  targetText: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 10,
    color: colors.mutedText,
  },
  exerciseCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.borderGlow,
  },
  exerciseTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  exerciseIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.neonCyan,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseTitle: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 15,
    color: colors.text,
  },
  exerciseSub: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 10,
    color: colors.mutedText,
  },
  volumeText: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 11,
    color: colors.text,
  },
  setsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  setBox: {
    flex: 1,
    backgroundColor: colors.surfaceLight,
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  setLabel: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 9,
    color: colors.mutedText,
    marginBottom: 4,
  },
  setValue: {
    fontFamily: 'JetBrainsMono_600SemiBold',
    fontSize: 11,
    color: colors.text,
    marginBottom: 4,
  },
  setDone: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 9,
    color: colors.neonCyan,
  },
  activeExerciseCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.neonCyan,
  },
  activeTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  activeFocus: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 10,
    color: colors.neonCyan,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  activeTitle: {
    fontFamily: 'Geist_700Bold',
    fontSize: 18,
    color: colors.text,
    marginBottom: 4,
  },
  activeSub: {
    fontFamily: 'Geist_400Regular',
    fontSize: 13,
    color: colors.mutedText,
  },
  expandIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  restCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.obsidian,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.borderGlow,
  },
  restIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.neonCyan,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  restTitle: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 13,
    color: colors.text,
  },
  restSub: {
    fontFamily: 'Geist_400Regular',
    fontSize: 11,
    color: colors.mutedText,
  },
  addTimeBtn: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addTimeText: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 11,
    color: colors.text,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  repsControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.obsidian,
    borderRadius: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: colors.borderGlow,
  },
  repsBtn: {
    fontFamily: 'Geist_400Regular',
    fontSize: 18,
    color: colors.text,
    paddingHorizontal: 12,
  },
  repsValueContainer: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  repsValue: {
    fontFamily: 'JetBrainsMono_700Bold',
    fontSize: 16,
    color: colors.text,
  },
  repsLabel: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 9,
    color: colors.mutedText,
  },
  completeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neonCyan,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  completeBtnText: {
    fontFamily: 'Geist_700Bold',
    fontSize: 14,
    color: colors.obsidian,
  },
  queuedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  queuedNumber: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  queuedNumberText: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 11,
    color: colors.mutedText,
  },
  queuedInfo: {
    flex: 1,
  },
  queuedTitle: {
    fontFamily: 'Geist_500Medium',
    fontSize: 14,
    color: colors.text,
  },
  queuedSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  queuedSub: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 10,
    color: colors.mutedText,
  },
  queuedLabel: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 10,
    color: colors.mutedText,
  },
  readinessCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.borderGlow,
  },
  readinessHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  readinessTitle: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 11,
    color: colors.mutedText,
    letterSpacing: 1,
    marginLeft: 8,
    flex: 1,
  },
  readinessScore: {
    fontFamily: 'JetBrainsMono_700Bold',
    fontSize: 11,
    color: colors.neonCyan,
  },
  readinessMetrics: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  rMetric: {
    flex: 1,
  },
  rLabel: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 9,
    color: colors.mutedText,
    marginBottom: 4,
  },
  rValue: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 15,
    color: colors.text,
    marginBottom: 8,
  },
  rBar: {
    height: 4,
    borderRadius: 2,
  },
  rNotice: {
    fontFamily: 'Geist_400Regular',
    fontSize: 11,
    color: colors.mutedText,
    lineHeight: 16,
  },
  appendInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.borderGlow,
  },
  appendInput: {
    flex: 1,
    marginLeft: 12,
    fontFamily: 'Geist_400Regular',
    fontSize: 13,
    color: colors.text,
  },
  addExerciseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  addExerciseText: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 10,
    color: colors.text,
  }
});
