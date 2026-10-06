import { HTMLAttributes } from 'react';

export default function AppLogoIcon(props: HTMLAttributes<HTMLImageElement>) {
    return (
        <img
            src="/images/newLogo.png?v=3"
            alt="Dinalar Logo"
            {...props}
        />
    );
}
