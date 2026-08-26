---
title: "Anonymous and open to all: The Home Assistant survey dataset"
description: "We surveyed 8,616 Home Assistant users about their smart homes – see the anonymized results, what we learned, and how you can explore the data yourself."
hide_header_image: true
date: 2026-08-26
author: [annika-schulz, idil-bostan]
category: "Research"
comments: true
---

Our *why* as an organization is clear: to fight for privacy, choice, and sustainability for smart homes, and for every person who lives in one. But who *does* live in them?

In December 2024, we <a href="https://www.home-assistant.io/blog/2024/12/16/community-survey-2024/" target="_blank" rel="noopener noreferrer">launched the first Home Assistant survey</a> to find out. Our goal was simple: to make Home Assistant more inclusive and approachable by listening directly to the diverse community of people who use it.

In the spirit of building in the open, today we’re thrilled to announce the anonymized results of that survey are now freely available. In this post, we’ll run you through what the survey covered, why and how we’re publishing this data, what the data is not (read: identifiable), how we’re using this information to improve what we do, and opportunities for further understanding and research.

**TL;DR**

* We ran our first Home Assistant community survey in December 2024, gathering 8,616 responses on how people set up and live with their smart homes.
* We have now published the anonymized results on Zenodo, after a strict anonymization process – including k-anonymity review, GDPR compliance, and cutting 12% of responses as a precaution.
* This data is already shaping our work, from redesigning “areas” in Home Assistant to tailoring the Home Assistant Connect ZBT-2 and informing our privacy research.
* The survey had limitations (it ran too long, and was English-only), which we’re addressing in future research.
* Explore the data yourself on <a href="https://zenodo.org/records/21825688" target="_blank" rel="noopener noreferrer">Zenodo</a>, or the full set of research questions and methodology on our <a href="https://github.com/OpenHomeFoundation/user-research/tree/main/community-survey24" target="_blank" rel="noopener noreferrer">GitHub page</a>.

<p><a href="https://zenodo.org/records/21825688" target="_blank" rel="noopener noreferrer" class="button">Explore the data on Zenodo</a></p>

<!--more-->

## A snapshot of the survey

To give a little context, the survey ran for about seven weeks, closing in early February 2025, and gathered 8,616 submissions – offering meaningful insights into Home Assistant users and the day-to-day realities of running the platform. Most respondents said an interest in technology drove them to create a smart home, often prompted by moving into a new house, or a renovation. Only around a third started their smart home with Home Assistant itself, with the rest arriving from other platforms. Perhaps unsurprisingly, among those who chose Home Assistant, the most commonly selected reasons were local control (89.3%), its open source nature (84.0%), and powerful customization (81.7%).

Beyond how people got started, we wanted a fuller picture of who they are and how they live. The typical user in the study ran a substantial setup, managing anywhere between 11 and 200 devices, and most people (75%) did so in a home they owned, and often across two or more floors. Over half of the households surveyed had a resident cat or dog, and a quarter of respondents spoke more than one language at home.

We also asked about professional background and neurodivergence, since understanding the range of expertise and needs within the community shapes how we communicate and design: 78.3% of primary users worked or studied in technology or engineering, and 15.7% identified as neurodivergent, compared with 68.1% who identified as neurotypical, and 12.3% who were unsure.

These are just a handful of the interesting things we discovered via this work, and we’ll mention some others throughout this post. For the full details, you can find the complete list of research questions, methodology, and other supporting documents on our <a href="https://github.com/OpenHomeFoundation/user-research/tree/main/community-survey24" target="_blank" rel="noopener noreferrer">GitHub page</a>.

## Why publish the dataset?

Sharing the information we have to support open source smart home research is an obvious move. A rich dataset is a powerful tool, and one we believe everyone should have access to. Publishing the results supports other researchers by allowing them to build on our work, and means a greater diversity of thinking and creativity can be applied to the data. It also makes research more trustworthy as others can inspect the data behind the study instead of relying on conclusions, and progress is faster when researchers don’t have to re-collect the same data from scratch.

Part of our mission is to inform society about open source, ethical alternatives to Big Tech smart home devices. And one way we do that is by conducting research that generates knowledge, and sharing findings publicly so everyone can learn from them. In doing so we’re aligning our organization with the ethos of *open science*: the approach to scientific publication that believes all publicly useful research and its data should be openly available for all to check, build on, and benefit from – not locked behind journal paywalls. That’s why we’ve published on <a href="https://about.zenodo.org/" target="_blank" rel="noopener noreferrer">Zenodo</a>, a trusted and widely used open research repository built and run by CERN, an international scientific organization and pioneer in open source, open access, and open data.

Just as we would in any formal research setting, we hold ourselves to this high standard, ensuring our methods and findings are rigorous, verifiable, reproducible, open, and *fair*.

## Championing FAIR data

