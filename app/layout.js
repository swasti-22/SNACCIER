import { Inter, Poppins, Caveat } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/AuthContext";
import Navbar from "@/components/Navbar";
import GlobalLoader from "@/components/GlobalLoader";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
});

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-caveat",
});

export const metadata = {
  title: "SNACCIER | Campus Food Delivery",
  description: "Skip the queue. Pre-order snacks and meals from canteens across the campus.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable} ${caveat.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AuthProvider>
          <GlobalLoader>
            <Navbar />
            <main>{children}</main>
          </GlobalLoader>
        </AuthProvider>
      </body>
    </html>
  );
}

