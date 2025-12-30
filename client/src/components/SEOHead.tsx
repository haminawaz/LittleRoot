import { useEffect } from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogUrl?: string;
  ogType?: 'website' | 'article' | 'product';
}

export function SEOHead({
  title = 'LittleRoot Studios',
  description = 'Hand-chosen, framed artworks that are ready to bring joy to your wall. Discover affordable original art from talented artists at LittleRoot Studios - your trusted art collective.',
  keywords = 'original art, affordable art, framed artwork, art collective, wall art, home decor, contemporary art, LittleRoot Studios, buy art online, art gallery',
  ogImage = 'https://littlerootstudios.com/og-image.png',
  ogUrl = window.location.href,
  ogType = 'website',
}: SEOHeadProps) {
  useEffect(() => {
    document.title = title;
    const updateMetaTag = (selector: string, content: string) => {
      let element = document.querySelector(selector);
      if (!element) {
        element = document.createElement('meta');
        const attribute = selector.includes('property=') ? 'property' : 'name';
        const value = selector.match(/["']([^"']+)["']/)?.[1];
        if (value) {
          element.setAttribute(attribute, value);
          document.head.appendChild(element);
        }
      }
      element.setAttribute('content', content);
    };
    updateMetaTag('meta[name="description"]', description);
    updateMetaTag('meta[name="keywords"]', keywords);
    updateMetaTag('meta[property="og:title"]', title);
    updateMetaTag('meta[property="og:description"]', description);
    updateMetaTag('meta[property="og:image"]', ogImage);
    updateMetaTag('meta[property="og:url"]', ogUrl);
    updateMetaTag('meta[property="og:type"]', ogType);
    updateMetaTag('meta[name="twitter:title"]', title);
    updateMetaTag('meta[name="twitter:description"]', description);
    updateMetaTag('meta[name="twitter:image"]', ogImage);
    updateMetaTag('meta[name="twitter:url"]', ogUrl);
  }, [title, description, keywords, ogImage, ogUrl, ogType]);

  return null;
}
