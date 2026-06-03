interface Env {
  AUTH_CODE?: string;
  WEIBO_COOKIE?: string;
  REQUEST_TIMEOUT?: string;
  MAX_ITEMS?: string;
  USER_AGENT?: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
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

  return Response.json({
    name: 'RSSHub Cloudflare',
    version: '1.0.0',
    description: 'RSSHub deployed on Cloudflare Pages',
    routes,
    documentation: 'https://docs.rsshub.app',
  });
};
