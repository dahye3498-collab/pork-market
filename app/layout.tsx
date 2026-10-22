import type { Metadata } from 'next';
export const metadata: Metadata = { title: '돈육 시세노트', description: '돼지 경락가격 조회와 기록' };
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="ko"><body style={{margin:0}}>{children}</body></html>}

