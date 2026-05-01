import { RoomBookingBell } from './RoomBookingBell';

export function PackageBookingsBell({ unreadCount = 0, onPress }) {
  return <RoomBookingBell unreadCount={unreadCount} onPress={onPress} />;
}
