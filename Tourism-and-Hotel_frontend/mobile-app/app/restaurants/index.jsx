import { useRouter } from 'expo-router';

import { fetchRestaurantsCatalog } from '../../src/api/restaurants';
import { CollectionScreen } from '../../src/screens/CollectionScreen';

export default function RestaurantsScreen() {
  const router = useRouter();

  return (
    <CollectionScreen
      title="Restaurants"
      subtitle="Browse WildHaven dining venues, then open menus and food collections for each restaurant."
      fetcher={fetchRestaurantsCatalog}
      actionLabel="View Menus"
      emptyMessage="No restaurants are available right now."
      onActionPress={(restaurant) => {
        router.push({
          pathname: '/restaurants/[restaurantId]/menus',
          params: {
            restaurantId: restaurant.id,
            restaurantName: restaurant.title,
          },
        });
      }}
    />
  );
}
