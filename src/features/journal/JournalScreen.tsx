import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../utils/ThemeContext';
import { ThemeColors } from '../../utils/theme';
import { Plus, CheckCircle2 } from 'lucide-react-native';
import { Header } from '../../components/Header';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import journalService, { NoteDto } from '../../services/journal.service';
import { ActionSheet } from '../../components/ActionSheet';
import { useAlertStore } from '../../store/alertStore';
import { Skeleton } from '../../components/Skeleton';
import { IdeaDetailsModal } from './components/IdeaDetailsModal';
import { AppNavigationProp } from '../../utils/navigation';
import { queryKeys } from '../../services/queryKeys';
import { useCarouselNavStore } from '../../store/carouselNavStore';

const EMPTY_NOTES: NoteDto[] = [];

interface JournalScreenProps {
  mode?: 'idea' | 'diario';
}

export const JournalScreen: React.FC<JournalScreenProps> = ({ mode = 'idea' }) => {
  const theme = useTheme();
  const styles = createStyles(theme.colors);
  const navigation = useNavigation<AppNavigationProp>();
  const navigateToPage = useCarouselNavStore((s) => s.navigateToPage);

  const isIdea = mode === 'idea';

  const queryClient = useQueryClient();
  const alertStore = useAlertStore();
  const [selectedNote, setSelectedNote] = useState<NoteDto | null>(null);
  const [isActionModalVisible, setActionModalVisible] = useState(false);
  const [selectedIdeaForModal, setSelectedIdeaForModal] = useState<NoteDto | null>(null);

  const { data: notes = EMPTY_NOTES, isLoading } = useQuery({
    queryKey: queryKeys.journal.notes,
    queryFn: () => journalService.getAll(),
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => journalService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.journal.notes });
      setActionModalVisible(false);
      setSelectedNote(null);
    },
  });

  const toggleCompletionMutation = useMutation({
    mutationFn: (idea: NoteDto) => journalService.update(idea.id, { 
      title: idea.title,
      content: idea.content,
      checklist: idea.checklist?.map(c => ({ id: c.id, text: c.text, isCompleted: c.isCompleted })) || [],
      isCompleted: !idea.isCompleted 
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.journal.notes });
    }
  });

  const handleToggleIdea = (idea: NoteDto) => {
    toggleCompletionMutation.mutate(idea);
  };

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

  const { ideas, groupedJournal, sortedDates } = useMemo(() => {
    const ideaList = notes.filter(n => n.type === 'idea');
    const journalEntries = notes.filter(n => n.type === 'diario');

    // Group journal entries by date string
    const grouped = journalEntries.reduce((acc, entry) => {
      const dateKey = new Date(entry.createdAt).toLocaleDateString();
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(entry);
      return acc;
    }, {} as Record<string, NoteDto[]>);

    // Sort dates descending
    const dates = Object.keys(grouped).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    return {
      ideas: ideaList,
      groupedJournal: grouped,
      sortedDates: dates,
    };
  }, [notes]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* Header con puntos minimalistas de navegación dentro del ScrollView a la misma altura que Dashboard */}
          <Header 
            title={isIdea ? 'Mis Ideas' : 'Mi Diario'} 
            dots={{
              total: 2,
              active: isIdea ? 0 : 1,
              onPressDot: (idx) => navigateToPage(idx === 0 ? 1 : 2),
            }}
          />

          {isIdea ? (
            /* Vista Mis Ideas */
            isLoading ? (
              <View style={{ gap: 16 }}>
                <Skeleton width="100%" height={120} borderRadius={16} />
                <Skeleton width="100%" height={120} borderRadius={16} />
                <Skeleton width="100%" height={120} borderRadius={16} />
              </View>
            ) : (
              <View style={styles.ideasContainer}>
                {ideas.map((idea) => (
                  <TouchableOpacity
                    key={idea.id}
                    style={[styles.card, idea.isCompleted && { opacity: 0.6 }]}
                    onPress={() => setSelectedIdeaForModal(idea)}
                    onLongPress={() => handleLongPress(idea)}
                    delayLongPress={500}
                  >
                    <View
                      style={[
                        styles.cardTop,
                        { marginBottom: idea.content || (idea.checklist && idea.checklist.length > 0) ? 12 : 0 },
                      ]}
                    >
                      <View style={styles.cardTags}>
                        {idea.title ? (
                          <Text
                            style={[
                              styles.cardTitle,
                              { marginBottom: 0 },
                              idea.isCompleted && { textDecorationLine: 'line-through', color: theme.colors.mutedText },
                            ]}
                          >
                            {idea.title}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                    {idea.content ? (
                      <Text
                        style={[
                          styles.cardDesc,
                          idea.isCompleted && { textDecorationLine: 'line-through', color: theme.colors.mutedText },
                        ]}
                        numberOfLines={3}
                      >
                        {idea.content}
                      </Text>
                    ) : null}

                    {idea.checklist && idea.checklist.length > 0 ? (
                      <View style={styles.checklistPreview}>
                        {idea.checklist.slice(0, 3).map((item) => (
                          <View key={item.id} style={styles.checklistItem}>
                            {item.isCompleted ? (
                              <CheckCircle2 color={theme.colors.neonCyan} size={14} style={{ marginRight: 8 }} />
                            ) : (
                              <View style={styles.checkboxDot} />
                            )}
                            <Text
                              style={[styles.checklistText, item.isCompleted ? styles.checklistTextCompleted : null]}
                              numberOfLines={1}
                            >
                              {item.text}
                            </Text>
                          </View>
                        ))}
                        {idea.checklist.length > 3 ? (
                          <Text style={styles.moreItemsText}>+{idea.checklist.length - 3} más...</Text>
                        ) : null}
                      </View>
                    ) : null}
                  </TouchableOpacity>
                ))}
                {ideas.length === 0 ? (
                  <Text style={styles.emptyText}>No tienes ideas todavía.</Text>
                ) : null}
              </View>
            )
          ) : (
            /* Vista Mi Diario */
            isLoading ? (
              <View style={{ gap: 16 }}>
                <Skeleton width="100%" height={120} borderRadius={16} />
                <Skeleton width="100%" height={120} borderRadius={16} />
              </View>
            ) : (
              <View style={styles.journalContainer}>
                {sortedDates.map((date) => (
                  <View key={date} style={styles.dateGroup}>
                    <Text style={styles.dateTitle}>{date}</Text>
                    <View style={styles.journalEntryBlock}>
                      {groupedJournal[date]
                        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                        .map((entry, index) => (
                          <TouchableOpacity
                            key={entry.id}
                            style={[styles.innerEntry, index > 0 && styles.entryDivider]}
                            onLongPress={() => handleLongPress(entry)}
                            delayLongPress={500}
                          >
                            {entry.title ? <Text style={styles.entryTitle}>{entry.title}</Text> : null}
                            <Text style={styles.entryContent}>{entry.content}</Text>
                            <Text style={styles.entryTime}>
                              {new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                          </TouchableOpacity>
                        ))}
                    </View>
                  </View>
                ))}
                {sortedDates.length === 0 ? (
                  <Text style={styles.emptyText}>No tienes entradas de diario todavía.</Text>
                ) : null}
              </View>
            )
          )}
          <View style={{ height: 100 }} />
        </ScrollView>
      </View>

      <TouchableOpacity 
        style={styles.fab} 
        activeOpacity={0.8} 
        onPress={() => navigation.navigate('CreateJournalEntry', { initialType: isIdea ? 'idea' : 'diario' })}
      >
        <Plus color="#000000" size={28} />
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

      <IdeaDetailsModal
        visible={!!selectedIdeaForModal}
        idea={selectedIdeaForModal}
        onClose={() => setSelectedIdeaForModal(null)}
      />
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.obsidian,
  },
  container: {
    flex: 1,
    backgroundColor: colors.obsidian,
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 24 : 12,
    paddingBottom: 100,
  },
  emptyText: {
    fontFamily: 'Geist_400Regular',
    fontSize: 14,
    color: colors.mutedText,
    textAlign: 'center',
    marginTop: 40,
  },
  ideasContainer: {
    gap: 16,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderGlow,
    padding: 16,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTags: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    flex: 1,
  },
  cardTitle: {
    fontFamily: 'Geist_500Medium',
    fontSize: 16,
    color: colors.text,
    letterSpacing: -0.3,
  },
  cardDesc: {
    fontFamily: 'Geist_400Regular',
    fontSize: 13,
    color: colors.slate400,
    lineHeight: 18,
    marginBottom: 12,
  },
  checklistPreview: {
    gap: 6,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: colors.borderGlow,
    paddingTop: 8,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxDot: {
    width: 14,
    height: 14,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.borderGlow,
    marginRight: 8,
  },
  checklistText: {
    fontFamily: 'Geist_400Regular',
    fontSize: 12,
    color: colors.slate300,
    flex: 1,
  },
  checklistTextCompleted: {
    textDecorationLine: 'line-through',
    color: colors.mutedText,
  },
  moreItemsText: {
    fontFamily: 'Geist_400Regular',
    fontSize: 11,
    color: colors.mutedText,
    marginTop: 2,
  },
  journalContainer: {
    gap: 20,
  },
  dateGroup: {
    gap: 8,
  },
  dateTitle: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 12,
    color: colors.mutedText,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  journalEntryBlock: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderGlow,
    overflow: 'hidden',
  },
  innerEntry: {
    padding: 16,
    gap: 6,
  },
  entryDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.borderGlow,
  },
  entryTitle: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    color: colors.text,
  },
  entryContent: {
    fontFamily: 'Geist_400Regular',
    fontSize: 13,
    color: colors.slate400,
    lineHeight: 18,
  },
  entryTime: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 11,
    color: colors.mutedText,
    marginTop: 4,
  },
  fab: {
    position: 'absolute',
    bottom: 100, // Sobre la barra inferior flotante
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.neonCyan,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderGlow,
  },
});
