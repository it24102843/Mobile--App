import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { calculateGearCartOneDayTotal } from '../utils/gearRental';

const GEAR_CART_STORAGE_KEY = 'wildhaven.gear.cart';

const GearCartContext = createContext(undefined);

function sanitizeCartItems(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .filter((item) => item?.key)
    .map((item) => ({
      key: item.key,
      name: item.name,
      category: item.category,
      description: item.description,
      dailyRentalprice: Number(item.dailyRentalprice || 0),
      imageUrl: item.imageUrl,
      stockCount: Number(item.stockCount || 0),
      pickupLocation: item.pickupLocation,
      quantity: Math.max(Number(item.quantity || 1), 1),
    }));
}

export function GearCartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadCart() {
      try {
        const raw = await AsyncStorage.getItem(GEAR_CART_STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : [];

        if (mounted) {
          setItems(sanitizeCartItems(parsed));
          setIsHydrated(true);
        }
      } catch {
        if (mounted) {
          setItems([]);
          setIsHydrated(true);
        }
      }
    }

    loadCart();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    AsyncStorage.setItem(GEAR_CART_STORAGE_KEY, JSON.stringify(items)).catch(() => {});
  }, [isHydrated, items]);

  const value = useMemo(() => {
    const addItem = (product, quantity = 1) => {
      setItems((currentItems) => {
        const nextQuantity = Math.max(Number(quantity || 1), 1);
        const existingItem = currentItems.find((item) => item.key === product.key);

        if (existingItem) {
          return currentItems.map((item) =>
            item.key === product.key
              ? {
                  ...item,
                  ...sanitizeCartItems([
                    {
                      ...item,
                      ...product,
                      quantity: Math.min(item.quantity + nextQuantity, product.stockCount || item.stockCount || 1),
                    },
                  ])[0],
                }
              : item
          );
        }

        return [
          ...currentItems,
          ...sanitizeCartItems([
            {
              ...product,
              quantity: Math.min(nextQuantity, product.stockCount || nextQuantity),
            },
          ]),
        ];
      });
    };

    const updateQuantity = (key, quantity) => {
      setItems((currentItems) =>
        currentItems.map((item) => {
          if (item.key !== key) {
            return item;
          }

          const safeQuantity = Math.max(1, Math.min(Number(quantity || 1), item.stockCount || 1));

          return {
            ...item,
            quantity: safeQuantity,
          };
        })
      );
    };

    const removeItem = (key) => {
      setItems((currentItems) => currentItems.filter((item) => item.key !== key));
    };

    const replaceItems = (nextItems) => {
      setItems(sanitizeCartItems(nextItems));
    };

    const clearCart = () => {
      setItems([]);
    };

    return {
      items,
      isHydrated,
      addItem,
      updateQuantity,
      removeItem,
      replaceItems,
      clearCart,
      totalItems: items.reduce((total, item) => total + Number(item.quantity || 0), 0),
      oneDayTotal: calculateGearCartOneDayTotal(items),
    };
  }, [isHydrated, items]);

  return <GearCartContext.Provider value={value}>{children}</GearCartContext.Provider>;
}

export function useGearCart() {
  const context = useContext(GearCartContext);

  if (!context) {
    throw new Error('useGearCart must be used within a GearCartProvider');
  }

  return context;
}
