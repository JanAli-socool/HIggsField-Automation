import { useSearchParams } from "react-router-dom";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Container } from "../../components/common/Container";
import { motion } from "framer-motion";

const errorMessages: Record<string, { title: string; description: string }> = {
  Configuration: {
    title: "Configuration Error",
    description: "There is a problem with the server configuration. Please contact support.",
  },
  AccessDenied: {
    title: "Access Denied",
    description: "You do not have permission to sign in. Please contact support if you believe this is an error.",
  },
  Verification: {
    title: "Verification Failed",
    description: "The verification link has expired or has already been used. Please request a new one.",
  },
  OAuthSignin: {
    title: "OAuth Sign In Error",
    description: "There was an error signing in with your OAuth provider. Please try again.",
  },
  OAuthCallback: {
    title: "OAuth Callback Error",
    description: "There was an error processing the OAuth callback. Please try again.",
  },
  OAuthCreateAccount: {
    title: "Account Creation Error",
    description: "Could not create your account. Please try again or use a different method.",
  },
  EmailCreateAccount: {
    title: "Account Creation Error",
    description: "Could not create your account with email. Please try again.",
  },
  Callback: {
    title: "Callback Error",
    description: "There was an error with the OAuth callback. Please try signing in again.",
  },
  OAuthAccountNotLinked: {
    title: "Account Not Linked",
    description: "This email is already associated with another account. Please sign in with that method instead.",
  },
  EmailSignin: {
    title: "Email Sign In Error",
    description: "There was an error sending the sign in email. Please try again.",
  },
  CredentialsSignin: {
    title: "Invalid Credentials",
    description: "The email or password you entered is incorrect. Please try again.",
  },
  SessionRequired: {
    title: "Session Required",
    description: "Please sign in to access this page.",
  },
  Default: {
    title: "Authentication Error",
    description: "An unexpected error occurred. Please try again or contact support.",
  },
};

export function AuthErrorPage() {
  const [searchParams] = useSearchParams();
  const error = searchParams.get("error") || "Default";
  const errorInfo = errorMessages[error] || errorMessages.Default;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen flex items-center justify-center py-12 px-4"
    >
      <Container className="max-w-md text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-display font-bold text-text-primary mb-2">
              {errorInfo.title}
            </h1>
            <p className="text-text-secondary">
              {errorInfo.description}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="primary" size="lg" asChild>
              <Link to="/auth/signin">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Try Again
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/">Go Home</Link>
            </Button>
          </div>
        </motion.div>
      </Container>
    </motion.div>
  );
}