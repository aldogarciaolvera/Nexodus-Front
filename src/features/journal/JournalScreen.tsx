import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { useTheme } from '../../utils/ThemeContext';
import { ThemeColors } from '../../utils/theme';
import { Mic, Plus } from 'lucide-react-native';
import { Header } from '../../components/Header';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import journalService, { NoteDto } from '../../services/journal.service';
import { ActionSheet } from '../../components/ActionSheet';
import { useAlertStore } from '../../store/alertStore';
import { Skeleton } from '../../components/Skeleton';

export const JournalScreen = () => {
  const theme = useTheme();
  const styles = createStyles(theme.colors);
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<'idea' | 'diario'>('idea');

  const queryClient = useQueryClient();
  const alertStore = useAlertStore();
  const [selectedNote, setSelectedNote] = useState<NoteDto | null>(null);
  const [isActionModalVisible, setActionModalVisible] = useState(false);

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['notes'],
    queryFn: () => journalService.getAll(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => journalService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      setActionModalVisible(false);
      setSelectedNote(null);
    },
  });

  const handleLongPress = (note: NoteDto) => {
    setSelectedNote(note);
    setActionModalVisible(true);
  };

  const handleEdit = () => {
    setActionModalVisible(false);
    if (selectedNote) {
      navigation.navigate('CreateJournalEntry', { editNote: selectedNote });
    }
  };

  const handleDelete = () => {
    if (!selectedNote) return;
    setActionModalVisible(false);
    alertStore.showAlert({
      title: 'Eliminar',
      message: '¿Estás seguro que deseas eliminar esta entrada permanentemente?',
      type: 'error',
      buttons: [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: () => deleteMutation.mutate(selectedNote.id)
        }
      ]
    });
  };

  const ideas = notes.filter(n => n.type === 'idea');
  const journalEntries = notes.filter(n => n.type === 'diario');

  // Group journal entries by date string
  const groupedJournal = journalEntries.reduce((acc, entry) => {
    const dateKey = new Date(entry.createdAt).toLocaleDateString();
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(entry);
    return acc;
  }, {} as Record<string, NoteDto[]>);

  // Sort dates descending
  const sortedDates = Object.keys(groupedJournal).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerContainer}>
        <Header title="Notes & Journal" />
        
        {/* Toggle Switch */}
        <View style={styles.typeToggle}>
          <TouchableOpacity 
            style={[styles.toggleBtn, activeTab === 'idea' && styles.toggleBtnActive]}
            onPress={() => setActiveTab('idea')}
          >
            <Text style={[styles.toggleText, activeTab === 'idea' && styles.toggleTextActive]}>Mis Ideas</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.toggleBtn, activeTab === 'diario' && styles.toggleBtnActive]}
            onPress={() => setActiveTab('diario')}
          >
            <Text style={[styles.toggleText, activeTab === 'diario' && styles.toggleTextActive]}>Mi Diario</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={{ padding: 20, gap: 16 }}>
            <Skeleton width="100%" height={120} borderRadius={16} />
            <Skeleton width="100%" height={120} borderRadius={16} />
            <Skeleton width="100%" height={120} borderRadius={16} />
          </View>
        ) : activeTab === 'idea' ? (
          /* Ideas View */
          <View style={styles.ideasContainer}>
            {ideas.map(idea => (
              <TouchableOpacity key={idea.id} style={styles.card} onLongPress={() => handleLongPress(idea)} delayLongPress={500}>
                <View style={styles.cardTop}>
                  <View style={styles.cardTags}>
                    <View style={styles.dotCyan} />
                    <Text style={styles.cardTagText}>IDEA</Text>
                  </View>
                  <Text style={styles.cardTime}>{new Date(idea.createdAt).toLocaleDateString()}</Text>
                </View>
                {idea.title ? <Text style={styles.cardTitle}>{idea.title}</Text> : null}
                {idea.content ? <Text style={styles.cardDesc} numberOfLines={3}>{idea.content}</Text> : null}
                
                {idea.checklist && idea.checklist.length > 0 && (
                  <View style={styles.checklistPreview}>
                    {idea.checklist.slice(0, 3).map(item => (
                      <View key={item.id} style={styles.checklistItem}>
                        <View style={[styles.checkboxDot, item.isCompleted && styles.checkboxDotCompleted]} />
                        <Text style={[styles.checklistText, item.isCompleted && styles.checklistTextCompleted]} numberOfLines={1}>
                          {item.text}
                        </Text>
                      </View>
                    ))}
                    {idea.checklist.length > 3 && (
                      <Text style={styles.moreItemsText}>+{idea.checklist.length - 3} más...</Text>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            ))}
            {ideas.length === 0 && (
              <Text style={styles.emptyText}>No tienes ideas todavía.</Text>
            )}
          </View>
        ) : (
          /* Journal View */
          <View style={styles.journalContainer}>
            <Text style={styles.journalMainTitle}>Diario</Text>
            {sortedDates.map(date => (
              <View key={date} style={styles.dateGroup}>
                <Text style={styles.dateTitle}>{date}</Text>
                {groupedJournal[date].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()).map(entry => (
                  <TouchableOpacity key={entry.id} style={styles.journalEntryBlock} onLongPress={() => handleLongPress(entry)} delayLongPress={500}>
                    {entry.title ? <Text style={styles.entryTitle}>{entry.title}</Text> : null}
                    <Text style={styles.entryContent}>{entry.content}</Text>
                    <Text style={styles.entryTime}>
                      {new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
            {sortedDates.length === 0 && (
              <Text style={styles.emptyText}>No tienes entradas de diario todavía.</Text>
            )}
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => navigation.navigate('CreateJournalEntry')}
      >
        <Plus color={theme.colors.obsidian} size={28} />
      </TouchableOpacity>

      <ActionSheet
        visible={isActionModalVisible}
        onClose={() => setActionModalVisible(false)}
        title={selectedNote?.title || (selectedNote?.type === 'idea' ? 'Idea' : 'Entrada de Diario')}
        options={[
          {
            label: 'Editar',
            onPress: handleEdit
          },
          {
            label: 'Eliminar',
            destructive: true,
            onPress: handleDelete
          }
        ]}
      />
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.obsidian,
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    backgroundColor: colors.obsidian,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderGlow,
    paddingBottom: 16,
  },
  typeToggle: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.borderGlow,
    marginTop: 16,
    alignSelf: 'center',
    width: '80%',
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 16,
    alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: colors.neonCyan,
  },
  toggleText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 13,
    color: colors.mutedText,
  },
  toggleTextActive: {
    fontFamily: 'Geist_700Bold',
    color: colors.obsidian,
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  ideasContainer: {
    gap: 16,
  },
  journalContainer: {
    gap: 24,
  },
  journalMainTitle: {
    fontFamily: 'Geist_700Bold',
    fontSize: 24,
    color: colors.text,
    marginBottom: 8,
  },
  dateGroup: {
    gap: 12,
    borderLeftWidth: 1,
    borderLeftColor: colors.borderGlow,
    paddingLeft: 16,
    marginLeft: 8,
  },
  dateTitle: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 14,
    color: colors.neonCyan,
    marginBottom: 8,
    marginTop: 8,
    position: 'relative',
    left: -20,
    backgroundColor: colors.obsidian,
    alignSelf: 'flex-start',
    paddingHorizontal: 4,
  },
  journalEntryBlock: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderGlow,
  },
  entryTitle: {
    fontFamily: 'Geist_700Bold',
    fontSize: 16,
    color: colors.text,
    marginBottom: 8,
  },
  entryContent: {
    fontFamily: 'Geist_400Regular',
    fontSize: 14,
    color: colors.text,
    lineHeight: 22,
  },
  entryTime: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 10,
    color: colors.mutedText,
    marginTop: 8,
    alignSelf: 'flex-end',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderGlow,
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
  dotCyan: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.neonCyan,
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
    fontSize: 16,
    color: colors.text,
    marginBottom: 8,
  },
  cardDesc: {
    fontFamily: 'Geist_400Regular',
    fontSize: 13,
    color: colors.mutedText,
    lineHeight: 20,
    marginBottom: 12,
  },
  checklistPreview: {
    gap: 6,
    marginTop: 8,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.mutedText,
    marginRight: 8,
  },
  checkboxDotCompleted: {
    backgroundColor: colors.neonCyan,
    borderColor: colors.neonCyan,
  },
  checklistText: {
    fontFamily: 'Geist_400Regular',
    fontSize: 13,
    color: colors.text,
    flex: 1,
  },
  checklistTextCompleted: {
    textDecorationLine: 'line-through',
    color: colors.mutedText,
  },
  moreItemsText: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 11,
    color: colors.mutedText,
    marginTop: 4,
    marginLeft: 20,
  },
  emptyText: {
    fontFamily: 'Geist_400Regular',
    fontSize: 14,
    color: colors.mutedText,
    textAlign: 'center',
    marginTop: 40,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    left: 20, // requested floating button on the left
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.neonCyan,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
  }
});
