import type { MilkSession } from '@/hooks/useMilkEntries';

/**
 * Get current hour in IST (Indian Standard Time, UTC+5:30)
 */
export function getISTHour(): number {
  const now = new Date();
  // IST is UTC+5:30
  const utcHours = now.getUTCHours();
  const utcMinutes = now.getUTCMinutes();
  // Convert to IST by adding 5 hours and 30 minutes
  const istTotalMinutes = utcHours * 60 + utcMinutes + 330; // 5*60 + 30 = 330
  const istHour = Math.floor((istTotalMinutes % 1440) / 60); // 1440 = 24*60
  return istHour;
}

/**
 * Determine the current milk collection session based on IST time
 * - Morning session: 4 AM to 10 AM IST
 * - Evening session: 4 PM to 10 PM IST
 * - Outside these hours: returns the closest/most recent session
 */
export function getCurrentSession(): MilkSession {
  const istHour = getISTHour();
  
  // Morning: 4 AM (4) to 10 AM (10) - hour 4, 5, 6, 7, 8, 9
  // Evening: 4 PM (16) to 10 PM (22) - hour 16, 17, 18, 19, 20, 21
  
  if (istHour >= 4 && istHour < 10) {
    return 'morning';
  } else if (istHour >= 16 && istHour < 22) {
    return 'evening';
  } else if (istHour >= 10 && istHour < 16) {
    // Between sessions (10 AM - 4 PM): show morning as it just ended
    return 'morning';
  } else {
    // Night time (10 PM - 4 AM): show evening as it just ended or morning for next day
    return istHour >= 22 ? 'evening' : 'morning';
  }
}

/**
 * Check if collection is currently open (within active session hours)
 * Morning: 4 AM - 10 AM IST
 * Evening: 4 PM - 10 PM IST
 */
export function isCollectionOpen(): boolean {
  const istHour = getISTHour();
  return (istHour >= 4 && istHour < 10) || (istHour >= 16 && istHour < 22);
}

/**
 * Get session display info including whether it's active
 */
export function getSessionInfo(): {
  session: MilkSession;
  isActive: boolean;
  label: string;
} {
  const istHour = getISTHour();
  const session = getCurrentSession();
  const isActive = isCollectionOpen();
  
  return {
    session,
    isActive,
    label: session === 'morning' ? 'Morning Session' : 'Evening Session',
  };
}
