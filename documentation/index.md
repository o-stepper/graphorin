---
title: Graphorin documentation
description: The documentation starts at the guide. This root page only forwards to /guide/.
layout: page
sidebar: false
editLink: false
lastUpdated: false
search: false
head:
  - - meta
    - http-equiv: refresh
      content: "0; url=/guide/"
  - - meta
    - name: robots
      content: noindex
---

<!--
  The docs site has no landing page: docs.graphorin.com opens the guide
  directly. Production traffic is redirected server-side with a 301 by
  `public/_redirects` (Cloudflare Pages evaluates it before static
  assets), so this stub only serves `vitepress dev` / `vitepress
  preview` and any host without redirect support. The marketing landing
  page lives at https://graphorin.com.
-->

<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vitepress';

const router = useRouter();

onMounted(() => {
  router.go('/guide/');
});
</script>

<p style="padding: 4rem 1.5rem; text-align: center;">
  Redirecting to the <a href="/guide/">Graphorin guide</a>.
</p>
