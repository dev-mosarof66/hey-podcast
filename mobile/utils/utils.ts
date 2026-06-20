import { heightPercentageToDP, widthPercentageToDP } from 'react-native-responsive-screen';

const hp = heightPercentageToDP;
const wp = widthPercentageToDP;
export { hp, wp };

/** Seconds → "m:ss" (or "h:mm:ss") for player timestamps. */
export function formatTime(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds || 0));
  const hours = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  const mm = hours > 0 ? String(mins).padStart(2, '0') : String(mins);
  return hours > 0 ? `${hours}:${mm}:${String(secs).padStart(2, '0')}` : `${mm}:${String(secs).padStart(2, '0')}`;
}
