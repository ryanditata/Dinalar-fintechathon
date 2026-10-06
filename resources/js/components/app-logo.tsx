import { HTMLAttributes } from 'react';

export default function AppLogo({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={`flex items-center ${className || ''}`} {...props}>
            <div className="w-8 h-auto">
                <img src="/images/newLogo.png?v=3" alt="Icon Dashboard" />
            </div>
            <div className="ml-2 grid flex-1 text-left text-base">
                <span className="truncate leading-tight font-semibold text-emerald-600">DINALAR</span>
            </div>
        </div>
    );
}
