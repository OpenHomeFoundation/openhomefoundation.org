---
layout: post
title: "Making our web analytics open source with Plausible"
description: "Find out how and why we’re implementing analytics on our websites: via open source software with no personal data collection or tracking."
card_image: /assets/images/blog/making-our-web-analytics-open-source-with-plausible/card.webp
og_image: /assets/images/blog/making-our-web-analytics-open-source-with-plausible/card.webp
hide_header_image: true
date: 2026-07-29
author: [darren-griffin]
category: "Announcements"
---

The Open Home Foundation fights for privacy, choice, and sustainability. These principles are at the heart of everything we do, including how we handle website analytics.

Our position is clear: we reject tools that track individuals across the web to monetize their data. Instead, we want aggregated, anonymized analytics to show us how our websites are performing overall. This gives us the insights we need to effectively maintain the foundation’s websites without identifying who our visitors are, or compromising their privacy.

In this article we’ll explain how we plan to do this with Plausible analytics: open source software where you can see exactly what we see on a public dashboard and block altogether if you wish.

**Please note: the following information only applies to Open Home Foundation websites, *not* Home Assistant software, your local instance, or any data from your home.**

<!--more-->

## Aggregated, anonymized analytics

Plausible shows us aggregate totals of website activity, not individual behavior or personal information. Here’s what that looks like, with links to the relevant information in Plausible:

| What is tracked | What is not tracked |
| :---- | :---- |
| <a href="https://plausible.io/docs/metrics-definitions#unique-visitors" target="_blank" rel="noopener noreferrer">Which pages get visited and how often</a> | <a href="https://plausible.io/when-not-to-use-plausible#plausible-is-not-for-tracking-individual-users" target="_blank" rel="noopener noreferrer">Individual visitor profiles or identities</a> |
| <a href="https://plausible.io/docs/countries#how-location-reporting-works" target="_blank" rel="noopener noreferrer">Approximate geography (country/region level)</a> | <a href="https://plausible.io/data-policy" target="_blank" rel="noopener noreferrer">Cross-session or cross-day visit history</a> |
| <a href="https://plausible.io/docs/top-referrers#sources" target="_blank" rel="noopener noreferrer">Referral sources (where visits come from)</a> | <a href="https://plausible.io/when-not-to-use-plausible#plausible-is-not-a-session-replay-or-heatmap-tool" target="_blank" rel="noopener noreferrer">Session replays or heat maps</a> |
| <a href="https://plausible.io/docs/metrics-definitions#engagement" target="_blank" rel="noopener noreferrer">Basic engagement metrics (time on page, scroll depth)</a> | <a href="https://plausible.io/privacy" target="_blank" rel="noopener noreferrer">Data sold or shared with third parties</a> |
| <a href="https://plausible.io/docs/custom-event-goals" target="_blank" rel="noopener noreferrer">Custom events like button clicks (downloads, sign-ups)</a> | <a href="https://plausible.io/security#personal-data" target="_blank" rel="noopener noreferrer">IP addresses (used briefly for geolocation, then deleted not stored)</a> |
| <a href="https://plausible.io/data-policy" target="_blank" rel="noopener noreferrer">Browser name and version, operating system name and version, and device category (desktop/mobile/tablet)</a> | <a href="https://plausible.io/data-policy" target="_blank" rel="noopener noreferrer">Fingerprinting signals such as screen resolution, fonts, or timezone collected from your browser</a> |

## Giving you control

Our Plausible dashboard is public, so you can see exactly the same information as us – and we’ll provide the link at the bottom of every Open Home Foundation website using Plausible so everyone can access it. As part of our broader effort to align our websites with our principles, we’re also making sure any affiliate links and other tracking elements are removed.

The system doesn’t create persistent identifiers*, any other cross-site or cross-device tracking, or use cookies – which means no consent banners cluttering up your screen, and no way to recognize users across visits. However it also means that if you prefer not to be part of the aggregated statistics, you’ll need to block Plausible using your ad blocker rather than clicking a preference box. Many ad blockers already filter it automatically. If yours doesn’t, here’s how to add it:

```
||plausible.openhomefoundation.org/js/pa-*
```

If your ad blocker is blocking Plausible by default and you want to make an exception for our websites, you can use the following filter to enable it just for us:

```
@@||plausible.openhomefoundation.org/js/pa-*
```

*Plausible counts unique visitors using a <a href="https://plausible.io/security#personal-data" target="_blank" rel="noopener noreferrer">24-hour session hash</a>.

## How we’re using Plausible

We’ve chosen Plausible because its philosophy aligns with our own privacy principles, and we’re taking extra steps to customize it further. We’re hosting it on infrastructure we maintain in-house, which means we have full control over the anonymous, aggregated data and how it’s handled. We’ve turned off journey tracking features, and while <a href="https://plausible.io/docs/countries#how-location-reporting-works" target="_blank" rel="noopener noreferrer">Plausible uses IP addresses for</a> geolocation, they are discarded and never stored.

Most analytics services collect personal data that privacy regulations – such as GDPR in Europe – require them to delete, typically after one to two years depending on jurisdiction. But since Plausible only provides fully anonymized data with no personally identifiable information, we can keep it indefinitely. This way we (and anyone viewing our public dashboard) can see how things change over time, and spot long-term trends that suggest what’s working and what needs improvement.

## Why we need analytics

The Open Home Foundation is a non-profit responsible for fulfilling our mission: fighting for privacy, choice, and sustainability in smart homes. A key part of this is advocacy – making sure as many people as possible know about our work and the alternatives we’re building to Big Tech control. This means running multiple project and organizational websites, managing partnerships that fund our work, and allocating limited resources effectively.

As we’ve grown, we’ve reached a point where we have so many website visitors it’s impossible to ask them all basic operational questions about the websites we run, such as which browser versions to prioritize testing, whether our getting started guides are being found, or how to allocate maintenance effort across projects.

Without this information, we risk wasting resources on the wrong priorities.

Analytics helps us with:

- Technical optimization (browser compatibility, performance, maintenance)
- Resource allocation across projects
- Commercial sustainability (our store and links to our licensed products that help fund the foundation)
- Infrastructure and cost management

All these things inform our technical decisions, help us prioritize where to invest funds, and ensure we’re using our resources where they have the most impact.

For example: a key goal for 2026 is to make our projects more approachable for everyone – from experienced users to those just starting out. Using analytics will show us if beginners are finding our simplified guides or still getting lost in advanced documentation.

## What we’ve been doing

Until now, the only data for our websites we could view was basic server-side usage information like page visit counts. This doesn’t sit well with us, since our users can’t see that data, or opt out of it unless they stop using our sites altogether! Which is why we’re moving to Plausible.

## What happens next…

We’re implementing Plausible over the next few months. You’ll see the dashboard link appear at the bottom of pages as it goes live.

We’ve taken care to align this work with our values, but we want to hear from you: if something concerns you or you have suggestions for how we could do this better, let us know.
