import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, TextInput } from 'react-native';
import { useTheme } from '../../utils/ThemeContext';
import { ThemeColors } from '../../utils/theme';
import { Mic, PenTool, BookOpen, Clock, Activity, FileText } from 'lucide-react-native';

export const JournalScreen = () => {
  const theme = useTheme();
  const styles = createStyles(theme.colors);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.dateText}>TUESDAY, SEPT 10 • COGNITIVE LOG & ARCHIVE</Text>
            <Text style={styles.title}>Notes & Journal</Text>
            <Text style={styles.subtitle}>Executive cognitive index & logs</Text>
          </View>
          <TouchableOpacity style={styles.newEntryButton}>
            <Text style={styles.newEntryText}>+ New Entry</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Capture */}
        <View style={styles.captureCard}>
          <View style={styles.captureInputRow}>
            <View style={styles.iconBox}>
              <PenTool color={theme.colors.neonCyan} size={16} />
            </View>
            <TextInput 
              placeholder="Capture insight, decision, or mental model..."
              placeholderTextColor={theme.colors.mutedText}
              style={styles.captureInput}
            />
            <TouchableOpacity style={styles.micButton}>
              <Mic color={theme.colors.mutedText} size={18} />
            </TouchableOpacity>
          </View>
          <View style={styles.captureMeta}>
            <View style={styles.clarityBadge}>
              <View style={styles.dotCyan} />
              <Text style={styles.clarityText}>CLARITY: 9.4</Text>
            </View>
            <View style={styles.tagsContainer}>
              <Text style={styles.metaLabel}>STATE: HIGH FLOW</Text>
              <View style={styles.tag}><Text style={styles.tagText}>#idea</Text></View>
              <View style={styles.tag}><Text style={styles.tagText}>#decision</Text></View>
              <View style={styles.tag}><Text style={styles.tagText}>#framework</Text></View>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll} contentContainerStyle={styles.tabsContainer}>
          <TouchableOpacity style={[styles.tab, styles.tabActive]}>
            <Text style={styles.tabTextActive}>All 14</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tab}>
            <Text style={styles.tabText}>Daily Journal</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tab}>
            <Text style={styles.tabText}>Ventures & Ideas</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Draft in Progress */}
        <View style={styles.sectionHeader}>
          <BookOpen color={theme.colors.neonCyan} size={14} />
          <Text style={styles.sectionTitle}>EVENING DEBRIEF • 08:45 PM</Text>
          <Text style={styles.sectionTime}>SEPT 10</Text>
        </View>
        
        <View style={styles.draftCard}>
          <View style={styles.draftHeader}>
            <View style={styles.draftBadge}><Text style={styles.draftBadgeText}>DRAFT IN PROGRESS</Text></View>
            <Text style={styles.draftWords}>420 words</Text>
            <TouchableOpacity><Text style={styles.editText}>EDIT ↗</Text></TouchableOpacity>
          </View>

          <View style={styles.draftBlock}>
            <Text style={styles.blockTitleCyan}>△ CORE WIN & KINETIC OUTPUT</Text>
            <Text style={styles.blockText}>Closed Q3 enterprise retainer early. Hypertrophy volume hit with perfect RPE calibration, zero tendon friction.</Text>
          </View>
          
          <View style={styles.draftBlock}>
            <Text style={styles.blockTitleYellow}>○ COGNITIVE FRICTION & DETOURS</Text>
            <Text style={styles.blockText}>Delegation bottleneck in sprint architecture. PR review pipeline needs async decoupling to avoid blocking engineers.</Text>
          </View>

          <View style={styles.draftBlock}>
            <Text style={styles.blockTitleCyan}>⚑ PRIME DIRECTIVES (TOMORROW)</Text>
            <Text style={styles.blockText}>3 consecutive deep-work cycles (08:00-11:30), fasting window sustained to 13:00, finalize Seed Series deck layout.</Text>
          </View>

          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Completion: 85%</Text>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: '85%' }]} />
            </View>
          </View>
        </View>

        {/* Cognitive Vault */}
        <View style={styles.sectionHeader}>
          <Activity color={theme.colors.neonCyan} size={14} />
          <Text style={styles.sectionTitle}>COGNITIVE VAULT & IDEAS</Text>
          <Text style={styles.viewAll}>VIEW ALL</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardTop}>
            <View style={styles.cardTags}>
              <View style={styles.dotCyan} />
              <Text style={styles.cardTagText}>#VENTURE #BIOHACKING</Text>
            </View>
            <Text style={styles.cardTime}>2h ago</Text>
          </View>
          <Text style={styles.cardTitle}>AI Copilot for Real-Time Executive Biometrics</Text>
          <Text style={styles.cardDesc}>Continuous glucose + HRV cross-referenced with Google Calendar load. Intercepts afternoon cognitive slumps by preemptively adjusting hydration & micro-protocols.</Text>
          <View style={styles.cardActions}>
            <View style={styles.tag}><Text style={styles.tagText}>Validation: Stage 1</Text></View>
            <View style={styles.tag}><Text style={styles.tagText}>ROI: High</Text></View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardTop}>
            <View style={styles.cardTags}>
              <Mic color={theme.colors.warningYellow} size={12} />
              <Text style={[styles.cardTagText, { color: theme.colors.warningYellow }]}>VOICE MEMO TRANSCRIPT</Text>
            </View>
            <Text style={styles.cardTime}>Yesterday • 12:45 min</Text>
          </View>
          <Text style={styles.cardTitle}>Cold Enterprise Outreach Architecture</Text>
          <View style={styles.audioPlayer}>
             <View style={styles.playButton}><Text style={{color: '#000', fontWeight: 'bold'}}>▶</Text></View>
             <View style={styles.waveform}><View style={styles.waveBar}/><View style={styles.waveBar}/><View style={styles.waveBar}/></View>
             <Text style={styles.audioTime}>0:42 / 2:45</Text>
          </View>
          <Text style={styles.cardDesc}>✨ AI Summary: Ditch transactional pitch decks; anchor outreach entirely on asymmetry of engineering talent in enterprise automation.</Text>
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
    color: colors.mutedText,
    letterSpacing: 1,
    marginBottom: 8,
  },
  title: {
    fontFamily: 'Geist_700Bold',
    fontSize: 28,
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'Geist_400Regular',
    fontSize: 14,
    color: colors.mutedText,
  },
  newEntryButton: {
    backgroundColor: colors.neonCyan,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  newEntryText: {
    color: colors.obsidian,
    fontFamily: 'Geist_700Bold',
    fontSize: 13,
  },
  captureCard: {
    backgroundColor: colors.surfaceCard,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  captureInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  captureInput: {
    flex: 1,
    color: colors.text,
    fontFamily: 'Geist_400Regular',
    fontSize: 15,
  },
  micButton: {
    padding: 8,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 12,
  },
  captureMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  clarityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  dotCyan: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.neonCyan,
    marginRight: 6,
  },
  clarityText: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 10,
    color: colors.text,
  },
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaLabel: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 9,
    color: colors.mutedText,
    marginRight: 4,
  },
  tag: {
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagText: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 10,
    color: colors.mutedText,
  },
  tabsScroll: {
    marginBottom: 24,
  },
  tabsContainer: {
    gap: 12,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: {
    backgroundColor: colors.neonCyan,
    borderColor: colors.neonCyan,
  },
  tabText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 13,
    color: colors.mutedText,
  },
  tabTextActive: {
    fontFamily: 'Geist_700Bold',
    fontSize: 13,
    color: colors.obsidian,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 11,
    color: colors.text,
    letterSpacing: 1,
    marginLeft: 8,
    flex: 1,
  },
  sectionTime: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 10,
    color: colors.mutedText,
  },
  viewAll: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 10,
    color: colors.neonCyan,
    letterSpacing: 1,
  },
  draftCard: {
    backgroundColor: colors.surfaceCard,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  draftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  draftBadge: {
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  draftBadgeText: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 10,
    color: colors.neonCyan,
  },
  draftWords: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 10,
    color: colors.mutedText,
    flex: 1,
    marginLeft: 12,
  },
  editText: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 10,
    color: colors.neonCyan,
  },
  draftBlock: {
    marginBottom: 16,
  },
  blockTitleCyan: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 10,
    color: colors.neonCyan,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  blockTitleYellow: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 10,
    color: colors.warningYellow,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  blockText: {
    fontFamily: 'Geist_400Regular',
    fontSize: 13,
    color: colors.text,
    lineHeight: 20,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  progressLabel: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 10,
    color: colors.mutedText,
    marginRight: 12,
  },
  progressBarBg: {
    flex: 1,
    height: 4,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 2,
  },
  progressBarFill: {
    height: 4,
    backgroundColor: colors.neonCyan,
    borderRadius: 2,
  },
  card: {
    backgroundColor: colors.surfaceCard,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTagText: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 10,
    color: colors.neonCyan,
    letterSpacing: 0.5,
  },
  cardTime: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 10,
    color: colors.mutedText,
  },
  cardTitle: {
    fontFamily: 'Geist_700Bold',
    fontSize: 15,
    color: colors.text,
    marginBottom: 8,
  },
  cardDesc: {
    fontFamily: 'Geist_400Regular',
    fontSize: 13,
    color: colors.mutedText,
    lineHeight: 20,
    marginBottom: 16,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  audioPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  playButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.neonCyan,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  waveform: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  waveBar: {
    width: 3,
    height: 12,
    backgroundColor: colors.neonCyan,
    borderRadius: 2,
  },
  audioTime: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 10,
    color: colors.mutedText,
  }
});
