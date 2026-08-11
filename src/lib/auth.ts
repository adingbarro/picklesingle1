import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  session: { strategy: "jwt" },
  // Auth.js only auto-trusts the incoming host header on Vercel. On Railway (or any
  // other host) it otherwise rejects requests with a generic "server configuration"
  // error, since it can't tell a proxied Host header from a spoofed one.
  trustHost: true,
});
