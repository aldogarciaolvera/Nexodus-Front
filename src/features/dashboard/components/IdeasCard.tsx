import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../utils/ThemeContext';
import { ThemeColors } from '../../../utils/theme';
import { useQuery } from '@tanstack/react-query';
import journalService, { NoteDto } from '../../../services/journal.service';
import { Skeleton } from '../../../components/Skeleton';
import { Lightbulb } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { AppNavigationProp } from '../../../utils/navigation';
import { queryKeys } from '../../../services/queryKeys';

const EMPTY_NOTES: NoteDto[] = [];

export const IdeasCard = () => {
  const navigation = useNavigation<AppNavigationProp>();
  const theme = useTheme();
  const styles = createStyles(theme.colors);

  const { data: notes = EMPTY_NOTES, isLoading } = useQuery({
    queryKey: queryKeys.journal.notes,
    queryFn: () => journalService.getAll(),
  });

  const activeIdeas = useMemo(() => {
    return notes
      .filter(n => n.type === 'idea' && !n.isCompleted)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3);
  }, [notes]);

  return (
    <TouchableOpacity 
      style={styles.card} 
      activeOpacity={0.8}
      onPress={() => navigation.navigate('Ideas')}
    >
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Lightbulb color={theme.colors.neonCyan} size={16} strokeWidth={2} />
        </View>
        <Text style={styles.headerTitle} numberOfLines={1}>Ideas Activas</Text>
      </View>
      
      {isLoading ? (
        <View style={{ gap: 12, marginTop: 12 }}>
          <Skeleton width="80%" height={14} />
          <Skeleton width="60%" height={14} />
          <Skeleton width="70%" height={14} />
        </View>
      ) : activeIdeas.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No tienes ideas pendientes.</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {activeIdeas.map(idea => (
            <View key={idea.id} style={styles.ideaItem}>
              <View style={styles.bullet} />
              <Text style={styles.ideaTitle} numberOfLines={1}>
                {idea.title || 'Sin título'}
              </Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.borderGlow,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginBottom: 8,
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 10,
    letterSpacing: 0.5,
    color: colors.mutedText,
    textTransform: 'uppercase',
    fontFamily: 'JetBrainsMono_500Medium',
    flex: 1,
  },
  list: {
    marginTop: 8,
    gap: 12,
  },
  ideaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.neonCyan,
  },
  ideaTitle: {
    fontSize: 13,
    color: colors.slate200,
    fontFamily: 'Geist_400Regular',
    flex: 1,
  },
  emptyContainer: {
    marginTop: 12,
    alignItems: 'flex-start',
  },
  emptyText: {
    color: colors.slate500,
    fontSize: 12,
    fontFamily: 'Geist_400Regular',
  },
});