To be clear, making data *technically* available online isn’t the same as sharing it fairly. That’s why we follow the FAIR data framework – a widely used standard that ensures published data is:

* **F**indable: the dataset has a <a href="https://doi.org/10.5281/zenodo.21825688" target="_blank" rel="noopener noreferrer">permanent link</a> (a DOI) so it can always be located and cited.
* **A**ccessible: anyone can download it, no gatekeeping.
* **I**nteroperable: it’s in an open, standard format that any tool can read, with a codebook explaining every column.
* **R**eusable: it comes with clear documentation and an open license so others know how they’re allowed to use it.

FAIR data is what makes information genuinely useful to a researcher, instead of just visible. But before we get into how we’re using this data, let’s look at what the data *isn’t*, and what we did to ensure anything shared was in line with our principles.

## Our publishing approach: Privacy first

As a foundation, we value privacy so much that it’s one of our three core principles. So it should come as no surprise that we followed a strict protocol to anonymize all data before publishing: no individual responses, no accounts, no identifiable people. Here’s a full rundown of all the actions we took to protect user privacy:

### We removed any information that could point to a person

Names, technical identifiers, timestamps, free-text comments that could contain personal details, and sensitive information pertaining to health, disability, religion, or other household members (for example, partners and children) were all removed. In fact, we deleted so much identifying information that the shared dataset is no longer considered “personal data” under the General Data Protection Regulation (GDPR) - a key European privacy law.

### We made sure no one stood out through k-anonymity review

Removing obvious identifiers isn’t enough. Sometimes a rare combination of ordinary details (such as a long-time user with an unusual setup) could make someone stand out. That’s why we used k-anonymity review – a data anonymization technique that checks whether enough people share the same combination of characteristics that no individual can be picked out from the group. We ran validated tests that looked for exactly this. Where needed, we grouped answers into broader categories: for example, describing someone as using “5–6 protocols” rather than listing their exact protocols. This ensured each respondent blended in with many others rather than being unique.

### When in doubt, we cut the data

After all these steps, a small number of responses still had rare enough combinations that we couldn’t be fully confident they’d blend in. Rather than take any chances, we simply removed them from the dataset. In the end we left out about 12% of responses (roughly one in eight) purely as a precaution. We would rather publish less and be certain than risk the privacy of our users.

### We checked it legally

Our approach was iteratively reviewed by our legal advisors, and every decision and step is recorded so it can be independently examined.

### We published supplementary material

Along with the dataset, we released additional documentation so our actions can be followed, including:

1. <a href="https://github.com/OpenHomeFoundation/user-research/blob/main/community-survey24/Anonymisation%20Protocol%20%26%20Decision%20Record.pdf" target="_blank" rel="noopener noreferrer">Anonymization protocol and k-anonymity review</a>.
2. <a href="https://github.com/OpenHomeFoundation/user-research/blob/main/community-survey24/README.md" target="_blank" rel="noopener noreferrer">README file</a> documenting details about the survey and the dataset.
3. <a href="https://github.com/idilb/Community_Survey_2024" target="_blank" rel="noopener noreferrer">Anonymization and k-anonymity analysis scripts</a>.
4. Full <a href="https://github.com/OpenHomeFoundation/user-research/blob/main/community-survey24/survey-questions.md" target="_blank" rel="noopener noreferrer">survey question list</a> (although not every column on this list is included in the dataset due to privacy, the survey structure itself is valuable for other researchers).
5. <a href="https://github.com/OpenHomeFoundation/user-research/blob/main/community-survey24/descriptive-statistics.md" target="_blank" rel="noopener noreferrer">Descriptive statistics</a>, covering response distribution for every closed-ended question in the survey.

At every decision fork, we chose the more cautious option, and have intentionally made all our processes transparent. After all, the whole point of this survey is to learn with and from our community, and for us that doesn’t stop at the last question. Which brings us to what the data revealed, and how it’s already shaping our work.

## Understanding social dynamics in the smart home

Our survey results showed that most people who responded live in a smart home with a partner or family. In that context, we learned that it’s typically one person – 94.4% of whom are men – who sets up and maintains the smart home, while their partners (87.4% of whom are women) and any children in the household interact with connected devices rather than through Home Assistant itself. In other words, one person tends to configure and maintain the system, while everyone else simply lives with it.

