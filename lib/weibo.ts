import { Config } from './config';

export interface WeiboPost {
  id: string;
  text: string;
  author: string;
  authorAvatar?: string;
  createdAt: Date;
  images?: string[];
  url: string;
}

const WEIBO_SEARCH_URL = 'https://weibo.com/ajax/statuses/search';
const VISITOR_GEN_URL = 'https://passport.weibo.com/visitor/genvisitor';
const VISITOR_INCARNATE_URL = 'https://passport.weibo.com/visitor/visitor';

let visitorCookie = '';
let visitorCookieExpires = 0;

async function getVisitorCookie(): Promise<string> {
  if (visitorCookie && Date.now() < visitorCookieExpires) {
    return visitorCookie;
  }

  const tidResp = await fetch(VISITOR_GEN_URL, {
    method: 'POST',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'cb=gen_callback&fp=%7B%7D',
  });

  const tidText = await tidResp.text();
  const tidMatch = tidText.match(/"tid":"([^"]+)"/);
  if (!tidMatch) {
    throw new Error('Failed to get visitor tid');
  }
  const tid = tidMatch[1];

  const incResp = await fetch(
    `${VISITOR_INCARNATE_URL}?a=incarnate&t=${tid}&w=2&c=095&gc=&cb=cross_domain&from=weibo`,
    {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      redirect: 'manual',
    }
  );

  const incText = await incResp.text();
  const subMatch = incText.match(/"sub":"([^"]+)"/);
  const subpMatch = incText.match(/"subp":"([^"]+)"/);

  if (!subMatch || !subpMatch) {
    throw new Error('Failed to get visitor cookies');
  }

  visitorCookie = `SUB=${subMatch[1]}; SUBP=${subpMatch[1]}`;
  visitorCookieExpires = Date.now() + 3 * 60 * 60 * 1000;
  return visitorCookie;
}

export async function fetchWeiboKeyword(keyword: string, cfg: Config): Promise<WeiboPost[]> {
  try {
    const cookie = cfg.weiboCookie || await getVisitorCookie();

    const headers: Record<string, string> = {
      'User-Agent': cfg.userAgent,
      'Referer': 'https://weibo.com/',
      'Accept': 'application/json, text/plain, */*',
      'Cookie': cookie,
    };

    const response = await fetch(
      `${WEIBO_SEARCH_URL}?q=${encodeURIComponent(keyword)}&page=1`,
      {
        headers,
        signal: AbortSignal.timeout(cfg.requestTimeout),
      }
    );

    if (!response.ok) {
      console.error('Weibo API Error:', {
        status: response.status,
        statusText: response.statusText,
      });
      return [];
    }

    const data: any = await response.json();
    const posts: WeiboPost[] = [];

    if (data?.statuses) {
      for (const status of data.statuses) {
        const post: WeiboPost = {
          id: status.idstr || String(status.id),
          text: cleanText(status.text_raw || status.text || ''),
          author: status.user?.screen_name || '未知用户',
          authorAvatar: status.user?.profile_image_url,
          createdAt: new Date(status.created_at),
          url: `https://weibo.com/${status.user?.id || ''}/${status.mblogid || status.id}`,
          images: extractImages(status),
        };
        posts.push(post);

        if (posts.length >= cfg.maxItems) {
          break;
        }
      }
    }

    return posts;
  } catch (error) {
    console.error('Error fetching weibo keyword:', error);
    return [];
  }
}

function cleanText(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

function extractImages(status: any): string[] {
  const images: string[] = [];

  if (status.pic_ids && Array.isArray(status.pic_ids)) {
    for (const picId of status.pic_ids) {
      if (picId) {
        images.push(`https://wx1.sinaimg.cn/large/${picId}.jpg`);
      }
    }
  }

  return images;
}
