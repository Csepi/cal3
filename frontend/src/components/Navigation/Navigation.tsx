import React from 'react';

import { useScreenSize } from '../../hooks/useScreenSize';
import type { TabId } from '../mobile/organisms/BottomTabBar';
import { DesktopNav } from './DesktopNav';
import { MobileNav } from './MobileNav';
import { useNavigation, type NavigationItem } from './useNavigation';

interface NavigationProps {
  activeTab: TabId;
  onTabChange: (tabId: TabId) => void;
  hideReservationsTab?: boolean;
  onOpenGroups?: () => void;
  onOpenSettings?: () => void;
}

const isPseudoIntent = (item: NavigationItem): boolean =>
  item.intent === 'groups' || item.intent === 'settings';

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  hideReservationsTab = false,
  onOpenGroups,
  onOpenSettings,
}) => {
  const { isMobile } = useScreenSize();
  const {
    allItems,
    desktopPrimaryItems,
    desktopSecondaryItems,
    notificationItem,
    mobileItems,
    breadcrumbTrail,
  } =
    useNavigation({ activeTab, hideReservationsTab });

  const profileItem = React.useMemo(
    () => allItems.find((item) => item.key === 'profile') ?? null,
    [allItems],
  );
  const adminItem = React.useMemo(
    () => allItems.find((item) => item.key === 'admin') ?? null,
    [allItems],
  );

  const [activePseudoKey, setActivePseudoKey] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (activePseudoKey === 'groups' && activeTab !== 'calendar') {
      setActivePseudoKey(null);
    }
    if (activePseudoKey === 'settings' && activeTab !== 'notifications') {
      setActivePseudoKey(null);
    }
  }, [activePseudoKey, activeTab]);

  const handleSelect = (item: NavigationItem) => {
    if (item.intent === 'groups') {
      setActivePseudoKey('groups');
      if (onOpenGroups) {
        onOpenGroups();
      } else {
        onTabChange('calendar');
      }
      return;
    }

    if (item.intent === 'settings') {
      setActivePseudoKey('settings');
      if (onOpenSettings) {
        onOpenSettings();
      } else {
        onTabChange('notifications');
      }
      return;
    }

    setActivePseudoKey(null);
    onTabChange(item.tabId);
  };

  const activeKey = React.useMemo(() => {
    if (activePseudoKey) {
      return activePseudoKey;
    }
    return allItems.find((item) => item.tabId === activeTab && !isPseudoIntent(item))?.key ?? activeTab;
  }, [activePseudoKey, allItems, activeTab]);

  if (isMobile) {
    return (
      <MobileNav
        items={mobileItems}
        onSelect={handleSelect}
        isItemActive={(item) => {
          if (isPseudoIntent(item)) {
            return activePseudoKey === item.key;
          }
          return item.tabId === activeTab;
        }}
      />
    );
  }

  return (
    <DesktopNav
      activeKey={activeKey}
      primaryItems={desktopPrimaryItems}
      secondaryItems={desktopSecondaryItems}
      notificationItem={notificationItem}
      profileItem={profileItem}
      adminItem={adminItem}
      breadcrumbs={breadcrumbTrail}
      onSelect={handleSelect}
    />
  );
};
