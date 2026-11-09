---
name: update-bio-page
description: Use this whenever someone wants to add, schedule, change, or remove anything on the link-in-bio page (https://www.openhomefoundation.org/bio/, src/data/bio.yml) — a livestream, YouTube video, announcement, campaign, position paper, store link, or section link — even if they only say "put X on the bio page", "add the livestream to bio", "link in bio", or "show this from Friday until Sunday". Also use it to clean up old items ("tidy the bio page", "take the stream down"), and to explain why something is or isn't showing on the bio page.
---

# Update the link-in-bio page

The link-in-bio page at `/bio/` is what the Open Home Foundation's social profiles link to. Everything on it is set in one file: [src/data/bio.yml](../../../src/data/bio.yml). Read the comments at the top of that file before editing. They are the reference for every key, and this skill doesn't repeat them.

The people asking for changes are usually from marketing or community teams, not developers. Ask in plain language, and don't make them write YAML or work out UTC themselves.

## 1. Work out what they want

Find out:

- **What it is:** a link, a YouTube video or livestream, a blog post, or an announcement.
- **The title** as it should read on the page, and **the URL**.
- **The image**, if it's going in the Latest list. Every plain item there needs one, except YouTube items, which use the video's thumbnail. They can send a new file or point to one already on the site (see step 5).
- **When it should appear and disappear**, if it's time-limited, and in which time zone.
- **Where it goes**, if they have a view. Otherwise pick the place using step 3.

Whatever they asked for, also look for old items to clear out (see [Clear out old items](#clear-out-old-items)). Ask about those in the same message as your other questions. If they only asked for a cleanup, go straight to that section.

Don't add new blog posts or newsletter editions by hand. They appear in the Latest list by themselves once published, and older ones drop off as new ones arrive. If someone asks to add one of those, tell them it will appear on its own. Crossposts (blog posts that redirect to another site) are the exception: they don't appear by themselves, so add one by hand if it's wanted.

## 2. Check what you were given, and ask when it doesn't fit

Before you edit anything, compare the request with what the file needs. If something is missing, unclear, or doesn't match, ask the requester. Don't guess, and never make up a URL, title, date, time, or image. A wrong guess here goes live on a page linked from every social profile.

Ask when:

- **Something required is missing.** Every item needs a title and a URL. A plain item in the Latest list also needs an image and to know when it appears (`starts`). If they want it up now, that's today. A YouTube item needs the video link and when it airs.
- **A link isn't what's needed.** For example, it isn't a full `https://` URL. Or it's a YouTube channel, playlist, or studio link instead of a single video. Or the livestream doesn't have its own link yet. Ask for the video link. For a livestream, YouTube creates one as soon as the stream is scheduled.
- **A time is ambiguous.** No time zone, a relative day ("Friday", "next week"), a time without a date, 12-hour time without AM or PM, or a vague time ("evening", "after the stream"). Work out the date you think they mean and ask them to confirm it.
- **The times don't add up.** An `ends` before `starts`, an `ends` that has already passed, an upcoming livestream whose `airs` has already passed, or an `ends` before a livestream airs.
- **"When it airs" and "when it shows" are mixed up.** For a livestream, check whether the time they gave is when the stream starts (`airs`) or when the item should appear on the page (`starts`).
- **It might be under embargo.** If it sounds like an unannounced product or news, confirm it's public before you schedule it. If it isn't public yet, explain that it has to be merged at launch time (see step 4).
- **It's already there.** If the file already has an item with the same URL or title, or a blog post or newsletter edition already links there, ask whether to update that item or add another. A link shows only once in the Latest list: while a hand-added item is up, it shows instead of any blog post or newsletter edition with that link. The feed item comes back when the hand-added item ends.
- **They want to remove something that isn't there,** or that comes from a feed (blog, newsletter), which can't be deleted from `bio.yml`. Explain what they're seeing and ask what they want.
- **They want something held at the top.** The Latest list has no way to pin an item: it's newest first. Explain that, and suggest a `starts` that places it where they want it. If it has to stay at the top for longer, ask them, because a pin would be a code change.
- **Where it goes isn't clear,** and the table in step 3 fits more than one place.
- **The wording doesn't match the page,** such as all caps or a title much longer than the other items. Suggest a version and ask them to confirm it.
- **The file has old items in it.** List what you found and ask whether to remove them (see [Clear out old items](#clear-out-old-items)).

How to ask:

- Ask all your questions in one message, not one at a time.
- Use plain language. Don't ask about YAML keys. Ask "When should it disappear from the page?", not "What's the `ends` value?"
- Suggest an answer where there's a sensible default, so they can just say yes. For example: "Show it from 3 days before the stream? (I'd use Thursday, November 12)".
- Before you edit, repeat back all the times you'll use, in their time zone and in UTC, and wait for them to say yes. Do this even if they've just answered your questions, because a wrong time goes live with nobody watching. For example: "Shows from Thursday, November 12; airs Sunday, November 15 at 19:00 CET (18:00 UTC); comes down at the end of Monday, November 16 UTC. OK?"
- If they can't answer yet, such as when there's no stream link, stop. Tell them what you still need, and don't add a placeholder.

## 3. Choose where it goes

| They want… | Put it in |
| --- | --- |
| A livestream or YouTube video in the Latest list | `latest.items`, with `type: youtube` and `airs` |
| An announcement, paper, or other item in the Latest list | `latest.items`, with `starts` |
| A button that sits below the Latest list (a campaign) | `links` of the **Support us** section, or a new section if none fits |
| A permanent "who we are" link | `links` of the **New here?** section |
| A project or collaboration link | `links` of the **Our projects** section |

In the Latest list, an item's `starts` is when it appears, where it sits among the other items (newest first), and the date shown on it, just as a blog post's publish date is. So an item with a future `starts` comes in at the top of the list and takes the large card when that time comes. A YouTube item works the same way with `airs`, and always shows as a large card.

The line under an item's title shows its date, with `label` in front of it if there is one (`Event · November 20, 2026`). A `note` replaces that whole line with its own text, so use one only when the words matter more than the date.

## 4. Schedule it

Everything added by hand uses `starts` (when it appears) and `ends` (when it goes). The page checks the time with the website (not the visitor's own clock), so a scheduled item appears and disappears on time without anyone merging anything at that moment.

Scheduled items are in the page's source before they show, and their pictures are already online. Anyone who reads the source can see them early, so don't schedule anything under embargo, such as an unannounced product. Merge that at launch time instead, and say so to the requester.

- **`starts` in the Latest list is required.** A past date shows the item as soon as the change is live; a future one makes it wait. On section links `starts` is optional: without it, they show as soon as the change is live.
- **No `ends`:** it stays until someone deletes it. A YouTube item is the exception: it comes down at the end of the day after `airs`, unless `ends` says otherwise.
- **A date alone in `ends`** keeps the item up through that whole day (UTC). For a local-time event, check that this covers the end of the day where it's happening. An `ends` of exactly midnight UTC, however it's written, also counts as that whole day and stays up 24 hours longer. To go down at midnight UTC as November 15 begins, write `ends: 2026-11-14`.
- **Times are UTC** unless they carry an offset. Convert the requester's local time and write it as UTC with `Z`, or keep their local time with an offset (`2026-11-15T18:30:00+01:00`). Add a comment with the local time so a reviewer can check it:

  ```yaml
  starts: 2026-11-15T17:30:00Z  # 18:30 CET
  ```

- **Mind daylight saving time:** the offset depends on the date. For example, Central European Time is +01:00 in winter and +02:00 (CEST) from late March to late October. Check the offset for the actual day.

A livestream usually wants to show from a few days before it airs, so people see the "Starts November 15 · 18:00 UTC" note:

```yaml
  items:
    - type: youtube
      video: https://www.youtube.com/watch?v=VIDEO_ID
      title: "Title as it appears on YouTube"
      airs: 2026-11-15T18:00:00Z
      label: Livestream
      starts: 2026-11-12
```

A scheduled announcement in Latest, which comes in at the top on November 20:

```yaml
  items:
    - title: Community Day is this Saturday
      label: Event
      url: /community-day/
      image: /assets/images/community-day/community-day-og.webp
      starts: 2026-11-20T09:00:00Z
      ends: 2026-11-22
```

A time-limited campaign link:

```yaml
sections:
  - title: Support us
    links:
      - label: Black Friday at the merch store
        url: https://store.openhomefoundation.org/
        starts: 2026-11-27T08:00:00Z
        ends: 2026-11-30
```

There are no other date keys. If you use `date`, `start`, `expires`, or the like, the build stops and names the key to use instead.

## 5. Write it well

- Follow the wording of the items already in the file. Use sentence-style capitalization, except for names and the exact title of a YouTube video, paper, or blog post.
- `label` is a short word shown before the date, such as `Livestream`, `Announcement`, or `Event`.
- Images in Latest are full-size social images (1200 × 630), used at full width on the large card and cut down to a thumbnail on rows. Reuse an existing one if there is one, such as those in `public/assets/images/`. For a YouTube item, the video's thumbnail is used automatically.
- A new image goes in `public/assets/images/bio/`, with a short lowercase name and the date, such as `2026-11-black-friday.webp`, and `image: /assets/images/bio/2026-11-black-friday.webp` in the item. Save one image only, 1200 × 630 pixels, as WebP or JPEG, under about 200 KB. Don't make a separate small version: the build makes the thumbnails from this one. Prepare it from the repository root, so it fits the card and stays small:

  ```shell
  node -e "import('sharp').then(({default:s})=>s('PATH/TO/ORIGINAL').resize(1200,630,{fit:'cover'}).webp({quality:80}).toFile('public/assets/images/bio/NAME.webp'))"
  ```

  Then look at the result and check its size. Important text and faces need to stay away from the edges, because the thumbnail on a row crops tighter than the large card. If cropping cut off something important, or the original is under 1200 pixels wide, ask the requester for a better image. Anything in `public/` is online as soon as the change is merged, whatever the item's `starts` says, so this counts for the embargo check in step 2.
- Use site paths for links to this site (`/community-day/`) and full URLs (`https://…`) for everything else.

## 6. Check it

From the repository root:

```shell
npm test
npm run build
```

The build checks `bio.yml` and fails with the item at fault if anything is wrong, such as a bad date, a missing title, or an `ends` before its `starts`. Fix what it names. If the fix needs information you don't have, ask the requester (see step 2) rather than guessing.

Then confirm the item is in `dist/bio/index.html`. A scheduled item that hasn't started yet is there with a `hidden` attribute and its `data-starts` and `data-ends` times. That's expected: the page reveals it when the time comes.

## 7. Hand it over

Tell the requester, in plain language:

- What was added and where it will appear.
- When it appears and disappears, in their time zone as well as UTC.
- That it needs to be merged before `starts` (or, without a `starts`, that it goes live when merged).
- What you removed, and anything you left in because they wanted to keep it.

Don't commit, push, or open a pull request unless asked.

## Clear out old items

Items added by hand stay in `bio.yml` after they stop showing. They do no harm, but they make the file harder to read and easier to get wrong. Each time you edit the file, check for old items and offer to remove them.

### Find them

Check today's date and time in UTC first. Then look for:

- **Ended items:** anything whose `ends` has passed. These never show again.
- **Finished videos:** a YouTube item with no `ends` has come down by the end of the day after its `airs`.
- **Items pushed out of Latest for good:** an item in `latest.items` whose `starts` has passed but that isn't in the built page (`dist/bio/index.html`, after `npm run build`). Enough newer items are ahead of it to fill the list's `limit`, so it won't come back. The only exception is when something above it is scheduled to end.
- **Section links that look time-limited but have no `ends`:** such as a sale, an event, a survey, or a livestream. Ask whether they're still current.

Leave these alone: `latest.limit`, `latest.feeds`, the **New here?** and **Our projects** links, `socials`, and the commented-out examples in the file. Only change them if someone asks.

### Ask before you remove anything

Never delete an item without the requester's OK, even one that has clearly ended. Someone might want to reuse it, or it might be the record of what ran.

- List each item in plain language, with why you think it's old. For example: "'Community Day 2026' (an event on November 7) is no longer showing: it ended on November 8."
- Group them into "these have ended and no longer show" and "these are still showing, but might be out of date". Suggest removing the first group and ask about the second.
- If there's nothing old, don't mention it.

### Remove them

- Delete the whole block for each item they agreed to remove, including any comment lines that belong only to it.
- To take something down now, delete its block. To take it down later instead, give it an `ends`.
- If the item used an image in `public/assets/images/bio/`, delete that too, unless something else on the site uses it (search the repo for its file name first).
- Run the checks in step 6 again. The build should pass, and nothing that should still be showing should be missing from `dist/bio/index.html`.
