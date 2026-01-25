// Shim for use-sync-external-store/shim/with-selector that uses React 19's built-in useSyncExternalStore
// Based on the official implementation from React
import { useSyncExternalStore, useRef, useCallback, useMemo } from 'react'

type InstRef<Snapshot, Selection> = {
  hasValue: boolean
  value: Selection | null
  snapshot: Snapshot | null
  selector: ((snapshot: Snapshot) => Selection) | null
  isEqual: ((a: Selection, b: Selection) => boolean) | undefined
}

export function useSyncExternalStoreWithSelector<Snapshot, Selection>(
  subscribe: (onStoreChange: () => void) => () => void,
  getSnapshot: () => Snapshot,
  getServerSnapshot: undefined | null | (() => Snapshot),
  selector: (snapshot: Snapshot) => Selection,
  isEqual?: (a: Selection, b: Selection) => boolean
): Selection {
  const instRef = useRef<InstRef<Snapshot, Selection> | null>(null)

  if (instRef.current === null) {
    instRef.current = {
      hasValue: false,
      value: null,
      snapshot: null,
      selector: null,
      isEqual: undefined,
    }
  }

  const inst = instRef.current

  const getSelection = useCallback(() => {
    const nextSnapshot = getSnapshot()

    // Check if we can reuse the previous selection
    if (
      inst.hasValue &&
      inst.snapshot === nextSnapshot &&
      inst.selector === selector &&
      inst.isEqual === isEqual
    ) {
      return inst.value!
    }

    const nextSelection = selector(nextSnapshot)

    // Check equality with previous selection
    if (
      inst.hasValue &&
      isEqual !== undefined &&
      isEqual(inst.value!, nextSelection)
    ) {
      // Reuse the previous selection
      return inst.value!
    }

    inst.hasValue = true
    inst.value = nextSelection
    inst.snapshot = nextSnapshot
    inst.selector = selector
    inst.isEqual = isEqual

    return nextSelection
  }, [getSnapshot, selector, isEqual, inst])

  // Memoize the server selection to avoid the "getServerSnapshot should be cached" warning
  const getServerSelection = useMemo(() => {
    if (getServerSnapshot === undefined || getServerSnapshot === null) {
      return undefined
    }

    // Cache the server snapshot selection
    let cachedServerSnapshot: Snapshot | null = null
    let cachedServerSelection: Selection | null = null

    return () => {
      const serverSnapshot = getServerSnapshot()

      // Return cached selection if snapshot hasn't changed
      if (cachedServerSnapshot === serverSnapshot && cachedServerSelection !== null) {
        return cachedServerSelection
      }

      const serverSelection = selector(serverSnapshot)
      cachedServerSnapshot = serverSnapshot
      cachedServerSelection = serverSelection

      return serverSelection
    }
  }, [getServerSnapshot, selector])

  return useSyncExternalStore(subscribe, getSelection, getServerSelection)
}

export default { useSyncExternalStoreWithSelector }
