const path = require("path");

const nextConfig = {
  output: "standalone",
  async rewrites() {
    // 개발 환경에서만 로컬 서버로 프록시. 배포는 절대 URL(NEXT_PUBLIC_API_URL) 사용
    if (process.env.NODE_ENV !== "production") {
      return [
        {
          source: "/api/:path*",
          destination: "http://localhost:3001/api/:path*",
        },
      ];
    }
    return [];
  },
  webpack: (config) => {
    // Ensure '@' resolves to the project root (apps/client)
    config.resolve.alias["@"] = path.resolve(__dirname);
    return config;
  },
};

module.exports = nextConfig;
