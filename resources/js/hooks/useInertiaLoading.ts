import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

/**
 * Custom hook untuk mendeteksi apakah Inertia sedang melakukan navigasi atau request.
 * Mendengarkan event router global 'start' dan 'finish'.
 */
export function useInertiaLoading(): boolean {
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const removeStart = router.on('start', () => {
            setIsLoading(true);
        });

        const removeFinish = router.on('finish', () => {
            setIsLoading(false);
        });

        return () => {
            removeStart();
            removeFinish();
        };
    }, []);

    return isLoading;
}

export default useInertiaLoading;
