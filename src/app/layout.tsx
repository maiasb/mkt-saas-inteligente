import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agência de Marketing - Painel Administrativo",
  description: "Sistema de recomendações e premiações",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
        <Script
          id="remove-extensions"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined') {
                const observer = new MutationObserver(() => {
                  document.body.removeAttribute('cz-shortcut-listen');
                });
                observer.observe(document.body, { attributes: true });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
