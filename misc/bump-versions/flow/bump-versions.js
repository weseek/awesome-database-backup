import semver from 'semver';
import { loadConfig, getCurrentVersion, getReleaseType } from 'shipjs-lib';

import printDryRunBanner from 'shipjs/src/step/printDryRunBanner.js';
import confirmNextVersion from 'shipjs/src/step/prepare/confirmNextVersion.js';
import updateVersion from 'shipjs/src/step/prepare/updateVersion.js';
import updateVersionMonorepo from 'shipjs/src/step/prepare/updateVersionMonorepo.js';

import printHelp from '../step/printHelp.js';

async function bumpVersions({
  help = false,
  dir = '.',
  dryRun = false,
  updateDependencies = true,
  increment = 'patch',
  preid = 'RC',
}) {
  if (help) {
    printHelp();
    return;
  }
  if (dryRun) {
    printDryRunBanner();
  }

  const config = await loadConfig(dir, '.bump-versionsrc');

  const { monorepo } = config;
  if (!updateDependencies) {
    monorepo.updateDependencies = false;
  }

  // get current version
  const currentVersion = monorepo && monorepo.mainVersionFile
    ? getCurrentVersion(dir, monorepo.mainVersionFile)
    : getCurrentVersion(dir);

  // determine next version
  let nextVersion = semver.inc(currentVersion, increment, preid); // set preid if type is 'prerelease'
  nextVersion = await confirmNextVersion({
    yes: true,
    currentVersion,
    nextVersion,
    dryRun,
  });
  const releaseType = getReleaseType(nextVersion);

  // update
  const updateVersionFn = monorepo
    ? updateVersionMonorepo
    : updateVersion;
  await updateVersionFn({
    config, nextVersion, releaseType, dir, dryRun,
  });
}

const arg = {
  '--dir': String,
  '--help': Boolean,
  '--dry-run': Boolean,
  '--update-dependencies': Boolean,
  '--increment': String,
  '--preid': String,

  // Aliases
  '-d': '--dir',
  '-h': '--help',
  '-D': '--dry-run',
  '-i': '--increment',
};

export default {
  arg,
  fn: bumpVersions,
};
