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

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function generateRSS(options: RSSFeedOptions, items: RSSItem[]): string {
  const pubDate = (options.pubDate || new Date()).toUTCString();

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(options.title)}</title>
    <description>${escapeXml(options.description || '')}</description>
    <link>${escapeXml(options.site_url || '')}</link>
    <language>${options.language || 'zh-CN'}</language>
    <ttl>${options.ttl || 60}</ttl>
    <pubDate>${pubDate}</pubDate>`;

  if (options.feed_url) {
    xml += `\n    <atom:link href="${escapeXml(options.feed_url)}" rel="self" type="application/rss+xml" xmlns:atom="http://www.w3.org/2005/Atom"/>`;
  }

  if (options.copyright) {
    xml += `\n    <copyright>${escapeXml(options.copyright)}</copyright>`;
  }

  if (options.image_url) {
    xml += `
    <image>
      <url>${escapeXml(options.image_url)}</url>
      <title>${escapeXml(options.title)}</title>
      <link>${escapeXml(options.site_url || '')}</link>
    </image>`;
  }

  for (const item of items) {
    xml += `\n    <item>
      <title>${escapeXml(item.title)}</title>
      <description>${escapeXml(item.description || '')}</description>
      <link>${escapeXml(item.url || '')}</link>
      <guid>${escapeXml(item.guid || item.url || '')}</guid>
      <pubDate>${item.date.toUTCString()}</pubDate>`;

    if (item.author) {
      xml += `\n      <author>${escapeXml(item.author)}</author>`;
    }

    if (item.categories && item.categories.length > 0) {
      for (const cat of item.categories) {
        xml += `\n      <category>${escapeXml(cat)}</category>`;
      }
    }

    if (item.enclosure) {
      xml += `\n      <enclosure url="${escapeXml(item.enclosure.url)}" type="${item.enclosure.type || 'application/octet-stream'}"${item.enclosure.size ? ` length="${item.enclosure.size}"` : ''}/>`;
    }

    xml += `\n    </item>`;
  }

  xml += `\n  </channel>\n</rss>`;

  return xml;
}
