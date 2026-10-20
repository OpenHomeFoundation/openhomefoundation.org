// schema.org JSON-LD for Google rich results, passed to Base via `jsonLd`.
import { ogImage, postUrl, AUTHORS, type Post } from "./blog";
import { SITE_URL, SITE_NAME, DEFAULT_DESCRIPTION, MASTODON_PROFILE_URL } from "./site";

const ORGANIZATION_ID = `${SITE_URL}/#organization`;
const WEBSITE_ID = `${SITE_URL}/#website`;
const LOGO_URL = `${SITE_URL}/assets/images/logo/open-home-foundation-square.png`;

// Posts reference the organization by id, but repeat the essentials since the
// full node is only on the home page.
const publisher = { "@type": "Organization", "@id": ORGANIZATION_ID, name: SITE_NAME, logo: LOGO_URL };

const absolute = (url: string) => (url.includes("://") ? url : `${SITE_URL}${url}`);

export function organization() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: SITE_NAME,
    url: `${SITE_URL}/`,
    logo: LOGO_URL,
    description: DEFAULT_DESCRIPTION,
    email: "hello@openhomefoundation.org",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Grabenstrasse 25",
      postalCode: "6340",
      addressLocality: "Baar",
      addressCountry: "CH",
    },
    sameAs: [
      "https://github.com/openhomefoundation",
      MASTODON_PROFILE_URL,
      "https://bsky.app/profile/openhomefoundation.org",
    ],
  };
}

export function website() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: SITE_NAME,
    url: `${SITE_URL}/`,
    publisher: { "@id": ORGANIZATION_ID },
  };
}

export function blogPosting(post: Post) {
  const { title, description, date, author } = post.data;
  const url = `${SITE_URL}${postUrl(post)}`;
  const authors = (author ?? []).map((slug) => {
    const a = AUTHORS[slug];
    return {
      "@type": "Person",
      name: a?.name ?? slug,
      ...(a?.github ? { url: `https://github.com/${a.github}` } : {}),
    };
  });

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    ...(description ? { description } : {}),
    datePublished: date.toISOString(),
    image: absolute(ogImage(post)),
    url,
    mainEntityOfPage: url,
    author: authors.length > 0 ? authors : publisher,
    publisher,
    isPartOf: { "@id": WEBSITE_ID },
  };
}
