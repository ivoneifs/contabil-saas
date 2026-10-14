/** @type {import('next').NextConfig} */
const nextConfig = {
  // Vídeos: "private" impede o cache da Cloudflare, que responde 200 (arquivo
  // inteiro) a pedidos com Range; o iPhone exige 206 para tocar e pular trechos.
  async headers() {
    return [{ source: '/videos/:path*', headers: [{ key: 'Cache-Control', value: 'private, max-age=3600' }] }];
  },
};

export default nextConfig;
