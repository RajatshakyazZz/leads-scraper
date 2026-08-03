import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin · DizoPulse",
  robots: { index: false, follow: false },
};


export default function ManageLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
