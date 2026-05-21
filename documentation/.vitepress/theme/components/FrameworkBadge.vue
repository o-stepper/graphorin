<script setup lang="ts">
// Default the badge version to the canonical root package.json version
// (same source the site footer uses in config.ts) so it never drifts
// out of sync with the released version on a bump.
import { version as pkgVersion } from '../../../../package.json';

withDefaults(
  defineProps<{
    version?: string;
    license?: string;
  }>(),
  {
    version: pkgVersion,
    license: 'MIT',
  },
);
</script>

<template>
  <span class="framework-badge" role="status">
    <span class="dot" aria-hidden="true" />
    <span>v{{ version }}</span>
    <span aria-hidden="true">·</span>
    <span>{{ license }}</span>
  </span>
</template>
