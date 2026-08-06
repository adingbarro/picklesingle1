import { cookies } from "next/headers";
import TabBar from "@/components/TabBar";
import { CUSTOMER_SESSION_COOKIE, readCustomerSessionEmail } from "@/lib/customerAuth";

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const isLoggedIn = readCustomerSessionEmail(cookieStore.get(CUSTOMER_SESSION_COOKIE)?.value) !== null;

  return (
    <div className="app-shell">
      <div className="app-body">{children}</div>
      <TabBar isLoggedIn={isLoggedIn} />
    </div>
  );
}
