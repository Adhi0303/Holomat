/**
 * useHandClick Hook
 * ==================
 * Dispatches synthetic DOM clicks when the user pinches (thumb + index).
 * Finds the element under the virtual cursor via document.elementFromPoint()
 * and fires a real click event on it.
 *
 * Features:
 *   - 400ms debounce to prevent rapid-fire clicks
 *   - Ignores clicks on the VirtualHandCursor overlay itself
 *   - Visual feedback via a brief body class for CSS hooks
 */

import { useEffect, useRef } from 'react'
import { useAppStore } from '../stores/appStore'

const CLICK_COOLDOWN_MS = 400

export function useHandClick() {
    const { handCursor } = useAppStore()
    const lastClickTime = useRef(0)
    const wasPinching = useRef(false)

    useEffect(() => {
        // Trigger click on pinch START (transition: not pinching → pinching)
        if (handCursor.isPinching && !wasPinching.current && handCursor.visible) {
            const now = Date.now()

            if (now - lastClickTime.current > CLICK_COOLDOWN_MS) {
                lastClickTime.current = now

                // Find element at cursor position
                const el = document.elementFromPoint(
                    handCursor.screenX,
                    handCursor.screenY
                )

                if (el) {
                    // Skip clicking on the cursor overlay itself
                    const isOverlay = (el as HTMLElement).closest?.('.vhc-overlay')
                    const isHandOverlay = (el as HTMLElement).closest?.('.ht-overlay')

                    if (!isOverlay && !isHandOverlay) {
                        // Dispatch synthetic click
                        const clickEvent = new MouseEvent('click', {
                            bubbles: true,
                            cancelable: true,
                            clientX: handCursor.screenX,
                            clientY: handCursor.screenY,
                            view: window,
                        })
                        el.dispatchEvent(clickEvent)

                        console.log(
                            `🖱️ Hand click at (${Math.round(handCursor.screenX)}, ${Math.round(handCursor.screenY)})`,
                            `→ <${el.tagName.toLowerCase()}${el.className ? '.' + el.className.split(' ')[0] : ''}>`
                        )

                        // Visual feedback: add body class briefly
                        document.body.classList.add('vhc-clicked')
                        setTimeout(() => {
                            document.body.classList.remove('vhc-clicked')
                        }, 200)
                    }
                }
            }
        }

        wasPinching.current = handCursor.isPinching
    }, [handCursor.isPinching, handCursor.visible, handCursor.screenX, handCursor.screenY])
}
