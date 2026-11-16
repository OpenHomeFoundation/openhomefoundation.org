---
title: "Community Survey 2024"
summary: "Our first survey of the Home Assistant community: 8,616 people told us how they set up and live with their smart homes. The anonymized results, questions and analysis scripts are all openly available."
standfirst: "Who actually lives in a smart home? We asked the Home Assistant community, and 8,616 people answered. Here's what we learned, and everything you need to explore the data yourself."
status: completed
period: "2024–2026"
date: 2026-08-26
team: [annika-schulz, idil-bostan]
facts:
  - { label: "Responses", value: "8,616" }
  - { label: "Method", value: "Online survey, about seven weeks" }
  - { label: "Open data", value: "DOI 10.5281/zenodo.21825688" }
primaryDataset: cs24-dataset
statsLink:
  label: "Explore descriptive statistics for every question"
  url: "https://github.com/OpenHomeFoundation/user-research/blob/main/community-survey24/descriptive-statistics.md"
# Not rendered in V1 ("What it changed" was removed on 9 Nov). Kept for a later version.
impacts:
  - badge: "Home Assistant"
    title: "Redesigning \"areas\""
    text: "Floors, home size and ownership informed design changes to how areas work."
  - badge: "Hardware"
    title: "Home Assistant Connect ZBT-2"
    text: "Insights shared with Nabu Casa helped fit the device to the real living conditions of our community."
  - badge: "Advocacy"
    title: "Privacy position paper"
    text: "Helped shape our privacy research and organizational positions."
    link: { label: "Read the paper", url: "https://www.openhomefoundation.org/papers/privacy/" }
  - badge: "UX design"
    title: "Home Assistant for the whole household"
    text: "Ongoing design work for everyone who lives in the home, not just the person who set it up."
    link: { label: "Join the discussion", url: "https://github.com/OpenHomeFoundation/ux-design/discussions/40" }
method:
  facts:
    - { label: "Fieldwork", value: "Dec 2024 – Feb 2025" }
    - { label: "Platform", value: "Online (Typeform)" }
    - { label: "Language", value: "English only" }
    - { label: "Removed for privacy", value: "About 12% of responses" }
  limitations: "The survey ran long (over 40 minutes on average, against about 20 in testing) and was English-only, so respondents represent a committed core of Home Assistant users rather than everyone. Responses from people who dropped out aren't captured. We're addressing length and language in the next survey."
citation:
  apa: "Schulz, A., & Bostan, I. (2026). Home Assistant Community Survey 2024 [Data set]. Open Home Foundation. https://doi.org/10.5281/zenodo.21825688"
  bibtex: |
    @dataset{schulz_bostan_2026_ha_survey,
      author    = {Schulz, Annika and Bostan, Idil},
      title     = {Home Assistant Community Survey 2024},
      year      = {2026},
      publisher = {Zenodo},
      doi       = {10.5281/zenodo.21825688},
      url       = {https://doi.org/10.5281/zenodo.21825688}
    }
related: []
---

Our goal was simple: to make Home Assistant more inclusive and approachable by
listening directly to the people who use it. The survey asked how people got
started, how they set up their homes, who they live with, and what privacy,
choice and sustainability mean to them.

After a strict anonymization process, we published the results as an open
dataset on Zenodo, so anyone can check our conclusions or build on them, along
with the full question list, methodology and analysis scripts.
