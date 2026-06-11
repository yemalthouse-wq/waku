/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // output: "export" は使わない。
  // 理由: app/api/**/route.ts と排他のため。
  // WAKU v0.1 は Vercel 上で動かすので、純静的 export にこだわらない。
};

module.exports = nextConfig;
