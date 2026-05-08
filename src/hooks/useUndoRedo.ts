import { useState, useCallback } from 'react';

interface HistoryState<T> {
  state: T;
  timestamp: number;
}

export function useUndoRedo<T>(initialState: T, maxHistory: number = 50) {
  const [history, setHistory] = useState<HistoryState<T>[]>([
    { state: initialState, timestamp: Date.now() }
  ]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const push = useCallback((newState: T) => {
    setHistory((prev) => {
      // Remove any redo history when a new action is taken
      const truncated = prev.slice(0, currentIndex + 1);
      const updated = [...truncated, { state: newState, timestamp: Date.now() }];
      
      // Keep only the last maxHistory items
      if (updated.length > maxHistory) {
        return updated.slice(updated.length - maxHistory);
      }
      return updated;
    });
    
    setCurrentIndex((prev) => {
      const newIdx = prev + 1;
      // Ensure index doesn't exceed max history
      return newIdx >= maxHistory ? maxHistory - 1 : newIdx;
    });
  }, [currentIndex, maxHistory]);

  const undo = useCallback((): T | null => {
    let newIdx = 0;
    let resultState: T | null = null;
    
    setCurrentIndex((prev) => {
      const newIndex = prev - 1;
      newIdx = newIndex < 0 ? 0 : newIndex;
      return newIdx;
    });
    
    setHistory((h) => {
      resultState = h[newIdx]?.state || null;
      return h;
    });
    
    return resultState;
  }, []);

  const redo = useCallback((): T | null => {
    let newIdx = 0;
    let resultState: T | null = null;
    
    setHistory((h) => {
      setCurrentIndex((prev) => {
        const maxIdx = h.length - 1;
        const newIndex = prev + 1;
        newIdx = newIndex > maxIdx ? maxIdx : newIndex;
        return newIdx;
      });
      resultState = h[newIdx]?.state || null;
      return h;
    });
    
    return resultState;
  }, []);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;
  const state = history[currentIndex]?.state;

  return {
    state,
    push,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}
