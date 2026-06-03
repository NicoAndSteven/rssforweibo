import { createConfig, validateAuth, createAuthError } from '../../../lib/config';
import { fetchWeiboKeyword } from '../../../lib/weibo';
import { generateRSS, RSSItem } from '../../../lib/rss';

interface Env {
  AUTH_CODE?: string;
  WEIBO_COOKIE?: string;
  REQUEST_TIMEOUT?: string;
  MAX_ITEMS?: string;
  USER_AGENT?: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const cfg = createConfig(context.env as unknown as Record<string, string | undefined>);
  const url = new URL(context.request.url);
  const authHeader = context.request.headers.get('Authorization') || undefined;
  const queryCode = url.searchParams.get('code') || undefined;

  if (!validateAuth(authHeader || queryCode, cfg)) {
    return Response.json(createAuthError(), { status: 401 });
  }

  const keyword = context.params.keyword as string;

  if (!keyword) {
    return Response.json({
      error: 'Missing keyword parameter',
      usage: '/weibo/keyword/:keyword',
      example: '/weibo/keyword/王一博',
    }, { status: 400 });
  }

  try {
    const decodedKeyword = decodeURIComponent(keyword);
    const posts = await fetchWeiboKeyword(decodedKeyword, cfg);

    if (posts.length === 0) {
      const rss = generateRSS(
        {
          title: `微博搜索: ${decodedKeyword}`,
          description: `微博关键词 "${decodedKeyword}" 的搜索结果`,
          site_url: 'https://weibo.com',
          language: 'zh-CN',
        },
        []
      );

      return new Response(rss, {
        headers: { 'Content-Type': 'application/xml' },
      });
    }

    const items: RSSItem[] = posts.map((post) => {
      let description = post.text;
      if (post.images && post.images.length > 0) {
        description += '<br><br>';
        for (const img of post.images) {
          description += `<img src="${img}" referrerpolicy="no-referrer"><br>`;
        }
      }

      return {
        title: `${post.author}: ${post.text.slice(0, 50)}${post.text.length > 50 ? '...' : ''}`,
        description,
        url: post.url,
        guid: post.id,
        author: post.author,
        date: post.createdAt,
      };
    });

    const rss = generateRSS(
      {
        title: `微博搜索: ${decodedKeyword}`,
        description: `微博关键词 "${decodedKeyword}" 的搜索结果 - 由 RSSHub Cloudflare 提供`,
        site_url: 'https://weibo.com',
        language: 'zh-CN',
        ttl: 10,
      },
      items
    );

    return new Response(rss, {
      headers: { 'Content-Type': 'application/xml' },
    });
  } catch (error) {
    console.error('Error in weibo keyword handler:', error);
    return Response.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
};
