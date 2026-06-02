import RSS from 'rss';

export interface RSSItem {
  title: string;
  description?: string;
  url?: string;
  guid?: string;
  categories?: string[];
  author?: string;
  date: Date;
  enclosure?: {
    url: string;
    type?: string;
    size?: number;
  };
}

export interface RSSFeedOptions {
  title: string;
  description?: string;
  feed_url?: string;
  site_url?: string;
  image_url?: string;
  language?: string;
  ttl?: number;
  copyright?: string;
  pubDate?: Date;
}

export function generateRSS(options: RSSFeedOptions, items: RSSItem[]): string {
  const feed = new RSS({
    title: options.title,
    description: options.description || '',
    feed_url: options.feed_url || '',
    site_url: options.site_url || '',
    image_url: options.image_url,
    language: options.language || 'zh-CN',
    ttl: options.ttl || 60,
    copyright: options.copyright,
    pubDate: options.pubDate || new Date(),
  });

  for (const item of items) {
    feed.item({
      title: item.title,
      description: item.description || '',
      url: item.url || '',
      guid: item.guid,
      categories: item.categories,
      author: item.author,
      date: item.date,
      enclosure: item.enclosure,
    });
  }

  return feed.xml({ indent: true });
}
