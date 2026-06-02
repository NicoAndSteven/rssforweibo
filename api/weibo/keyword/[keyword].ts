import type { VercelRequest, VercelResponse } from '@vercel/node';
import { fetchWeiboKeyword } from '../../../lib/weibo';
import { generateRSS, RSSItem } from '../../../lib/rss';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { keyword } = req.query;

  if (!keyword || typeof keyword !== 'string') {
    res.status(400).json({
      error: 'Missing keyword parameter',
      usage: '/weibo/keyword/:keyword',
      example: '/weibo/keyword/王一博',
    });
    return;
  }

  try {
    const decodedKeyword = decodeURIComponent(keyword);
    const posts = await fetchWeiboKeyword(decodedKeyword);

    if (posts.length === 0) {
      res.status(200).setHeader('Content-Type', 'application/xml');
      res.send(generateRSS(
        {
          title: `微博搜索: ${decodedKeyword}`,
          description: `微博关键词 "${decodedKeyword}" 的搜索结果`,
          site_url: 'https://weibo.com',
          language: 'zh-CN',
        },
        []
      ));
      return;
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
        description: `微博关键词 "${decodedKeyword}" 的搜索结果 - 由 RSSHub Vercel 提供`,
        site_url: 'https://weibo.com',
        language: 'zh-CN',
        ttl: 10,
      },
      items
    );

    res.status(200).setHeader('Content-Type', 'application/xml');
    res.send(rss);
  } catch (error) {
    console.error('Error in weibo keyword handler:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
