import type { Metadata } from 'next';
import { Poppins, Inter } from 'next/font/google';
import React from 'react';
import ThemeRegistry from '@/theme/ThemeRegistry';

const poppins = Poppins({
    subsets: ['latin'],
    weight: ['300', '400', '500', '600', '700'],
    variable: '--font-poppins',
});

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
});

export const metadata: Metadata = {
    title: 'Workforce Management | Ubeya-Inspired',
    description: 'AI-Powered Workforce Management',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className={`${poppins.variable} ${inter.variable}`}>
                <ThemeRegistry>
                    {children}
                </ThemeRegistry>
            </body>
        </html>
    );
}
