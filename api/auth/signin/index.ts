import NextAuth from "next-auth";
import { authOptions } from "../../../src/lib/auth/config.js";

export default NextAuth(authOptions);