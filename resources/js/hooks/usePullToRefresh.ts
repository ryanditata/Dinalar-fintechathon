import { router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

interface UsePullToRefreshOptions {
    threshold?: number;
    maxPull?: number;
    resistance?: number;
    onRefresh?: () => void;
}

/**
 * Hook untuk gesture Pull-to-Refresh pada mode mobile apps.
 * Mendeteksi tarikan ke bawah saat scroll berada di paling atas layar.
 */
export function usePullToRefresh({
    threshold = 65,
    maxPull = 90,
    resistance = 0.45,
    onRefresh,
}: UsePullToRefreshOptions = {}) {
    const [pullDistance, setPullDistance] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isTracking, setIsTracking] = useState(false);

    const startYRef = useRef(0);
    const isTrackingRef = useRef(false);
    const pullDistanceRef = useRef(0);
    const isRefreshingRef = useRef(false);

    useEffect(() => {
        pullDistanceRef.current = pullDistance;
    }, [pullDistance]);

    useEffect(() => {
        isRefreshingRef.current = isRefreshing;
    }, [isRefreshing]);

    useEffect(() => {
        const isAtTop = () => {
            const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
            return scrollTop <= 1;
        };

        const hasOpenModal = () => {
            return !!document.querySelector('[role="dialog"], [data-state="open"]');
        };

        // --- Touch Events (Mobile Native) ---
        const handleTouchStart = (e: TouchEvent) => {
            if (isRefreshingRef.current || hasOpenModal()) return;
            if (isAtTop()) {
                startYRef.current = e.touches[0].clientY;
                isTrackingRef.current = true;
                setIsTracking(true);
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (!isTrackingRef.current || isRefreshingRef.current) return;

            const currentY = e.touches[0].clientY;
            const diff = currentY - startYRef.current;

            if (diff > 0 && isAtTop()) {
                if (e.cancelable) {
                    e.preventDefault();
                }
                const damped = Math.min(diff * resistance, maxPull);
                pullDistanceRef.current = damped;
                setPullDistance(damped);
            } else {
                pullDistanceRef.current = 0;
                setPullDistance(0);
                isTrackingRef.current = false;
                setIsTracking(false);
            }
        };

        const handleTouchEnd = () => {
            if (!isTrackingRef.current) return;
            isTrackingRef.current = false;
            setIsTracking(false);

            if (pullDistanceRef.current >= threshold && !isRefreshingRef.current) {
                isRefreshingRef.current = true;
                setIsRefreshing(true);
                setPullDistance(threshold * 0.8);

                const finishCallback = () => {
                    isRefreshingRef.current = false;
                    setIsRefreshing(false);
                    setPullDistance(0);
                };

                if (onRefresh) {
                    onRefresh();
                } else {
                    router.reload({
                        onFinish: finishCallback,
                        onError: finishCallback,
                    });
                }
            } else {
                pullDistanceRef.current = 0;
                setPullDistance(0);
            }
        };

        // --- Pointer/Mouse Events (Desktop Devtools & Testing) ---
        let isPointerActive = false;
        const handlePointerDown = (e: PointerEvent) => {
            if (e.pointerType === 'mouse' && e.button !== 0) return;
            if (isRefreshingRef.current || hasOpenModal()) return;
            if (isAtTop()) {
                startYRef.current = e.clientY;
                isPointerActive = true;
            }
        };

        const handlePointerMove = (e: PointerEvent) => {
            if (!isPointerActive || isRefreshingRef.current) return;
            const diff = e.clientY - startYRef.current;
            if (diff > 8 && isAtTop()) {
                isTrackingRef.current = true;
                setIsTracking(true);
                const damped = Math.min(diff * resistance, maxPull);
                pullDistanceRef.current = damped;
                setPullDistance(damped);
            }
        };

        const handlePointerUp = () => {
            if (!isPointerActive) return;
            isPointerActive = false;
            handleTouchEnd();
        };

        window.addEventListener('touchstart', handleTouchStart, { passive: true });
        window.addEventListener('touchmove', handleTouchMove, { passive: false });
        window.addEventListener('touchend', handleTouchEnd);
        window.addEventListener('touchcancel', handleTouchEnd);

        window.addEventListener('pointerdown', handlePointerDown);
        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
        window.addEventListener('pointercancel', handlePointerUp);

        return () => {
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);
            window.removeEventListener('touchcancel', handleTouchEnd);

            window.removeEventListener('pointerdown', handlePointerDown);
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
            window.removeEventListener('pointercancel', handlePointerUp);
        };
    }, [maxPull, resistance, threshold, onRefresh]);

    return {
        pullDistance,
        isRefreshing,
        isTracking,
    };
}

export default usePullToRefresh;
