import { useState, useCallback } from 'react';

const STORAGE_KEY = 'nt:favorites';

function loadFavorites() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

export default function useFavorites() {
  const [favorites, setFavorites] = useState(loadFavorites);

  const addFavorite = useCallback((route) => {
    // route shape: { routeNo, routeParentId }
    setFavorites((prev) => {
      if (prev.some((f) => f.routeParentId === route.routeParentId)) return prev;
      const next = [...prev, { routeNo: route.routeNo, routeParentId: route.routeParentId }];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const removeFavorite = useCallback((routeParentId) => {
    setFavorites((prev) => {
      const next = prev.filter((f) => f.routeParentId !== routeParentId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const isFavorite = useCallback(
    (routeParentId) => favorites.some((f) => f.routeParentId === routeParentId),
    [favorites]
  );

  return { favorites, addFavorite, removeFavorite, isFavorite };
}
