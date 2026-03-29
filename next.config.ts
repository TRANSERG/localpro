import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // sharp native binaries must be loaded via Node.js require(), not bundled.
  // Turbopack on Windows has a junction point bug with sharp, so dev uses
  // --webpack (see package.json). Can remove flag when Turbopack fixes this.
  serverExternalPackages: ['sharp'],
};

export default nextConfig;
