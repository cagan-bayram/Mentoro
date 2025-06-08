import "next-auth";

declare module "next-auth" {
  interface User {
    role?: "STUDENT" | "TEACHER";
  }

  interface Session {
    user: User & {
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
} 