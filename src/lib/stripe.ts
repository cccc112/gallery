import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_mock';

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2024-04-10' as any, // 採用穩定的 Stripe API 版本
});

export const isStripeConfigured = () => {
  return stripeSecretKey && !stripeSecretKey.startsWith('sk_test_mock');
};
