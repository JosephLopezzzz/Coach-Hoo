import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { FontSize } from '../../constants/theme';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

function TabIcon({ name, focused, activeColor, inactiveColor }: { name: IoniconsName; focused: boolean; activeColor: string; inactiveColor: string }) {
  return (
    <Ionicons
      name={focused ? name : (`${name}-outline` as IoniconsName)}
      size={24}
      color={focused ? activeColor : inactiveColor}
    />
  );
}

export default function TabLayout() {
  const { t } = useLanguage();
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bgCard,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
        },
        tabBarActiveTintColor:   colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: FontSize.xs, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: t('tab.dashboard'), tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} activeColor={colors.primary} inactiveColor={colors.textMuted} /> }}
      />
      <Tabs.Screen
        name="chat"
        options={{ title: t('tab.coach'), tabBarIcon: ({ focused }) => <TabIcon name="chatbubbles" focused={focused} activeColor={colors.primary} inactiveColor={colors.textMuted} /> }}
      />
      <Tabs.Screen
        name="search"
        options={{ title: t('tab.search'), tabBarIcon: ({ focused }) => <TabIcon name="search" focused={focused} activeColor={colors.primary} inactiveColor={colors.textMuted} /> }}
      />
      <Tabs.Screen
        name="log"
        options={{
          title: t('tab.log'),
          tabBarIcon: ({ focused }) => <TabIcon name="add-circle" focused={focused} activeColor={colors.primary} inactiveColor={colors.textMuted} />,
          tabBarActiveTintColor: colors.primary,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: t('tab.profile'), tabBarIcon: ({ focused }) => <TabIcon name="person" focused={focused} activeColor={colors.primary} inactiveColor={colors.textMuted} /> }}
      />
    </Tabs>
  );
}
