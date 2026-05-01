import { useCallback } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { fetchMenuFoodItemsCatalog } from '../../../../src/api/restaurants';
import { CollectionScreen } from '../../../../src/screens/CollectionScreen';
import { useRequireAuth } from '../../../../src/hooks/useAuth';

export default function RestaurantFoodItemsScreen() {
  const router = useRouter();
  const requireAuth = useRequireAuth();
  const params = useLocalSearchParams();

  const menuId = typeof params.menuId === 'string' ? params.menuId : '';
  const menuName = typeof params.menuName === 'string' ? params.menuName : 'Menu';
  const restaurantId =
    typeof params.restaurantId === 'string' ? params.restaurantId : '';
  const restaurantName =
    typeof params.restaurantName === 'string' ? params.restaurantName : 'Restaurant';

  const fetcher = useCallback(() => fetchMenuFoodItemsCatalog(menuId), [menuId]);

  return (
    <CollectionScreen
      title={menuName}
      subtitle={`Browse food items from ${restaurantName}. Guests can view everything, but ordering requires login.`}
      fetcher={fetcher}
      actionLabel="Order Food"
      emptyMessage="No food items are available in this menu right now."
      onActionPress={(foodItem) => {
        const targetPath = `/restaurants/order?foodItemId=${foodItem.id}&menuId=${menuId}&restaurantId=${restaurantId}&menuName=${encodeURIComponent(menuName)}&restaurantName=${encodeURIComponent(restaurantName)}`;

        if (
          !requireAuth(targetPath, {
            message: 'Please login or sign up to order food',
          })
        ) {
          return;
        }

        router.push({
          pathname: '/restaurants/order',
          params: {
            foodItemId: foodItem.id,
            menuId,
            restaurantId,
            menuName,
            restaurantName,
          },
        });
      }}
    />
  );
}
