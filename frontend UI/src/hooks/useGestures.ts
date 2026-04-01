/**
 * useGestures Hook
 * Handle gesture events from sensors or keyboard simulation
 */

import { useEffect, useCallback } from 'react'
import { useAppStore } from '../stores/appStore'

export function useGestures() {
    const {
        gesture,
        setGesture,
        currentModel,
        setCurrentModel
    } = useAppStore()

    // Available models for navigation
    const models = ['cube', 'sphere', 'torus', 'reactor'] as const

    // Handle swipe left - previous model
    const onSwipeLeft = useCallback(() => {
        const currentIndex = models.indexOf(currentModel as typeof models[number])
        const newIndex = currentIndex > 0 ? currentIndex - 1 : models.length - 1
        setCurrentModel(models[newIndex])
        console.log('👈 Swipe Left → Model:', models[newIndex])
    }, [currentModel, setCurrentModel])

    // Handle swipe right - next model
    const onSwipeRight = useCallback(() => {
        const currentIndex = models.indexOf(currentModel as typeof models[number])
        const newIndex = currentIndex < models.length - 1 ? currentIndex + 1 : 0
        setCurrentModel(models[newIndex])
        console.log('👉 Swipe Right → Model:', models[newIndex])
    }, [currentModel, setCurrentModel])

    // Handle push - select/confirm
    const onPush = useCallback(() => {
        console.log('👊 Push → Select')
        // Could trigger selection or zoom in
    }, [])

    // Handle pull - back/cancel
    const onPull = useCallback(() => {
        console.log('🤚 Pull → Back')
        // Could trigger back navigation
    }, [])

    // Process gesture changes
    useEffect(() => {
        if (gesture === 'none') return

        switch (gesture) {
            case 'swipe_left':
                onSwipeLeft()
                break
            case 'swipe_right':
                onSwipeRight()
                break
            case 'push':
                onPush()
                break
            case 'pull':
                onPull()
                break
            case 'grab':
                // Closed fist = confirm selection (same as push/select)
                onPush()
                break
            case 'hover':
                // Open palm = no action, just visual
                break
        }

        // Reset gesture after processing
        const timeout = setTimeout(() => setGesture('none'), 300)
        return () => clearTimeout(timeout)
    }, [gesture, onSwipeLeft, onSwipeRight, onPush, onPull, setGesture])

    // Keyboard simulation for testing
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key) {
                case 'ArrowLeft':
                    setGesture('swipe_left')
                    break
                case 'ArrowRight':
                    setGesture('swipe_right')
                    break
                case 'ArrowUp':
                    setGesture('push')
                    break
                case 'ArrowDown':
                    setGesture('pull')
                    break
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [setGesture])

    return {
        gesture,
        setGesture,
        onSwipeLeft,
        onSwipeRight,
        onPush,
        onPull
    }
}
