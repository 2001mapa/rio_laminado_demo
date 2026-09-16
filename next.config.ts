import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true, // Apaga la optimización de Vercel para evitar cobros sorpresa
  },
};

export default nextConfig;
