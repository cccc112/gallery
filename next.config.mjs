/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'plus.unsplash.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'api.dicebear.com' },
    ],
  },
  webpack: (config) => {
    // wagmi / RainbowKit / WalletConnect 在 Next.js web 環境下的標準 fallback
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      'pino-pretty': false,
      '@react-native-async-storage/async-storage': false,
    };

    // 防止 MetaMask SDK 的 node-only modules 污染 browser bundle
    config.resolve.alias = {
      ...config.resolve.alias,
      'pino-pretty': false,
      '@react-native-async-storage/async-storage': false,
      lokijs: false,
    };

    return config;
  },
};

export default nextConfig;

