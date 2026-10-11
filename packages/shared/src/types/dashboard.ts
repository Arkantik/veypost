import type { SocialPlatform } from './index.js';

export interface DashboardPostStats {
  scheduled: number;
  publishedThisWeek: number;
  failed: number;
}

export interface RecentPost {
  id: string;
  content: string;
  status: 'publishing' | 'published' | 'failed';
  platforms: SocialPlatform[];
  publishedAt: string;
}

export interface UpcomingPost {
  id: string;
  content: string;
  platforms: SocialPlatform[];
  scheduledAt: string;
}

export interface DashboardSummary {
  postStats: DashboardPostStats;
  recentPosts: RecentPost[];
  upcomingPosts: UpcomingPost[];
  hasConnectedAccounts: boolean;
}
