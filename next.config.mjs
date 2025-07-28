import pwa from 'next-pwa';

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
};

const withPWA = pwa({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
});

export default withPWA(nextConfig);
