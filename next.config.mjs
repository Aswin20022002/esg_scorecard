/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // pdfjs optionally requires node canvas, which we never need in the browser
    config.resolve.alias.canvas = false;
    return config;
  },
};
export default nextConfig;
