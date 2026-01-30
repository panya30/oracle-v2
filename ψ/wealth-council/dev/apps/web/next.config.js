/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@wealth-council/shared',
    '@wealth-council/mcp-argus',
    '@wealth-council/mcp-hermes',
    '@wealth-council/mcp-delphi',
    '@wealth-council/mcp-tyche',
    '@wealth-council/mcp-chronos',
  ],
}

module.exports = nextConfig
