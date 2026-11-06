import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // Lessons are read from disk at request time too (the room bar makes every page dynamic):
  // ship content/ with every server function, not only the lesson route.
  outputFileTracingIncludes: { "/**": ["./content/**/*.json"] },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
