import { useState, useRef, useCallback, useEffect } from 'react'

const DRAG_THRESHOLD_PX = 8
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
    const el = document.elementFromPoint(clientX, clientY)
    const dragEl = el?.closest(`[${DATA_ATTR}]`)
    return dragEl ? (dragEl.getAttribute(DATA_ATTR) as string) : null
  }, [])

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!touchStartRef.current || !e.touches.length) return
      const touch = e.touches[0]
      const dx = touch.clientX - touchStartRef.current.x
      const dy = touch.clientY - touchStartRef.current.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (!isDraggingRef.current && distance > DRAG_THRESHOLD_PX) {
        isDraggingRef.current = true
        setDraggedId(touchStartRef.current.id)
      }

      if (isDraggingRef.current) {
        e.preventDefault()
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
      if (!touchStartRef.current) return
      const touch = e.changedTouches[0]

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
    },
    [items, getItemId, isDisabled]
  )

  const getDragProps = useCallback(
    (item: T) => {
      const id = getItemId(item)
      return {
        [DATA_ATTR]: id,
        onTouchStart: (e: React.TouchEvent) => handleTouchStart(e, id),
        style: { touchAction: 'manipulation' } as React.CSSProperties,
      }
    },
    [getItemId, handleTouchStart]
  )

  return { draggedId, dragOverId, getDragProps, DATA_ATTR }
}
