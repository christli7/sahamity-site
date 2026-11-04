/**
 * Publishes the website: rebuilds the pages (with fresh asset versions), then pushes them to
 * the repository GitHub Pages serves sahamity.com from.
 *
 *   node apps/site/scripts/publish.mjs            (add --dry-run to stop before the push)
 */
import { execFileSync, execSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = 'https://github.com/christli7/sahamity-site.git';
const site = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dryRun = process.argv.includes('--dry-run');
const git = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();

execSync('npx tsx scripts/build-legal.ts', { cwd: site, stdio: 'inherit' });

const name = git(site, 'log', '-1', '--format=%an');
const email = git(site, 'log', '-1', '--format=%ae');
const subject = git(site, 'log', '-1', '--format=%s');

const dir = mkdtempSync(path.join(tmpdir(), 'sahamity-site-'));
try {
  git(dir, 'clone', '--quiet', '--depth', '1', REPO, '.');
  // Files removed from the site are removed from the published copy too (CNAME stays).
  for (const file of git(dir, 'ls-files').split('\n')) {
    if (file && file !== 'CNAME' && !existsSync(path.join(site, file))) rmSync(path.join(dir, file));
  }
  cpSync(site, dir, { recursive: true });
  git(dir, 'checkout', '--', 'CNAME');
  git(dir, 'add', '-A');
  const changes = git(dir, 'status', '--short');
  if (!changes) console.log('The website is already up to date.');
  else if (dryRun) console.log(`Would publish:\n${changes}`);
  else {
    git(dir, '-c', `user.name=${name}`, '-c', `user.email=${email}`, 'commit', '--quiet', '-m', subject);
    git(dir, 'push', '--quiet');
    console.log(`Published:\n${changes}`);
  }
} finally {
  rmSync(dir, { recursive: true, force: true });
}
