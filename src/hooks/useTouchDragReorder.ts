import { useState, useRef, useCallback, useEffect } from 'react'

const LONG_PRESS_MS = 450
const DATA_ATTR = 'data-drag-id'

export interface UseTouchDragReorderOptions<T> {
  items: T[]
  getItemId: (item: T) => string
  onReorder: (reorderedIds: string[]) => void | Promise<void>
  isDisabled?: (item: T) => boolean
}

export function useTouchDragReorder<T>({
  items,
  getItemId,
  onReorder,
  isDisabled,
}: UseTouchDragReorderOptions<T>) {
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const touchStartRef = useRef<{ x: number; y: number; id: string } | null>(null)
  const isDraggingRef = useRef(false)
  const lastReorderTargetRef = useRef<string | null>(null)
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const draggedElementRef = useRef<Element | null>(null)
  const itemsRef = useRef(items)
  itemsRef.current = items

  const performReorder = useCallback(
    (fromId: string, toId: string) => {
      if (fromId === toId) return
      const currentItems = itemsRef.current
      const fromIdx = currentItems.findIndex((i) => getItemId(i) === fromId)
      const toIdx = currentItems.findIndex((i) => getItemId(i) === toId)
      if (fromIdx === -1 || toIdx === -1) return

      const reordered = [...currentItems]
      const [removed] = reordered.splice(fromIdx, 1)
      reordered.splice(toIdx, 0, removed)
      onReorder(reordered.map((i) => getItemId(i)))
    },
    [getItemId, onReorder]
  )

  const getTargetIdFromPoint = useCallback((clientX: number, clientY: number): string | null => {
    // On iOS, the dragged element can block elementFromPoint. Temporarily hide it
    // from hit-testing so we can find the element underneath.
    const dragEl = draggedElementRef.current
    let pointerEvents = ''
    if (dragEl && dragEl instanceof HTMLElement) {
      pointerEvents = dragEl.style.pointerEvents
      dragEl.style.pointerEvents = 'none'
    }
    const el = document.elementFromPoint(clientX, clientY)
    if (dragEl && dragEl instanceof HTMLElement) {
      dragEl.style.pointerEvents = pointerEvents
    }
    const targetDragEl = el?.closest(`[${DATA_ATTR}]`)
    return targetDragEl ? (targetDragEl.getAttribute(DATA_ATTR) as string) : null
  }, [])

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!touchStartRef.current || !e.touches.length) return

      if (isDraggingRef.current) {
        e.preventDefault()
        const touch = e.touches[0]
        const targetId = getTargetIdFromPoint(touch.clientX, touch.clientY)
        if (targetId && targetId !== touchStartRef.current.id) {
          setDragOverId(targetId)
          lastReorderTargetRef.current = targetId
        } else {
          setDragOverId(null)
          lastReorderTargetRef.current = null
        }
      }
    },
    [getTargetIdFromPoint]
  )

  const handleTouchEnd = useCallback(
    async (e: TouchEvent) => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
        longPressTimerRef.current = null
      }
      draggedElementRef.current = null

      if (!touchStartRef.current) return

      if (isDraggingRef.current) {
        e.preventDefault()
        const targetId = lastReorderTargetRef.current
        if (targetId) {
          await performReorder(touchStartRef.current.id, targetId)
        }
      }

      touchStartRef.current = null
      isDraggingRef.current = false
      lastReorderTargetRef.current = null
      setDraggedId(null)
      setDragOverId(null)
    },
    [performReorder]
  )

  useEffect(() => {
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd, { passive: false })
    document.addEventListener('touchcancel', handleTouchEnd, { passive: false })
    return () => {
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
      document.removeEventListener('touchcancel', handleTouchEnd)
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current)
    }
  }, [handleTouchMove, handleTouchEnd])

  const handleTouchStart = useCallback(
    (e: React.TouchEvent, itemId: string) => {
      const item = items.find((i) => getItemId(i) === itemId)
      if (isDisabled?.(item as T)) return

      const touch = e.touches[0]
      touchStartRef.current = { x: touch.clientX, y: touch.clientY, id: itemId }
      isDraggingRef.current = false
      lastReorderTargetRef.current = null

      // Long-press to activate drag (hold ~450ms)
      longPressTimerRef.current = setTimeout(() => {
        longPressTimerRef.current = null
        isDraggingRef.current = true
        setDraggedId(itemId)
        // Store ref to dragged element for elementFromPoint fix on iOS
        draggedElementRef.current = document.querySelector(
          `[${DATA_ATTR}="${CSS.escape(itemId)}"]`
        )
        // Haptic feedback on supported devices
        if (navigator.vibrate) navigator.vibrate(50)
      }, LONG_PRESS_MS)
    },
    [items, getItemId, isDisabled]
  )

  const getDragProps = useCallback(
    (item: T) => {
      const id = getItemId(item)
      return {
        [DATA_ATTR]: id,
        onTouchStart: (e: React.TouchEvent) => handleTouchStart(e, id),
        // Prevent browser from consuming touch for scroll/zoom so our handlers get touchmove
        style: { touchAction: 'none' } as React.CSSProperties,
      }
    },
    [getItemId, handleTouchStart]
  )

  return { draggedId, dragOverId, getDragProps, DATA_ATTR }
}
