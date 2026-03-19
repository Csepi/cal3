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
  const { desktopPrimaryItems, desktopSecondaryItems, mobileItems, breadcrumbTrail } =
    useNavigation({ activeTab, hideReservationsTab });

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
    onTabChange(item.tabId);

    if (item.intent === 'groups') {
      setActivePseudoKey('groups');
      onOpenGroups?.();
      return;
    }

    if (item.intent === 'settings') {
      setActivePseudoKey('settings');
      onOpenSettings?.();
      return;
    }

    setActivePseudoKey(null);
  };

  const activeKey =
    activePseudoKey ??
    desktopPrimaryItems.find((item) => item.tabId === activeTab && !isPseudoIntent(item))?.key ??
    desktopSecondaryItems.find((item) => item.tabId === activeTab && !isPseudoIntent(item))?.key ??
    activeTab;

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
      breadcrumbs={breadcrumbTrail}
      onSelect={handleSelect}
    />
  );
};
