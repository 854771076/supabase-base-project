import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: [
        '@ant-design/icons',
        '@ant-design/nextjs-registry',
        'rc-util',
        'rc-pagination',
        'rc-picker',
        'rc-tree',
        'rc-table',
    ],
    experimental: {
        optimizePackageImports: ['antd'],
    },
};

export default withNextIntl(nextConfig);
