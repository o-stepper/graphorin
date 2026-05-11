<script setup lang="ts">
withDefaults(
  defineProps<{
    version?: string;
    license?: string;
  }>(),
  {
    version: '0.1.0',
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
