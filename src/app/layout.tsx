import type { Metadata } from "next";
import { connection } from "next/server";
import "./globals.css";

export const metadata: Metadata = { title: "Terminverwaltung", description: "System für Terminbuchung und Terminverwaltung" };
export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await connection();
  return <html lang="de"><body>{children}</body></html>;
}
