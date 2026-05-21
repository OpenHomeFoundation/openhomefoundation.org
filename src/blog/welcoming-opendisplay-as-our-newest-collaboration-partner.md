---
layout: post
title: "Welcoming OpenDisplay as our newest collaboration partner"
description: "Find out how we're bringing the versatility and practicality of e-paper to a wider audience by teaming up with our new collaboration partner, OpenDisplay."
card_image: /assets/images/blog/welcoming-opendisplay-as-our-newest-collaboration-partner/card.webp
eleventyComputed:
  og_image: "https://assets.openhomefoundation.org/opengraph?url=https://www.openhomefoundation.org{{ page.url }}?share"
hide_header_image: true
date: 2026-05-21
author: "Paulus Schoutsen"
category: "Announcements"
---

We've always had a soft spot for e-paper at the Open Home Foundation. It's always-on, readable in any light, and can run for months on a single battery. While many of our interactions with smart home integrations happen through brightly lit glass – which can be headache-inducing at times – e-paper offers a softer option: technology that feels more like a physical object and less like a computer.

So to help bring the fun, versatility and practicality of e-paper to a wider audience, we're teaming up with our new collaboration partner: <a href="https://opendisplay.org/" target="_blank" rel="noopener noreferrer">OpenDisplay</a>!

<!--more-->

## Unlocking the potential of e-paper

Because e-paper displays look so impressive, it's easy to assume they're difficult to set up. In some ways, that's been true – with such screens often being locked into proprietary cloud systems or requiring complex code just to update an image.

OpenDisplay has solved this by creating an open source protocol – a standard language in other words – for e-paper displays. They've also established a reference implementation, so any manufacturer can use it to ensure their e-paper displays work with Home Assistant (or any other smart home setup) straight out of the box. The result is it's now easier than ever to build low-power smart home displays that don't look like glaring screens. 😎

<img src="/assets/images/blog/welcoming-opendisplay-as-our-newest-collaboration-partner/image1.webp" alt="All sorts of projects are possible with e-paper displays!" style="border: 0;box-shadow: none;">

*All sorts of projects are possible with e-paper displays!*

## The power of Bluetooth proxies

For our community, this is where the fun starts. OpenDisplay can piggyback on the Bluetooth proxies you likely already have around your home – such as an ESP32 running <a href="https://esphome.io/projects/" target="_blank" rel="noopener noreferrer">ESPHome</a>. It uses that existing network to send any image you want, be it an illustration, weather dashboard, or calendar overview, straight to your e-paper displays. You're essentially using the infrastructure you've already built to keep everything local and fast, without ever needing the cloud.

## Why we're keen to collaborate

We've always believed the Open Home is much bigger than any single project. The real magic happens when independent developers and communities unite to do great things together. Whether it's <a href="https://kno.wled.ge/" target="_blank" rel="noopener noreferrer">WLED</a>, <a href="https://www.zigbee2mqtt.io/" target="_blank" rel="noopener noreferrer">Zigbee2MQTT</a>, or now OpenDisplay, we love teaming up with people who are building the right tools for the right reasons. By supporting OpenDisplay, we're not just backing a great piece of software, we're helping ensure it remains a flourishing shared resource for everyone to use and enjoy 😃.

And of course, they also align with our core principles:

* **Privacy:** Your data stays on your local network, never leaving your home.
* **Choice:** You aren't locked into a specific manufacturer's app or a cloud service that might disappear tomorrow.
* **Sustainability:** Low-power e-paper displays can run for months on a single battery and remain useful for many years to come.

We can't wait to see where this partnership takes us. <a href="https://www.seeedstudio.com/" target="_blank" rel="noopener noreferrer">Seeed Studio</a> is already on board with reference hardware to get you started, and we're excited to see how the community expands on that. E-paper opens up so many avenues to explore: from dynamic artwork displays to simple, low-distraction dashboards that blend into your decor. Ready to dive in? Check out the <a href="https://opendisplay.org/" target="_blank" rel="noopener noreferrer">OpenDisplay documentation</a> to find out what's supported and how to get your first e-paper display up and running!
