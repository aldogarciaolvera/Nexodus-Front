import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { gymService } from '../../../services/gym.service';
import { queryKeys } from '../../../services/queryKeys';
import { useTheme } from '../../../utils/ThemeContext';
import { ThemeColors } from '../../../utils/theme';
import { Skeleton } from '../../../components/Skeleton';
import { BodyRecoveryHeatmap } from './BodyRecoveryHeatmap';

export const MuscleRecoveryCard = React.memo(() => {
  const theme = useTheme();
  const styles = createStyles(theme.colors);

  const { data: recoveryList, isLoading } = useQuery({
    queryKey: queryKeys.gym.muscleRecovery,
    queryFn: gymService.getMuscleRecoveryStatus,
    staleTime: 60 * 1000,
  });

  if (isLoading) {
    return (
      <View style={styles.skeletonCard}>
        <Skeleton width="40%" height={20} style={{ marginBottom: 16 }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Skeleton width={20} height={120} borderRadius={6} />
          <Skeleton width={120} height={140} borderRadius={12} />
          <Skeleton width={120} height={140} borderRadius={12} />
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          <Skeleton width="30%" height={46} borderRadius={8} />
          <Skeleton width="30%" height={46} borderRadius={8} />
          <Skeleton width="30%" height={46} borderRadius={8} />
          <Skeleton width="30%" height={46} borderRadius={8} />
          <Skeleton width="30%" height={46} borderRadius={8} />
          <Skeleton width="30%" height={46} borderRadius={8} />
        </View>
      </View>
    );
  }

  if (!recoveryList || recoveryList.length === 0) {
    return null;
  }

  return <BodyRecoveryHeatmap recoveryData={recoveryList} />;
});

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    skeletonCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.borderGlow,
      padding: 16,
      marginBottom: 20,
    },
  });
