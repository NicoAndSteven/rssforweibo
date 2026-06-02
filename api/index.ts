import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const routes = [
    {
      path: '/',
      description: 'RSSHub API - 首页',
    },
    {
      path: '/weibo/keyword/:keyword',
      description: '微博关键词搜索',
      example: '/weibo/keyword/王一博',
    },
  ];

  res.status(200).json({
    name: 'RSSHub Vercel',
    version: '1.0.0',
    description: 'RSSHub deployed on Vercel',
    routes,
    documentation: 'https://docs.rsshub.app',
  });
}
