import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chinook Cyber — Cyber OAKOC Planning",
  description: "OAKOC-based Cyber Threat Intelligence and Modeling Engine.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const currentTheme = localStorage.getItem("chinook-theme");
                if (currentTheme === "dark") {
                  document.documentElement.setAttribute("data-theme", "dark");
                } else if (!currentTheme && window.matchMedia("(prefers-color-scheme: dark)").matches) {
                  document.documentElement.setAttribute("data-theme", "dark");
                  localStorage.setItem("chinook-theme", "dark");
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="antialiased selection:bg-[var(--accent-glow)]">
        {children}
      </body>
    </html>
  );
}
