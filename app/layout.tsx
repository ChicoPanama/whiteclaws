import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PrivyProvider from "@/components/PrivyProvider";
import { AuthProvider } from "@/components/AuthWrapper";

export const metadata = {
  title: 'WhiteClaws - Bounty Agent Platform',
  description: 'Decentralized security research platform connecting protocols with security researchers',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-900 text-white min-h-screen flex flex-col">
        <PrivyProvider>
          <AuthProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </AuthProvider>
        </PrivyProvider>
      </body>
    </html>
  );
}
