import {
  NewTwitterIcon,
  BlueskyIcon,
  Linkedin01Icon,
  Facebook01Icon,
  InstagramIcon,
  ThreadsIcon,
  DiscordIcon,
} from '@hugeicons/core-free-icons';
import type { IconSvgElement } from '@hugeicons/react';
import type { SocialPlatform } from '@veypost/shared';

export const PLATFORM_LABEL: Record<SocialPlatform, string> = {
  bluesky: 'Bluesky',
  discord: 'Discord',
  facebook: 'Facebook',
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  threads: 'Threads',
  x: 'X',
};

export const PLATFORM_COLOR: Record<SocialPlatform, string> = {
  bluesky: '#1d9bf0',
  discord: '#5865f2',
  facebook: '#1877f2',
  instagram: '#e1306c',
  linkedin: '#2867b2',
  threads: '#a8a8a8',
  x: 'var(--color-foreground)',
};

export const PLATFORM_BG: Record<SocialPlatform, string> = {
  bluesky: '#1d9bf0',
  discord: '#5865f2',
  facebook: '#1877f2',
  instagram: '#e1306c',
  linkedin: '#2867b2',
  threads: '#a8a8a8',
  x: '#0f0f0f',
};

export const PLATFORM_LIMIT: Record<SocialPlatform, number> = {
  bluesky: 300,
  discord: 2000,
  facebook: 63206,
  instagram: 2200,
  linkedin: 3000,
  threads: 500,
  x: 280,
};

export const PLATFORM_ICON: Record<SocialPlatform, IconSvgElement> = {
  bluesky: BlueskyIcon,
  discord: DiscordIcon,
  facebook: Facebook01Icon,
  instagram: InstagramIcon,
  linkedin: Linkedin01Icon,
  threads: ThreadsIcon,
  x: NewTwitterIcon,
};

export const ALL_PLATFORMS = Object.keys(PLATFORM_LABEL) as SocialPlatform[];

export const COMING_SOON = new Set<SocialPlatform>(['bluesky']);
