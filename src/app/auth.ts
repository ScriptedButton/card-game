import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      // Create or update user in the database when they sign in
      try {
        if (user.email) {
          await prisma.user.upsert({
            where: { email: user.email },
            update: {
              name: user.name,
              image: user.image,
            },
            create: {
              id: user.id,
              name: user.name,
              email: user.email,
              image: user.image,
            },
          });
          console.log("User created/updated on sign in:", user.id);
        }
      } catch (error) {
        console.error("Error creating user in database:", error);
        // Still allow sign-in even if database update fails
      }
      return true;
    },
    async session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});
