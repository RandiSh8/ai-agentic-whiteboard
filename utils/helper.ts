/**
 * Helper utilities for Excalidraw canvas and workspace state
 */

export const normalizeAppState = (appState: any) => {
  if (!appState) {
    return {
      collaborators: new Map(),
    };
  }

  return {
    ...appState,
    collaborators: new Map(),
  };
};
