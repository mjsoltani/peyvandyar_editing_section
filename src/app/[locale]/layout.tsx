import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "Basalam Product Manager",
  description: "Advanced product management tool for Basalam vendors",
};

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
}) {
  const { locale } = await params;

  return (
    <html lang={locale} dir={locale === 'fa' ? 'rtl' : 'ltr'}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" 
          rel="stylesheet" 
        />
        <link 
          href="https://cdn.jsdelivr.net/gh/rastikerdar/iranSans@v5.0/dist/font-face.css" 
          rel="stylesheet" 
        />
        <link 
          href="https://cdn.jsdelivr.net/gh/rastikerdar/vazir@v30.1.0/dist/font-face.css" 
          rel="stylesheet" 
        />
        <link 
          href="https://cdn.jsdelivr.net/gh/rastikerdar/sahel@v3.4.0/dist/font-face.css" 
          rel="stylesheet" 
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}