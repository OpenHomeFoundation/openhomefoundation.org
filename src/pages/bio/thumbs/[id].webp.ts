// Thumbnails for the rows in the bio page's "Latest" list (see src/lib/bio.ts).
import type { APIRoute, GetStaticPaths } from "astro";
import { bioPage } from "../../../lib/bio";

export const getStaticPaths: GetStaticPaths = async () => {
  const { latest } = await bioPage();
  const thumbs = new Map(latest.entries.filter((entry) => entry.thumb).map(({ thumb }) => [thumb.path, thumb.data]));
  return [...thumbs].map(([path, data]) => ({
    params: { id: path.split("/").pop()!.replace(/\.webp$/, "") },
    props: { data },
  }));
};

export const GET: APIRoute = ({ props }) =>
  new Response(props.data, { headers: { "Content-Type": "image/webp" } });
