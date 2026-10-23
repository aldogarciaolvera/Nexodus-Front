import { NavigatorScreenParams, CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NoteDto } from '../services/journal.service';

export type RootTabParamList = {
  Dashboard: undefined;
  Ideas: undefined;
  Tasks: undefined;
  Fit: { initialTab?: 'gym' | 'diet' } | undefined;
  Gym?: { initialTab?: 'gym' | 'diet' };
  Diet?: undefined;
  Money: undefined;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<RootTabParamList> | undefined;
  CreateJournalEntry?: { editNote?: NoteDto; initialType?: 'idea' | 'diario' };
  CreateRoutine?: { routineId?: string };
  ActiveWorkout?: { routineId?: string };
  AllTransactions: undefined;
  AllTasks: undefined;
  Settings: undefined;
  Login: undefined;
  Register: undefined;
};

export type AppNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<RootTabParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList, RootTabParamList {}
  }
}
