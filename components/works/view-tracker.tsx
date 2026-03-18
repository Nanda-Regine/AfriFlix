'use client'

import { useEffect } from 'react'

// Fires a single view-count increment when a work page mounts.
// Runs once per component lifetime — no repeat on re-render.
export function ViewTracker({ workId }: { workId: string }) {
  useEffect(() => {
    fetch(`/api/works/${workId}/view`, { method: 'POST' }).catch(() => {})
  }, [workId])

  return null
}
