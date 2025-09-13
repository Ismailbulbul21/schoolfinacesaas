import { useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'

// Hook to automatically refresh session to keep it alive
export const useSessionRefresh = () => {
  const { session, refreshSessionIfNeeded } = useAuth()
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastRefreshRef = useRef<number>(0)

  useEffect(() => {
    if (!session) return

    // Refresh session every 45 minutes to keep it alive (longer interval)
    const scheduleRefresh = () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
      
      refreshTimeoutRef.current = setTimeout(async () => {
        const now = Date.now()
        // Only refresh if it's been at least 30 minutes since last refresh
        if (now - lastRefreshRef.current > 30 * 60 * 1000) {
          console.log('Auto-refreshing session...')
          const success = await refreshSessionIfNeeded()
          if (success) {
            lastRefreshRef.current = now
          }
        }
        scheduleRefresh() // Schedule next refresh
      }, 45 * 60 * 1000) // 45 minutes
    }

    scheduleRefresh()

    // Also refresh when user becomes active (returns to tab) but only if it's been a while
    const handleVisibilityChange = async () => {
      if (!document.hidden && session) {
        const now = Date.now()
        if (now - lastRefreshRef.current > 10 * 60 * 1000) { // Only if 10+ minutes since last refresh
          console.log('User returned to tab, refreshing session...')
          const success = await refreshSessionIfNeeded()
          if (success) {
            lastRefreshRef.current = now
          }
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [session, refreshSessionIfNeeded])
}