> This survey data aligns with previous research on social dynamics in the smart home. For example, studies of multi-user smart homes have found that whoever installs the devices tends to end up with outsized control over how they’re selected, managed, and fixed. In some cases, this can lead to discomfort around privacy as a result – both from the technology itself, and from a sense of being observed by the person managing it (pointing to the potential for this kind of control to be misused), as studies by <a href="https://dl.acm.org/doi/10.1145/3290605.3300498" target="_blank" rel="noopener noreferrer">Christine Geeng and Franziska Roesner</a> and <a href="https://dl.acm.org/doi/abs/10.1145/3411764.3445058" target="_blank" rel="noopener noreferrer">Nils Ehrenberg and Turkka Keinonen</a> have separately found.
>
> <a href="https://www.tandfonline.com/doi/full/10.1080/14036096.2022.2094460" target="_blank" rel="noopener noreferrer">Line Kryger Aagaard</a>’s work has shown that the smart home experience is often gendered, too. Annika’s own research on <a href="https://dl.acm.org/doi/10.1007/978-3-031-42286-7_17" target="_blank" rel="noopener noreferrer">cohabitation in smart homes</a> explored this directly, looking at what happens when one person sets up and maintains the technology while the other lives with it, and finding power imbalances that require couples to negotiate control. It’s a dynamic we’re actively working to redesign for (for example, see ongoing UX design discussions on “<a href="https://github.com/OpenHomeFoundation/ux-design/discussions/40" target="_blank" rel="noopener noreferrer">Home Assistant for the whole household</a>”), not just between partners but across all sorts of relationships in the home.

## How we’re applying the data

The survey data has already helped deepen our understanding of the user experience, and how we optimize it. For example, information like the number of floors in a home, its size, and whether it is owned or rented informed design changes for “areas” in Home Assistant. Similarly, when our commercial partner Nabu Casa was developing what became the Home Assistant Connect ZBT-2 to connect Zigbee and Thread devices, we provided them with insights from this survey so they could tailor the device to the needs and actual living conditions of our community.

On a broader level, the dataset helped us understand how the community relates to the foundation’s values of privacy, choice, and sustainability – which in turn helped shape how we interpreted data within our <a href="https://dl.acm.org/doi/full/10.1145/3772363.3798963" target="_blank" rel="noopener noreferrer">privacy research</a>, and how we developed key organizational positions, such as that laid out in our <a href="https://www.openhomefoundation.org/papers/privacy/" target="_blank" rel="noopener noreferrer">Privacy position paper</a>.

Likewise, learning about how current users arrive at Home Assistant – whether they start with it as their first platform or migrate to it from elsewhere – helps us understand the growth of the user base, and how the foundation can better support our community to advance our mission (keep an eye out for a detailed report on this soon).

Of course, as with any scientific research, the survey has limitations. It’s important to name them, both to be transparent and because they open opportunities for future improvements.

## Limitations of the survey

The survey was too long. Many of you pointed this out to us, and despite having timed the survey at about 20 minutes during tests, we were clearly a bit off. According to Typeform (the survey platform we used), the average completion time was over 40 minutes! We appreciate anyone who started the survey, and are especially grateful for all who stuck with it until the end. Having such rigorous, engaged community members is a good problem to have. But it can also skew results, since only those with the time and interest to finish a long survey are represented. Because of that, and the fact the data doesn’t capture responses of those who dropped out of the survey – respondents represent a committed core of Home Assistant, not all users.

As some community members pointed out, the survey being only in English also limited its reach and possibly its accuracy. Numerous Home Assistant users that speak languages other than English weren’t represented, and where non-native English speakers did fill out the form, it’s possible that some questions may not have landed clearly.

Language barriers, biases, and blown-out survey times are all things that should be taken into account when interpreting the data. Research gaps are normal in academia – we mention them because we’re aware of where we can improve, and to set ourselves up for future research that’s as inclusive as possible. But there’s also an opportunity here… If you’re a researcher working on smart home technology in academia or industry, these gaps might be a useful starting point for your own work. If you’d like to discuss this research or explore future projects together, [reach out to us via email](mailto:research@openhomefoundation.org) or join the <a href="https://github.com/OpenHomeFoundation/ux-design/discussions" target="_blank" rel="noopener noreferrer">UX design</a> or <a href="https://github.com/OpenHomeFoundation/user-research/discussions" target="_blank" rel="noopener noreferrer">user research</a> discussions on GitHub. We’d love to hear from you.

## Future research

Many of you shared great ideas for additional survey questions, covering the status quo of smart homes, future plans, goals, and wishes, other ways of interacting with the community, and current friction points within Home Assistant.

The generous feedback on the content, framing, and even the styling of the survey from community members was greatly appreciated, and points to one of the tensions we ran into while designing this survey in the first place: there’s too much to cover! With so many interesting topics to explore, narrowing the questions down was a challenge, and a big part of why the survey ended up as long as it was.

But that’s also the beauty of user research: there’s always so much to learn! For that reason, we’re planning another community survey, so stay tuned!

## Keeping the conversation going

At its core, this survey was about listening: replacing our guesswork with your facts and opinions, so we can build Home Assistant for those who actually live in a smart home, not just who we assume does. Publishing this dataset openly is another way of putting our principles into practice – letting anyone dig into what we’ve learned for the benefit of everyone.

None of this would exist without the thousands of you who took the time to answer, and stuck with a survey that ran longer than we intended. Thank you. Here’s to more open, honest conversations with the community that makes this all possible.
