import { Link } from "react-router-dom";
import { Check, ArrowRight, Sparkles, Zap, Crown, Users, Shield, Cloud } from "lucide-react";
import { Button } from "../ui/Button";
import { Container } from "../common/Container";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "/month",
    description: "Perfect for getting started",
    features: [
      "5 daily generations",
      "Access to free models",
      "720p resolution",
      "Community gallery",
      "Basic effects",
    ],
    cta: "Start Free",
    popular: false,
    icon: Sparkles,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/month",
    description: "For serious creators",
    features: [
      "500 credits/month",
      "All models including 4K",
      "1080p & 4K resolution",
      "Priority queue",
      "Commercial rights",
      "Advanced effects",
      "API access",
    ],
    cta: "Get Pro",
    popular: true,
    icon: Zap,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For teams & studios",
    features: [
      "Unlimited generations",
      "Dedicated support",
      "Custom models",
      "Team collaboration",
      "SSO & audit logs",
      "SLA guarantee",
      "On-premise option",
    ],
    cta: "Contact Sales",
    popular: false,
    icon: Crown,
  },
];

export function PricingTeaser() {
  return (
    <section className="py-16 lg:py-24">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 lg:mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-text-primary mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            Pay for what you use. No hidden fees. Cancel anytime.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {plans.map((plan, index) => (
            <motion.article
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "relative bg-surface border rounded-2xl p-6 lg:p-8 flex flex-col",
                plan.popular
                  ? "border-primary/50 shadow-xl shadow-primary/10"
                  : "border-border hover:border-primary/30 transition-colors"
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 bg-primary text-white text-xs font-medium rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/20 text-primary rounded-lg">
                  <plan.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-text-primary">{plan.name}</h3>
                  <p className="text-sm text-text-secondary">{plan.description}</p>
                </div>
              </div>

              <div className="mb-6">
                <span className="text-4xl lg:text-5xl font-display font-bold text-text-primary">{plan.price}</span>
                <span className="text-text-muted">{plan.period}</span>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + i * 0.05 }}
                    className="flex items-start gap-3 text-text-secondary"
                  >
                    <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </motion.li>
                ))}
              </ul>

              <Button
                variant={plan.popular ? "primary" : "outline"}
                className="w-full justify-center"
                asChild
              >
                <Link to="/pricing">{plan.cta}</Link>
              </Button>
            </motion.article>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 text-center"
        >
          {[
            { icon: Shield, title: "Cancel Anytime", desc: "No lock-in contracts" },
            { icon: Cloud, title: "Cloud Rendering", desc: "No GPU needed" },
            { icon: Users, title: "Team Ready", desc: "Collaborate in real-time" },
            { icon: Sparkles, title: "Always Latest", desc: "New models weekly" },
          ].map((item, i) => (
            <div key={item.title} className="p-4 bg-surface/50 border border-border rounded-xl">
              <div className="p-2 bg-primary/20 text-primary rounded-lg w-fit mx-auto mb-3">
                <item.icon className="w-5 h-5" />
              </div>
              <h4 className="font-semibold text-text-primary mb-1">{item.title}</h4>
              <p className="text-sm text-text-secondary">{item.desc}</p>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-10 text-center"
        >
          <Button variant="ghost" size="lg" asChild>
            <Link to="/pricing">View Full Pricing Details</Link>
          </Button>
        </motion.div>
      </Container>
    </section>
  );
}