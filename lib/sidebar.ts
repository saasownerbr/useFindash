export const SIDEBAR_STORAGE_KEY = "usefindash-sidebar";

/** Below this width (tablets) the sidebar starts collapsed until the user picks a state. */
export const SIDEBAR_AUTO_COLLAPSE_BELOW = 1024;

/**
 * Runs in <head> before first paint: sets data-sidebar on <html> from the saved
 * choice, or collapses by default on tablets. CSS reads it, so there is no jump.
 */
export const SIDEBAR_BOOT_SCRIPT = `try{var s=localStorage.getItem("${SIDEBAR_STORAGE_KEY}");if(s==="collapsed"||(s===null&&window.innerWidth<${SIDEBAR_AUTO_COLLAPSE_BELOW}))document.documentElement.dataset.sidebar="collapsed"}catch(e){}`;

export function isSidebarCollapsed(): boolean {
  return document.documentElement.dataset.sidebar === "collapsed";
}

export function setSidebarCollapsed(collapsed: boolean) {
  if (collapsed) document.documentElement.dataset.sidebar = "collapsed";
  else delete document.documentElement.dataset.sidebar;
  try {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, collapsed ? "collapsed" : "expanded");
  } catch {
    // Private mode or blocked storage: the state still applies for this visit.
  }
}
