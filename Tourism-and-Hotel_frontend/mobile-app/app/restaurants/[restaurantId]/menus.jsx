import { useCallback } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { fetchRestaurantMenusCatalog } from '../../../src/api/restaurants';
import { CollectionScreen } from '../../../src/screens/CollectionScreen';

export default function RestaurantMenusScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const restaurantId =
    typeof params.restaurantId === 'string' ? params.restaurantId : '';
  const restaurantName =
    typeof params.restaurantName === 'string' ? params.restaurantName : 'Restaurant';

  const fetcher = useCallback(() => fetchRestaurantMenusCatalog(restaurantId), [restaurantId]);

  return (
    <CollectionScreen
      title={`${restaurantName} Menus`}
      subtitle="Explore the available menu collections for this restaurant."
      fetcher={fetcher}
      actionLabel="View Food Items"
      emptyMessage="No menus are available for this restaurant right now."
      onActionPress={(menu) => {
        router.push({
          pathname: '/restaurants/menus/[menuId]/food-items',
          params: {
            menuId: menu.id,
            menuName: menu.title,
            restaurantId,
            restaurantName,
          },
        });
      }}
    />
  );
}
