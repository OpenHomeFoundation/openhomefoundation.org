---
layout: post
title: "Proxy all the things: no device left behind"
description: "Discover how Open Home Foundation projects can help you give your beloved old devices a new lease of life for a more sustainable smart home."
card_image: /assets/images/blog/proxy-all-the-things-no-device-left-behind/card.webp
eleventyComputed:
  og_image: "https://assets.openhomefoundation.org/opengraph?url=https://www.openhomefoundation.org{{ page.url }}?share"
hide_header_image: true
date: 2026-06-18
author: "Paulus Schoutsen"
category: "Hardware"
---

At the Open Home Foundation, we believe the most sustainable device is the one you already own. You shouldn't be forced to abandon devices that work – and that you love – just because the manufacturer hasn't made them "smart".

That's why recent releases of <a href="https://www.home-assistant.io/" target="_blank" rel="noopener noreferrer">Home Assistant</a> and <a href="https://esphome.io/" target="_blank" rel="noopener noreferrer">ESPHome</a> focus on helping you bridge the gap between older, offline protocols and the modern smart home. This makes it possible for you to pull almost any device into your setup – yes, even that 20-year-old receiver, or basement air conditioner with yellowing plastic remote!

<!--more-->

## What we've built

If you missed this in the Home Assistant <a href="https://www.home-assistant.io/blog/categories/release-notes/" target="_blank" rel="noopener noreferrer">release notes</a>, here's a summary. We've expanded the capabilities of ESPHome – the software that powers many of our DIY hardware projects – to support generic proxying. This allows Home Assistant to use small, inexpensive microcontrollers as physical bridges for:

* Infrared (IR)
* Radio Frequency (RF)
* Serial Communication (RS232/UART)

These join our existing Bluetooth and Z-Wave proxies to ensure that no matter what language your device speaks, you can reach it over your home network.

## How a proxy works

I like to think of a proxy as a communication bridge. When acting as a proxy, a device handles a certain type of communication for Home Assistant. We already have Bluetooth proxies, which are ESPHome-powered devices that speak Bluetooth for Home Assistant. The proxy itself doesn't need to know the specific commands for your television or air conditioner, it simply speaks its language – whether that's Bluetooth, a pulse of infrared light, a radio frequency, or a serial connection. It's Home Assistant that tells the proxy what commands to send and when.

What's awesome about this approach is that it separates the signal from the logic. The proxy does the hard work of physically sending the message, while Home Assistant tackles the brain work 🧠. This separation also means the proxy doesn't have to live on or near your Home Assistant server to be able to "talk" to it: you can place them wherever it makes sense for your home, and the devices you want to control.

And as our community creates more integrations, you can use your single infrared-emitting ESPHome device for other TV brands, that old AC in your basement, or anything else you choose.

The result is that instead of shelling out to replace that perfectly functional AC with a new smart model, you can now use a proxy to build intelligence yourself. It's about giving your existing gear the modern features it was missing.

## Freedom from cables…

We've also tackled Serial, a technology that has been a reliable standard for more than 60 years. It's in more devices than you might imagine – from solar inverters and high-end audio receivers to industrial gear – but it had a pretty big downside: it needed to be plugged directly into your Home Assistant server via a cable 😕.

Our new Serial proxy changes that. Home Assistant now establishes a wireless, encrypted connection to an ESPHome proxy, allowing you to cut the cord and control your serial devices from anywhere in the home. We are already seeing this in action, with the most recent releases of Home Assistant adding native support for Denon receivers and LG TVs, both over RS232 serial connections.

## The joy of giving (and receiving)

We're giving radio frequency the same treatment. With an RF-capable ESPHome proxy, Home Assistant can now reach devices that broadcast over the air: Honeywell string lights, for example.

And if all that wasn't enough, <a href="https://www.home-assistant.io/blog/2026/06/03/release-20266/" target="_blank" rel="noopener noreferrer">Home Assistant 2026.6</a> can now *receive* IR, not just send it, which basically means an old IR remote can be used as an input for just about anything in Home Assistant!

## The bigger picture

By consolidating all your devices into a single platform, Home Assistant gives you complete freedom to use your data however you see fit. You can build custom dashboards, create complex automations, sync with other interfaces like Google Home (if you really want to!), or even give control to your local AI agent.

But what I'm really excited about is how this freedom fuels our vision of a more sustainable smart home. This isn't an accident: making IR, RF and serial "first-class citizens" of Home Assistant are specific goals on our <a href="https://github.com/orgs/OpenHomeFoundation/projects/8" target="_blank" rel="noopener noreferrer">public roadmap</a>, all tied to the same Open Home Foundation value: sustainability.

As <a href="https://www.howtogeek.com/stop-buying-new-smart-home-devices-old-ones-work-with-home-assistant/" target="_blank" rel="noopener noreferrer">*How-To Geek* recently put it</a>, the sheer pace of our new integrations means the best way to upgrade your smart home today is actually to stop buying new devices, because the high-quality gear you already own probably works with Home Assistant now.

The proxying capabilities we're building give you a real, viable alternative to the mainstream "disposable" smart home. When you choose to reuse and repurpose the hardware you already own, you aren't just saving money – you're proving your home can be sustainable as well as smart.

## Bring your old gear back to life

To get started, you need ESPHome-powered proxies. There is no official hardware that does this (yet!), so you'll need to make your own. This isn't as daunting as it might sound since we've created <a href="https://esphome.io/projects/?type=irrf" target="_blank" rel="noopener noreferrer">ready-made projects</a>: simply buy the linked device, install the software via your browser, and you're good to go.

## Help us expand the ecosystem

While the infrastructure is ready to use today, to really break free from the disposable smart home we need to expand the library of older devices that Home Assistant can talk to natively.

If you're a developer, we need your help building out new integrations that take advantage of these connections. Check out our development guides for <a href="https://developers.home-assistant.io/docs/bluetooth" target="_blank" rel="noopener noreferrer">Bluetooth</a>, <a href="https://developers.home-assistant.io/blog/2026/03/30/infrared-entity-platform" target="_blank" rel="noopener noreferrer">infrared integrations</a>, <a href="https://developers.home-assistant.io/blog/2026/04/24/radio-frequency-entity-platform/" target="_blank" rel="noopener noreferrer">radio frequency</a>, and <a href="https://developers.home-assistant.io/blog/2026/04/27/pyserial-to-serialx" target="_blank" rel="noopener noreferrer">serial</a> integrations to get involved!
