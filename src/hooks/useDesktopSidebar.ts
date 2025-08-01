import { useState, useEffect } from 'react';

export const useDesktopSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('desktop-sidebar-collapsed');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem(
      'desktop-sidebar-collapsed',
      JSON.stringify(isCollapsed)
    );
  }, [isCollapsed]);

  const toggle = () => {
    setIsCollapsed(!isCollapsed);
  };

  const collapse = () => {
    setIsCollapsed(true);
  };

  const expand = () => {
    setIsCollapsed(false);
  };

  return {
    isCollapsed,
    toggle,
    collapse,
    expand,
  };
};
