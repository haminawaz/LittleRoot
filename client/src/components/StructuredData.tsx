import { useEffect } from 'react';

interface OrganizationSchema {
  '@context': 'https://schema.org';
  '@type': 'Organization';
  name: string;
  url: string;
  logo: string;
  description?: string;
  sameAs?: string[];
  contactPoint?: {
    '@type': 'ContactPoint';
    contactType: string;
    email?: string;
  };
}

interface WebSiteSchema {
  '@context': 'https://schema.org';
  '@type': 'WebSite';
  name: string;
  url: string;
  description?: string;
  potentialAction?: {
    '@type': 'SearchAction';
    target: string;
    'query-input': string;
  };
}

type SchemaType = OrganizationSchema | WebSiteSchema | Record<string, any>;

interface StructuredDataProps {
  data: SchemaType;
}

export function StructuredData({ data }: StructuredDataProps) {
  useEffect(() => {
    const scriptId = 'structured-data-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement;
    
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    
    script.textContent = JSON.stringify(data);
    
    return () => {
      const existingScript = document.getElementById(scriptId);
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [data]);
  
  return null;
}

export const organizationSchema: OrganizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'LittleRoot Studios',
  url: 'https://littlerootstudios.com',
  logo: 'https://littlerootstudios.com/logo.svg',
  description: 'Hand-chosen, framed artworks that are ready to bring joy to your wall. Discover affordable original art from talented artists.',
  sameAs: [
    // Add social media URLs when available
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'Customer Support',
  },
};

export const websiteSchema: WebSiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'LittleRoot Studios',
  url: 'https://littlerootstudios.com',
  description: 'Original Art You Can Afford To Love',
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://littlerootstudios.com/search?q={search_term_string}',
    'query-input': 'required name=search_term_string',
  },
};
