import NextAuth from "next-auth";
import { authOptions } from "../../../../src/lib/auth/nextauth.js";

export default NextAuth(authOptions);