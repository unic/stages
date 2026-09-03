const nextConfig = {
    output: 'export',
    images: { unoptimized: true },
    turbopack: { root: require('node:path').resolve(__dirname, '..') }
};
   
module.exports = nextConfig;
