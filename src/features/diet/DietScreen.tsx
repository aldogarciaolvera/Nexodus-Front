import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, TextInput, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '../../utils/ThemeContext';
import { ThemeColors } from '../../utils/theme';
import { Search, Camera, ScanBarcode, Droplet, Clock } from 'lucide-react-native';
import { Header } from '../../components/Header';

export const DietScreen = () => {
  const theme = useTheme();
  const styles = createStyles(theme.colors);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <Header title="Diet & Macros" />

        {/* Macros Summary */}
        <View style={styles.macrosCard}>
          <View style={styles.caloriesRow}>
            <View style={styles.progressCircle}>
              <Text style={styles.consumedLabel}>CONSUMED</Text>
              <Text style={styles.consumedValue}>1,800</Text>
              <Text style={styles.consumedPct}>72%</Text>
            </View>
            <View style={styles.caloriesInfo}>
              <View style={styles.calRow}>
                <Text style={styles.calLabel}>DAILY TARGET</Text>
                <Text style={styles.calValue}>2,500 <Text style={styles.calUnit}>kcal</Text></Text>
              </View>
              <View style={styles.calRow}>
                <Text style={styles.calLabel}>REMAINING</Text>
                <Text style={styles.calValueCyan}>700 <Text style={styles.calUnit}>kcal</Text></Text>
              </View>
              <Text style={styles.paceText}>⚡ Pace: Optimal (+140 kcal surplus cap)</Text>
            </View>
          </View>

          <View style={styles.macrosBars}>
            <View style={styles.macroCol}>
              <View style={styles.macroTopRow}>
                <Text style={styles.macroLabel}>PROTEIN</Text>
                <Text style={styles.macroPct}>79%</Text>
              </View>
              <Text style={styles.macroValues}>150<Text style={styles.macroTarget}>/190g</Text></Text>
              <View style={styles.macroBarBg}><View style={[styles.macroBarFill, {width: '79%'}]}/></View>
              <Text style={styles.macroDesc}>Muscle Preserv.</Text>
            </View>
            <View style={styles.macroCol}>
              <View style={styles.macroTopRow}>
                <Text style={styles.macroLabel}>CARBS</Text>
                <Text style={[styles.macroPct, {color: theme.colors.warning}]}>78%</Text>
              </View>
              <Text style={styles.macroValues}>220<Text style={styles.macroTarget}>/280g</Text></Text>
              <View style={styles.macroBarBg}><View style={[styles.macroBarFill, {width: '78%', backgroundColor: theme.colors.warning}]}/></View>
              <Text style={styles.macroDesc}>Glycogen Replen.</Text>
            </View>
            <View style={styles.macroCol}>
              <View style={styles.macroTopRow}>
                <Text style={styles.macroLabel}>FATS</Text>
                <Text style={[styles.macroPct, {color: theme.colors.mutedText}]}>86%</Text>
              </View>
              <Text style={styles.macroValues}>65<Text style={styles.macroTarget}>/75g</Text></Text>
              <View style={styles.macroBarBg}><View style={[styles.macroBarFill, {width: '86%', backgroundColor: theme.colors.mutedText}]}/></View>
              <Text style={styles.macroDesc}>Endocrine Bal.</Text>
            </View>
          </View>

          <View style={styles.hydrationRow}>
            <View style={styles.hydrationLeft}>
              <Droplet color={theme.colors.neonCyan} size={16} />
              <View style={{marginLeft: 8}}>
                <Text style={styles.hydrationLabel}>HYDRATION METRIC</Text>
                <Text style={styles.hydrationValue}>2.4L <Text style={styles.hydrationTarget}>/ 3.2L Target</Text></Text>
              </View>
            </View>
            <TouchableOpacity style={styles.addWaterBtn}>
              <Text style={styles.addWaterText}>+ 250ml</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Input */}
        <View style={styles.searchInputContainer}>
          <Search color={theme.colors.mutedText} size={18} />
          <TextInput 
            placeholder="Search food, barcode, or paste recipe"
            placeholderTextColor={theme.colors.mutedText}
            style={styles.searchInput}
          />
          <TouchableOpacity style={styles.scanBtn}><ScanBarcode color={theme.colors.mutedText} size={16}/></TouchableOpacity>
          <TouchableOpacity style={styles.cameraBtn}><Camera color={theme.colors.mutedText} size={16}/></TouchableOpacity>
        </View>

        {/* Scheduled Feedings */}
        <View style={styles.feedingsHeader}>
          <Text style={styles.sectionTitle}>SCHEDULED FEEDINGS</Text>
          <Text style={styles.feedingsSummary}>3 Logged • 1 Remaining</Text>
        </View>

        {/* Breakfast */}
        <View style={styles.mealCard}>
          <View style={styles.mealTop}>
            <View style={styles.mealTitleRow}>
              <View style={styles.dotCyan} />
              <Text style={styles.mealTime}>BREAKFAST • 08:15 AM</Text>
            </View>
            <Text style={styles.mealStatus}>Completed</Text>
          </View>
          <View style={styles.mealContent}>
            <View style={styles.mealImgPlaceholder} />
            <View style={styles.mealInfo}>
              <Text style={styles.mealName}>Overnight Oats & Whey Isolate</Text>
              <Text style={styles.mealDesc} numberOfLines={1}>Rolled oats, almond milk, blueberries, whey s...</Text>
            </View>
          </View>
          <View style={styles.mealMacros}>
            <Text style={styles.mealCals}>580 <Text style={styles.mealCalUnit}>kcal</Text></Text>
            <Text style={styles.mealMacroList}>P: 45g   C: 68g   F: 12g</Text>
          </View>
        </View>

        {/* Lunch */}
        <View style={styles.mealCard}>
          <View style={styles.mealTop}>
            <View style={styles.mealTitleRow}>
              <View style={styles.dotCyan} />
              <Text style={styles.mealTime}>LUNCH / POST-WORKOUT • 01:15 PM</Text>
            </View>
            <Text style={styles.mealStatus}>Completed</Text>
          </View>
          <View style={styles.mealContent}>
            <View style={styles.mealImgPlaceholder} />
            <View style={styles.mealInfo}>
              <Text style={styles.mealName}>Wild Salmon Bowl & Quinoa</Text>
              <Text style={styles.mealDesc} numberOfLines={1}>200g Grilled Atlantic salmon, asparagus, avo...</Text>
            </View>
          </View>
          <View style={styles.mealMacros}>
            <Text style={styles.mealCals}>740 <Text style={styles.mealCalUnit}>kcal</Text></Text>
            <Text style={styles.mealMacroList}>P: 58g   C: 72g   F: 22g</Text>
          </View>
        </View>

        {/* Recovery Snack */}
        <View style={styles.mealCard}>
          <View style={styles.mealTop}>
            <View style={styles.mealTitleRow}>
              <View style={styles.dotCyan} />
              <Text style={styles.mealTime}>RECOVERY SNACK • 04:30 PM</Text>
            </View>
            <Text style={styles.mealStatus}>Completed</Text>
          </View>
          <View style={styles.mealContent}>
            <View style={styles.mealImgPlaceholder} />
            <View style={styles.mealInfo}>
              <Text style={styles.mealName}>Greek Yogurt & Raw Honey</Text>
              <Text style={styles.mealDesc} numberOfLines={1}>0% Greek yogurt, crushed walnuts, 1 tbsp ra...</Text>
            </View>
          </View>
          <View style={styles.mealMacros}>
            <Text style={styles.mealCals}>480 <Text style={styles.mealCalUnit}>kcal</Text></Text>
            <Text style={styles.mealMacroList}>P: 47g   C: 80g   F: 31g</Text>
          </View>
        </View>

        {/* Dinner (Planned) */}
        <View style={styles.mealCardPlanned}>
          <View style={styles.mealTop}>
            <View style={styles.mealTitleRow}>
              <View style={styles.dotYellow} />
              <Text style={styles.mealTime}>DINNER • NEXT TARGET • 07:45 PM</Text>
            </View>
            <View style={styles.plannedBadge}><Text style={styles.plannedBadgeText}>Planned</Text></View>
          </View>
          <View style={styles.mealInfoPlanned}>
            <Text style={styles.mealName}>Grass-Fed Flank Steak & Sweet Potato</Text>
            <Text style={styles.mealDesc}>220g Seared flank steak, baked Japanese sweet potato, broccolini</Text>
          </View>
          <View style={styles.mealMacrosPlanned}>
            <Text style={styles.mealCalsYellow}>~700 <Text style={styles.mealCalUnit}>kcal targeted</Text></Text>
            <Text style={styles.mealMacroList}>P: 40g   C: 60g   F: 10g</Text>
          </View>
          <View style={styles.plannedActions}>
            <TouchableOpacity style={styles.confirmBtn}>
              <Text style={styles.confirmBtnText}>✓ Confirm Log</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.editBtn}>
              <Text style={{color: theme.colors.mutedText}}>✎</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 16:8 Protocol */}
        <View style={styles.protocolCard}>
          <View style={styles.protocolTop}>
            <View style={styles.protocolTitleRow}>
              <Clock color={theme.colors.neonCyan} size={14} />
              <Text style={styles.protocolTitle}>16:8 PROTOCOL STATUS</Text>
            </View>
            <Text style={styles.protocolPhase}>Feeding Phase</Text>
          </View>
          <View style={styles.protocolTimeRow}>
            <Text style={styles.protocolCloses}>Window closes in: <Text style={{color: theme.colors.text}}>2h 15m</Text> (09:00 PM)</Text>
            <Text style={styles.protocolStarted}>Started 12:00 PM</Text>
          </View>
          <View style={styles.protocolBarBg}>
            <View style={[styles.protocolBarFill, { width: '80%' }]} />
          </View>

          <View style={styles.microRow}>
            <View style={styles.microItem}>
              <Text style={styles.microLabel}>SODIUM</Text>
              <Text style={styles.microValue}>2,100mg</Text>
              <Text style={styles.microStatus}>Controlled</Text>
            </View>
            <View style={styles.microItem}>
              <Text style={styles.microLabel}>FIBER</Text>
              <Text style={styles.microValue}>34g</Text>
              <Text style={styles.microStatus}>Goal Met</Text>
            </View>
            <View style={styles.microItem}>
              <Text style={styles.microLabel}>POTASSIUM</Text>
              <Text style={styles.microValue}>3,250mg</Text>
              <Text style={styles.microStatus}>Optimal</Text>
            </View>
          </View>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
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
  macrosCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.borderGlow,
  },
  caloriesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  progressCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: colors.neonCyan,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 20,
  },
  consumedLabel: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 8,
    color: colors.mutedText,
  },
  consumedValue: {
    fontFamily: 'Geist_700Bold',
    fontSize: 18,
    color: colors.text,
  },
  consumedPct: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 9,
    color: colors.neonCyan,
  },
  caloriesInfo: {
    flex: 1,
  },
  calRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  calLabel: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 10,
    color: colors.mutedText,
    letterSpacing: 0.5,
  },
  calValue: {
    fontFamily: 'JetBrainsMono_600SemiBold',
    fontSize: 14,
    color: colors.text,
  },
  calValueCyan: {
    fontFamily: 'JetBrainsMono_600SemiBold',
    fontSize: 14,
    color: colors.neonCyan,
  },
  calUnit: {
    fontFamily: 'Geist_400Regular',
    fontSize: 11,
    color: colors.mutedText,
  },
  paceText: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 10,
    color: colors.mutedText,
    marginTop: 4,
  },
  macrosBars: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  macroCol: {
    flex: 1,
  },
  macroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  macroLabel: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 9,
    color: colors.mutedText,
  },
  macroPct: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 9,
    color: colors.neonCyan,
  },
  macroValues: {
    fontFamily: 'JetBrainsMono_600SemiBold',
    fontSize: 13,
    color: colors.text,
    marginBottom: 6,
  },
  macroTarget: {
    fontSize: 10,
    color: colors.mutedText,
    fontFamily: 'JetBrainsMono_400Regular',
  },
  macroBarBg: {
    height: 4,
    backgroundColor: colors.surfaceLight,
    borderRadius: 2,
    marginBottom: 6,
  },
  macroBarFill: {
    height: 4,
    backgroundColor: colors.neonCyan,
    borderRadius: 2,
  },
  macroDesc: {
    fontFamily: 'Geist_400Regular',
    fontSize: 9,
    color: colors.mutedText,
  },
  hydrationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.borderGlow,
  },
  hydrationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hydrationLabel: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 9,
    color: colors.mutedText,
    marginBottom: 2,
  },
  hydrationValue: {
    fontFamily: 'JetBrainsMono_600SemiBold',
    fontSize: 13,
    color: colors.text,
  },
  hydrationTarget: {
    fontFamily: 'Geist_400Regular',
    fontSize: 11,
    color: colors.mutedText,
  },
  addWaterBtn: {
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addWaterText: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 11,
    color: colors.neonCyan,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.borderGlow,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontFamily: 'Geist_400Regular',
    fontSize: 13,
    color: colors.text,
  },
  scanBtn: {
    padding: 4,
    marginRight: 8,
  },
  cameraBtn: {
    padding: 4,
  },
  feedingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 11,
    color: colors.text,
    letterSpacing: 1,
  },
  feedingsSummary: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 10,
    color: colors.mutedText,
  },
  mealCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  mealTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mealTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dotCyan: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.neonCyan,
    marginRight: 8,
  },
  dotYellow: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.warning,
    marginRight: 8,
  },
  mealTime: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 10,
    color: colors.text,
    letterSpacing: 0.5,
  },
  mealStatus: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 10,
    color: colors.mutedText,
  },
  mealContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  mealImgPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: colors.surfaceLight,
    marginRight: 12,
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 14,
    color: colors.text,
    marginBottom: 4,
  },
  mealDesc: {
    fontFamily: 'Geist_400Regular',
    fontSize: 12,
    color: colors.mutedText,
  },
  mealMacros: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderGlow,
  },
  mealCals: {
    fontFamily: 'JetBrainsMono_600SemiBold',
    fontSize: 13,
    color: colors.neonCyan,
  },
  mealCalUnit: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 10,
    color: colors.mutedText,
  },
  mealMacroList: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 11,
    color: colors.mutedText,
    letterSpacing: 1,
  },
  mealCardPlanned: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.borderGlow,
  },
  plannedBadge: {
    backgroundColor: colors.warning,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  plannedBadgeText: {
    fontFamily: 'JetBrainsMono_600SemiBold',
    fontSize: 10,
    color: colors.obsidian,
  },
  mealInfoPlanned: {
    marginBottom: 12,
  },
  mealMacrosPlanned: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  mealCalsYellow: {
    fontFamily: 'JetBrainsMono_600SemiBold',
    fontSize: 13,
    color: colors.warning,
  },
  plannedActions: {
    flexDirection: 'row',
    gap: 12,
  },
  confirmBtn: {
    flex: 1,
    backgroundColor: colors.surfaceLight,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  confirmBtnText: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 13,
    color: colors.neonCyan,
  },
  editBtn: {
    width: 44,
    height: 44,
    backgroundColor: colors.surfaceLight,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  protocolCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.borderGlow,
  },
  protocolTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  protocolTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  protocolTitle: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 11,
    color: colors.text,
    letterSpacing: 1,
    marginLeft: 8,
  },
  protocolPhase: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 10,
    color: colors.neonCyan,
  },
  protocolTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  protocolCloses: {
    fontFamily: 'Geist_400Regular',
    fontSize: 11,
    color: colors.mutedText,
  },
  protocolStarted: {
    fontFamily: 'Geist_400Regular',
    fontSize: 11,
    color: colors.mutedText,
  },
  protocolBarBg: {
    height: 4,
    backgroundColor: colors.surfaceLight,
    borderRadius: 2,
    marginBottom: 16,
  },
  protocolBarFill: {
    height: 4,
    backgroundColor: colors.neonCyan,
    borderRadius: 2,
  },
  microRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.borderGlow,
  },
  microItem: {
    alignItems: 'center',
  },
  microLabel: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 9,
    color: colors.mutedText,
    marginBottom: 4,
  },
  microValue: {
    fontFamily: 'JetBrainsMono_600SemiBold',
    fontSize: 13,
    color: colors.text,
    marginBottom: 4,
  },
  microStatus: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 9,
    color: colors.neonCyan,
  }
});
