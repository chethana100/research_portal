import "./globals.css";

export const metadata = {
  title: "ResearcheX | AI-Powered Research Portal",
  description: "Structured extraction and analysis for specialized research tasks.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="glow-mesh" />
        <main className="min-h-screen flex flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}
