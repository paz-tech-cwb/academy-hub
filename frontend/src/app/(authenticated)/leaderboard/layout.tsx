import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Leaderboard',
};

/**
 * Define o título da aba da página "Leaderboard".
 */
export default function LeaderboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
