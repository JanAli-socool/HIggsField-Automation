import { signOut } from "next-auth/react";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Container } from "../../components/common/Container";
import { motion } from "framer-motion";

export function SignOutPage() {
  useEffect(() => {
    const handleSignOut = async () => {
      await signOut({ callbackUrl: "/", redirect: true });
    };
    handleSignOut();
  }, []);

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
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-display font-bold text-text-primary mb-2">
              Signed Out
            </h1>
            <p className="text-text-secondary">
              You have been successfully signed out of your account.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="primary" size="lg" asChild>
              <Link to="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go to Home
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/auth/signin">Sign In Again</Link>
            </Button>
          </div>
        </motion.div>
      </Container>
    </motion.div>
  );
}