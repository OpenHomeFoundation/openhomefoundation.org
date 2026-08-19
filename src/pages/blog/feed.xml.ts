import type { APIRoute } from "astro";
import { authorDisplay, getSortedPosts, postUrl } from "../../lib/blog";
import { SITE_URL } from "../../lib/site";

const escapeXml = (text: string) =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const isoDate = (date: Date) => date.toISOString().replace(/\.\d{3}Z$/, "Z");

export const GET: APIRoute = async () => {
  const posts = await getSortedPosts();

  const entries = posts
    .map((post) => {
      const url = `${SITE_URL}${postUrl(post)}`;
      const author = authorDisplay(post);
      return `
  <entry>
    <title>${escapeXml(post.data.title)}</title>
    <link href="${url}"/>
    <updated>${isoDate(post.data.date)}</updated>
    <id>${url}</id>${
      author
        ? `
    <author><name>${escapeXml(author)}</name></author>`
        : ""
    }${
      post.data.description
        ? `
    <summary>${escapeXml(post.data.description)}</summary>`
        : ""
    }
    <content type="html"><![CDATA[${post.rendered?.html ?? ""}]]></content>
  </entry>`;
    })
    .join("");

  const feed = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Open Home Foundation Blog</title>
  <subtitle>News and updates from the Open Home Foundation</subtitle>
  <link href="${SITE_URL}/blog/feed.xml" rel="self"/>
  <link href="${SITE_URL}/blog/"/>
  <updated>${isoDate(posts[0].data.date)}</updated>
  <id>${SITE_URL}/blog/</id>${entries}
</feed>
`;

  return new Response(feed, {
    headers: { "Content-Type": "application/atom+xml; charset=utf-8" },
  });
};
