import { StyleSheet, View } from 'react-native';
import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';

function GlassTabBackground() {
  return (
    <BlurView
      intensity={55}
      tint="dark"
      style={styles.tabBg}
    />
  );
}

// Active tab icon sits on a soft luminous pill; inactive tabs stay quiet.
function TabIcon({ name, outlineName, color, focused }) {
  return (
    <View style={[styles.iconPill, focused && styles.iconPillActive]}>
      <Ionicons name={focused ? name : outlineName} size={21} color={color} />
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: colors.faint,
        tabBarBackground: GlassTabBackground,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: { fontSize: 10.5, fontWeight: '700', marginBottom: 8 },
        tabBarItemStyle: { paddingTop: 10 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="home" outlineName="home-outline" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="pie-chart" outlineName="pie-chart-outline" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="budgets"
        options={{
          title: 'Budgets',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="wallet" outlineName="wallet-outline" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="bills"
        options={{
          title: 'Bills',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="receipt" outlineName="receipt-outline" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="calendar" outlineName="calendar-outline" color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconPill: {
    width: 52, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  iconPillActive: {
    backgroundColor: 'rgba(52,211,153,0.18)',
    borderWidth: 1, borderColor: 'rgba(52,211,153,0.30)',
  },
  tabBar: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 26,
    height: 74,
    borderRadius: 26,
    borderTopWidth: 0,
    backgroundColor: 'transparent',
    elevation: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
  },
  tabBg: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 26,
    overflow: 'hidden',
    backgroundColor: 'rgba(16,20,30,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
});
