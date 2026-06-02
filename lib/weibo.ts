import axios from 'axios';
import * as cheerio from 'cheerio';
import { config } from './config';

export interface WeiboPost {
  id: string;
  text: string;
  author: string;
  authorAvatar?: string;
  createdAt: Date;
  images?: string[];
  url: string;
}

const WEIBO_MOBILE_SEARCH_URL = 'https://m.weibo.cn/search';

export async function fetchWeiboKeyword(keyword: string): Promise<WeiboPost[]> {
  try {
    const encodedKeyword = encodeURIComponent(keyword);
    const headers: Record<string, string> = {
      'User-Agent': config.userAgent,
      'Referer': 'https://m.weibo.cn/',
      'Accept': 'application/json, text/plain, */*',
    };
    
    if (config.weiboCookie) {
      headers['Cookie'] = config.weiboCookie;
    }
    
    const response = await axios.get(
      `${WEIBO_MOBILE_SEARCH_URL}?containerid=100103type%3D1%26q%3D${encodedKeyword}`,
      {
        headers,
        timeout: config.requestTimeout,
      }
    );

    const data = response.data;
    const posts: WeiboPost[] = [];

    if (data?.data?.cards) {
      for (const card of data.data.cards) {
        if (card.card_type === 9 && card.mblog) {
          const mblog = card.mblog;
          const post: WeiboPost = {
            id: mblog.id || mblog.mid,
            text: cleanText(mblog.text || ''),
            author: mblog.user?.screen_name || '未知用户',
            authorAvatar: mblog.user?.profile_image_url,
            createdAt: parseWeiboTime(mblog.created_at),
            url: `https://m.weibo.cn/detail/${mblog.id || mblog.mid}`,
            images: extractImages(mblog),
          };
          posts.push(post);
          
          if (posts.length >= config.maxItems) {
            break;
          }
        }
      }
    }

    return posts;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Weibo API Error:', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
      });
    } else {
      console.error('Error fetching weibo keyword:', error);
    }
    return [];
  }
}

function cleanText(html: string): string {
  const $ = cheerio.load(html);
  return $.text(html).trim();
}

function parseWeiboTime(timeStr: string): Date {
  if (!timeStr) return new Date();
  
  const now = new Date();
  
  if (timeStr.includes('刚刚')) {
    return now;
  }
  
  const minuteMatch = timeStr.match(/(\d+)分钟前/);
  if (minuteMatch) {
    return new Date(now.getTime() - parseInt(minuteMatch[1]) * 60 * 1000);
  }
  
  const hourMatch = timeStr.match(/(\d+)小时前/);
  if (hourMatch) {
    return new Date(now.getTime() - parseInt(hourMatch[1]) * 60 * 60 * 1000);
  }
  
  const todayMatch = timeStr.match(/今天\s*(\d{2}):(\d{2})/);
  if (todayMatch) {
    const date = new Date(now);
    date.setHours(parseInt(todayMatch[1]), parseInt(todayMatch[2]), 0, 0);
    return date;
  }
  
  const dateMatch = timeStr.match(/(\d{1,2})月(\d{1,2})日\s*(\d{2}):(\d{2})/);
  if (dateMatch) {
    const month = parseInt(dateMatch[1]) - 1;
    const day = parseInt(dateMatch[2]);
    const hour = parseInt(dateMatch[3]);
    const minute = parseInt(dateMatch[4]);
    const date = new Date(now.getFullYear(), month, day, hour, minute);
    if (date > now) {
      date.setFullYear(date.getFullYear() - 1);
    }
    return date;
  }
  
  return new Date(timeStr);
}

function extractImages(mblog: any): string[] {
  const images: string[] = [];
  
  if (mblog.pics && Array.isArray(mblog.pics)) {
    for (const pic of mblog.pics) {
      if (pic.url) {
        images.push(pic.url.replace(/\/thumbnail\//, '/large/'));
      }
    }
  }
  
  return images;
}
