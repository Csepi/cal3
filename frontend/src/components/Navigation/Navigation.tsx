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
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  hideReservationsTab = false,
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

  const handleSelect = (item: NavigationItem) => {
    onTabChange(item.tabId);
  };

  const activeKey = React.useMemo(
    () => allItems.find((item) => item.tabId === activeTab)?.key ?? activeTab,
    [allItems, activeTab],
  );

  if (isMobile) {
    return (
      <MobileNav
        items={mobileItems}
        onSelect={handleSelect}
        isItemActive={(item) => item.tabId === activeTab}
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
