// Thumbnails for the rows in the bio page's "Latest" list (see src/lib/bio.ts).
import type { APIRoute, GetStaticPaths } from "astro";
import { bioLatest } from "../../../lib/bio";

export const getStaticPaths: GetStaticPaths = async () =>
  (await bioLatest())
    .filter((item) => item.thumb)
    .map(({ thumb }) => ({
      params: { id: thumb!.path.split("/").pop()!.replace(/\.webp$/, "") },
      props: { data: thumb!.data },
    }));

export const GET: APIRoute = ({ props }) =>
  new Response(props.data, { headers: { "Content-Type": "image/webp" } });
