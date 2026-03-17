import { useState, useRef } from 'react'

interface SwipeOptions {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  threshold?: number
}

export function useSwipe({ onSwipeLeft, onSwipeRight, threshold = 50 }: SwipeOptions) {
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const [isSwiping, setIsSwiping] = useState(false)
  const minSwipeDistance = threshold
  const directionRef = useRef<'left' | 'right' | null>(null)

  const onTouchStart = (e: React.TouchEvent) => {
    setIsSwiping(true)
    directionRef.current = null
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStart === null) return
    const currentX = e.targetTouches[0].clientX
    const diff = touchStart - currentX
    
    if (diff > 0) {
      directionRef.current = 'left'
    } else {
      directionRef.current = 'right'
    }
    setTouchEnd(currentX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) {
      setIsSwiping(false)
      return
    }
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe && onSwipeLeft) {
      onSwipeLeft()
    }
    if (isRightSwipe && onSwipeRight) {
      onSwipeRight()
    }
    
    setIsSwiping(false)
    setTouchStart(null)
    setTouchEnd(null)
    directionRef.current = null
  }

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    isSwiping,
    swipeDirection: directionRef.current
  }
}
