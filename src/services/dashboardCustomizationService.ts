import { db } from '../config/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { logger } from '../utils/logger';

export interface DashboardWidget {
  id: string;
  name: string;
  label: string;
  enabled: boolean;
  order: number;
  description: string;
}

export interface DashboardPreferences {
  userId: string;
  widgets: DashboardWidget[];
  updatedAt: string;
}

// Default dashboard widgets for large portfolios
const DEFAULT_WIDGETS: DashboardWidget[] = [
  {
    id: 'health-score-legend',
    name: 'healthScoreLegend',
    label: 'Health Score Legend',
    enabled: false,
    order: 1,
    description: 'Explains how health scores are calculated',
  },
  {
    id: 'stats-cards',
    name: 'statsCards',
    label: 'Portfolio Statistics',
    enabled: false,
    order: 2,
    description: 'Total buildings, average health, buildings needing attention, upcoming inspections',
  },
  {
    id: 'buildings-needing-attention',
    name: 'buildingsNeedingAttention',
    label: 'Buildings Needing Attention',
    enabled: false,
    order: 3,
    description: 'Top 5 urgent or check-soon buildings',
  },
  {
    id: 'portfolio-health-report',
    name: 'portfolioHealthReport',
    label: 'Portfolio Health Report',
    enabled: true,
    order: 4,
    description: 'Charts, trends, and smart recommendations for your entire portfolio',
  },
  {
    id: 'upcoming-visits',
    name: 'upcomingVisits',
    label: 'Upcoming Visits',
    enabled: false,
    order: 5,
    description: 'Scheduled inspections and maintenance appointments',
  },
  {
    id: 'pending-appointments',
    name: 'pendingAppointments',
    label: 'Pending Appointments',
    enabled: false,
    order: 6,
    description: 'Appointments awaiting your response or confirmation',
  },
  {
    id: 'buildings-map',
    name: 'buildingsMap',
    label: 'Buildings Map Overview',
    enabled: true,
    order: 7,
    description: 'Geographic distribution and locations of your buildings',
  },
  {
    id: 'quick-actions',
    name: 'quickActions',
    label: 'Quick Actions',
    enabled: true,
    order: 8,
    description: 'Shortcuts to key portal features',
  },
  {
    id: 'service-agreement-monitor',
    name: 'serviceAgreementMonitor',
    label: 'Service Agreement Monitor',
    enabled: false,
    order: 9,
    description: 'Track active, expiring, and renewed service agreements at a glance',
  },
  {
    id: 'maintenance-cost-tracker',
    name: 'maintenanceCostTracker',
    label: 'Maintenance Cost Tracker',
    enabled: false,
    order: 10,
    description: 'Monitor maintenance spending trends and cost-per-building analytics',
  },
];

/**
 * Get user's dashboard preferences from Firestore
 * Falls back to default widgets if no preferences exist
 */
export const getDashboardPreferences = async (userId: string): Promise<DashboardPreferences> => {
  try {
    const prefsRef = doc(db, 'dashboardPreferences', userId);
    const prefsSnap = await getDoc(prefsRef);

    if (prefsSnap.exists()) {
      const prefs = prefsSnap.data() as DashboardPreferences;
      // Merge with any new default widgets that might have been added
      const merged = mergeWidgets(prefs.widgets, DEFAULT_WIDGETS);
      return {
        ...prefs,
        widgets: merged,
      };
    }

    // Return default preferences
    return {
      userId,
      widgets: DEFAULT_WIDGETS,
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('Error fetching dashboard preferences:', error);
    // Return defaults if error
    return {
      userId,
      widgets: DEFAULT_WIDGETS,
      updatedAt: new Date().toISOString(),
    };
  }
};

/**
 * Save or update dashboard preferences
 */
export const saveDashboardPreferences = async (
  userId: string,
  widgets: DashboardWidget[]
): Promise<void> => {
  try {
    const prefsRef = doc(db, 'dashboardPreferences', userId);
    const preferences: DashboardPreferences = {
      userId,
      widgets: widgets.sort((a, b) => a.order - b.order),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(prefsRef, preferences, { merge: true });
    logger.info('Dashboard preferences saved');
  } catch (error) {
    logger.error('Error saving dashboard preferences:', error);
    throw error;
  }
};

/**
 * Update individual widget settings
 */
export const updateWidgetSetting = async (
  userId: string,
  widgetId: string,
  updates: Partial<DashboardWidget>
): Promise<void> => {
  try {
    const prefs = await getDashboardPreferences(userId);
    const updated = prefs.widgets.map(w =>
      w.id === widgetId ? { ...w, ...updates } : w
    );
    await saveDashboardPreferences(userId, updated);
  } catch (error) {
    logger.error(`Error updating widget ${widgetId}:`, error);
    throw error;
  }
};

/**
 * Reorder widgets by drag-and-drop or manual input
 */
export const reorderWidgets = async (
  userId: string,
  widgets: DashboardWidget[]
): Promise<void> => {
  try {
    const reordered = widgets.map((w, idx) => ({
      ...w,
      order: idx + 1,
    }));
    await saveDashboardPreferences(userId, reordered);
  } catch (error) {
    logger.error('Error reordering widgets:', error);
    throw error;
  }
};

/**
 * Reset to default preferences
 */
export const resetToDefaults = async (userId: string): Promise<void> => {
  try {
    await saveDashboardPreferences(userId, DEFAULT_WIDGETS);
    logger.info('Dashboard preferences reset to defaults');
  } catch (error) {
    logger.error('Error resetting dashboard preferences:', error);
    throw error;
  }
};

/**
 * Helper function to merge new default widgets with existing preferences
 * Preserves user's enabled/order preferences while adding any new widgets
 */
function mergeWidgets(existing: DashboardWidget[], defaults: DashboardWidget[]): DashboardWidget[] {
  const merged = [...existing];

  // Add any new default widgets that aren't in existing
  for (const defaultWidget of defaults) {
    const existingWidget = merged.find(w => w.id === defaultWidget.id);
    if (!existingWidget) {
      merged.push(defaultWidget);
    }
  }

  // Sort by order
  return merged.sort((a, b) => a.order - b.order);
}

export const DEFAULT_DASHBOARD_WIDGETS = DEFAULT_WIDGETS;
