import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://chinookcyber.com"),
  title: "Chinook Cyber — Cyber OAKOC Planning",
  description: "OAKOC-based Cyber Threat Intelligence and Modeling Engine.",
  keywords: ["Cybersecurity", "OAKOC", "Threat Intelligence", "Modeling", "Chinook Cyber", "Cyber Planning"],
  authors: [{ name: "Chinook Cyber" }],
  creator: "Chinook Cyber",
  publisher: "Chinook Cyber",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://chinookcyber.com",
    title: "Chinook Cyber — Cyber OAKOC Planning",
    description: "OAKOC-based Cyber Threat Intelligence and Modeling Engine.",
    siteName: "Chinook Cyber",
  },
  twitter: {
    card: "summary_large_image",
    title: "Chinook Cyber — Cyber OAKOC Planning",
    description: "OAKOC-based Cyber Threat Intelligence and Modeling Engine.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
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
