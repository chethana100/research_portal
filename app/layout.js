export const metadata = {
  title: "Financial Research Portal",
  description: "Internal research tool for financial document analysis.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  );
}
