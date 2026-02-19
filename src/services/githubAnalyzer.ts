import { config } from '../config/index.js';
import type { GitHubSignals } from './scorer.js';

function extractUsername(url: string): string {
  const match = url.match(/github\.com\/([a-zA-Z0-9\-]+)/);
  if (!match) throw new Error(`Invalid GitHub URL: ${url}`);
  return match[1];
}

export async function fetchGitHubSignals(githubUrl: string): Promise<GitHubSignals> {
  const username = extractUsername(githubUrl);

  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'SkillGapAnalyzer/1.0',
  };

  if (config.GITHUB_TOKEN) {
    headers['Authorization'] = `Bearer ${config.GITHUB_TOKEN}`;
  }

  // API Call 1: User profile
  const userRes = await fetch(`https://api.github.com/users/${username}`, { headers });
  if (!userRes.ok) {
    if (userRes.status === 404) throw new Error(`GitHub user "${username}" not found`);
    if (userRes.status === 403) throw new Error('GitHub API rate limit exceeded');
    throw new Error(`GitHub API error: ${userRes.status}`);
  }
  const userData: any = await userRes.json();

  // API Call 2: User repos (sorted by last push, up to 100)
  const reposRes = await fetch(
    `https://api.github.com/users/${username}/repos?sort=pushed&direction=desc&per_page=100`,
    { headers }
  );
  const reposData: any[] = reposRes.ok ? (await reposRes.json()) as any[] : [];

  // Derive signals
  const languageCounts: Record<string, number> = {};
  let latestPush: Date | null = null;
  let starredCount = 0;
  let hasDescription = false;
  let hasForks = false;

  for (const repo of reposData) {
    if (repo.language) {
      languageCounts[repo.language] = (languageCounts[repo.language] ?? 0) + 1;
    }

    if (repo.pushed_at) {
      const pushDate = new Date(repo.pushed_at);
      if (!latestPush || pushDate > latestPush) latestPush = pushDate;
    }

    if (repo.stargazers_count > 0) starredCount++;
    if (repo.description && repo.description.length > 10) hasDescription = true;
    if (repo.fork) hasForks = true;
  }

  // Top 5 languages by frequency
  const topLanguages = Object.entries(languageCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([lang]) => lang);

  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  return {
    username,
    publicRepoCount: userData.public_repos ?? 0,
    followers: userData.followers ?? 0,
    topLanguages,
    lastPushDate: latestPush?.toISOString() ?? null,
    starredRepoCount: starredCount,
    hasDescriptiveRepos: hasDescription,
    hasForkedRepos: hasForks,
    recentlyActive: latestPush ? latestPush >= ninetyDaysAgo : false,
    profileBio: userData.bio ?? null,
  };
}
