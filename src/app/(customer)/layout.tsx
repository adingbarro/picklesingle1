import TabBar from "@/components/TabBar";
import { getCurrentCustomerEmail } from "@/lib/customer";

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  const isLoggedIn = (await getCurrentCustomerEmail()) !== null;

  return (
    <div className="app-shell">
      <div className="app-body">{children}</div>
      <TabBar isLoggedIn={isLoggedIn} />
    </div>
  );
}
