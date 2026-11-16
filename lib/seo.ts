import type { Metadata } from "next";
import type { BlogPost } from "./types";

export const ROOT_DOMAIN = (
  process.env.NEXT_PUBLIC_ROOT_URL || "https://wingpoll.co.ke"
).replace(/\/$/, "");

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || `${ROOT_DOMAIN}/en-ke`
).replace(/\/$/, "");

export const SITE_CONFIG = {
  name: "WingPoll",
  legalName: "WingPoll Microtask Platform",
  url: SITE_URL,
  description:
    "Complete simple digital microtasks in Kenya—data entry, image transcription, document formatting, and video extraction—and withdraw KSh earnings via M-Pesa.",
  defaultTitle: "WingPoll — Digital Microtask Earning Platform in Kenya",
  ogImage: `${SITE_URL}/hero-bg.jpg`,
  logo: `${SITE_URL}/WingPollLogo.png`,
  icon: `${SITE_URL}/icon.png`,
  email: "support@wingpoll.co.ke",
  locale: "en_KE",
  twitterHandle: "@wingpollke",
} as const;

interface BuildMetadataInput {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  image?: string;
  imageAlt?: string;
  noIndex?: boolean;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
  section?: string;
  tags?: string[];
}

export function buildCanonicalUrl(path: string): string {
  if (!path || path === "/") return SITE_URL;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${normalized.replace(/\/+$/, "")}`;
}

export function buildPageMetadata({
  title,
  description,
  path,
  keywords,
  image = SITE_CONFIG.ogImage,
  imageAlt = `${SITE_CONFIG.name} — Digital Microtask Platform`,
  noIndex = false,
  type = "website",
  publishedTime,
  modifiedTime,
  authors,
  section,
  tags,
}: BuildMetadataInput): Metadata {
  const canonicalUrl = buildCanonicalUrl(path);
  const absoluteImage = image.startsWith("http")
    ? image
    : `${SITE_URL}${image.startsWith("/") ? image : `/${image}`}`;

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
          nocache: true,
          googleBot: {
            index: false,
            follow: false,
            noimageindex: true,
          },
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
          },
        },
    openGraph: {
      type,
      locale: SITE_CONFIG.locale,
      url: canonicalUrl,
      siteName: SITE_CONFIG.name,
      title,
      description,
      images: [
        {
          url: absoluteImage,
          width: 1200,
          height: 630,
          alt: imageAlt,
        },
      ],
      ...(type === "article"
        ? {
            publishedTime,
            modifiedTime,
            authors,
            section,
            tags,
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [absoluteImage],
    },
  };
}

export function buildOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_CONFIG.name,
    legalName: SITE_CONFIG.legalName,
    url: SITE_URL,
    logo: SITE_CONFIG.logo,
    email: SITE_CONFIG.email,
    areaServed: {
      "@type": "Country",
      name: "Kenya",
    },
    contactPoint: {
      "@type": "ContactPoint",
      email: SITE_CONFIG.email,
      contactType: "customer support",
      areaServed: "KE",
      availableLanguage: ["English", "Swahili"],
    },
  };
}

export function buildWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_CONFIG.name,
    url: SITE_URL,
    description: SITE_CONFIG.description,
    inLanguage: "en-KE",
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/blogs?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function buildBreadcrumbSchema(
  items: { name: string; path: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      item: buildCanonicalUrl(item.path),
    })),
  };
}

export function buildBlogPostingSchema(post: BlogPost) {
  const url = buildCanonicalUrl(`/blogs/${post.slug}`);
  const imageUrl = post.featuredImage.startsWith("http")
    ? post.featuredImage
    : `${SITE_URL}${
        post.featuredImage.startsWith("/")
          ? post.featuredImage
          : `/${post.featuredImage}`
      }`;

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    headline: post.seoTitle || post.title,
    description: post.metaDescription || post.excerpt,
    image: [imageUrl],
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
    author: {
      "@type": "Person",
      name: post.author,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_CONFIG.name,
      logo: {
        "@type": "ImageObject",
        url: SITE_CONFIG.logo,
      },
    },
    articleSection: post.category,
    keywords: post.tags.join(", "),
    inLanguage: "en-KE",
    url,
  };
}

