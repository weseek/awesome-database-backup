import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { consolidateDependabotBumps } from './consolidate';

describe('consolidateDependabotBumps', () => {

  it('leaves a single bump entry untouched', () => {
    const body = [
      '### 🧰 Maintenance',
      '',
      '- ci(deps-dev): bump turbo from 2.9.17 to 2.9.18 (#1682) @[dependabot[bot]](https://github.com/apps/dependabot)',
    ].join('\n');

    assert.equal(consolidateDependabotBumps(body), body);
  });

  it('consolidates consecutive bumps of the same package by the same author into one line', () => {
    const body = [
      '### 🧰 Maintenance',
      '',
      '- ci(deps): bump @aws-sdk/lib-storage from 3.1066.0 to 3.1067.0 (#1686) @[dependabot[bot]](https://github.com/apps/dependabot)',
      '- ci(deps): bump @aws-sdk/lib-storage from 3.1065.0 to 3.1066.0 (#1680) @[dependabot[bot]](https://github.com/apps/dependabot)',
      '- ci(deps): bump @aws-sdk/lib-storage from 3.1057.0 to 3.1061.0 (#1663) @[dependabot[bot]](https://github.com/apps/dependabot)',
    ].join('\n');

    const expected = [
      '### 🧰 Maintenance',
      '',
      '- ci(deps): bump @aws-sdk/lib-storage from 3.1057.0 to 3.1067.0 (#1663, #1680, #1686) @[dependabot[bot]](https://github.com/apps/dependabot)',
    ].join('\n');

    assert.equal(consolidateDependabotBumps(body), expected);
  });

  it('does not consolidate bumps of different packages', () => {
    const body = [
      '- ci(deps): bump @aws-sdk/client-s3 from 3.1065.0 to 3.1067.0 (#1684) @[dependabot[bot]](https://github.com/apps/dependabot)',
      '- ci(deps): bump @aws-sdk/lib-storage from 3.1066.0 to 3.1067.0 (#1686) @[dependabot[bot]](https://github.com/apps/dependabot)',
    ].join('\n');

    assert.equal(consolidateDependabotBumps(body), body);
  });

  it('does not consolidate bumps of the same package by different authors', () => {
    const body = [
      '- ci(deps): bump turbo from 2.9.16 to 2.9.17 (#1678) @[dependabot[bot]](https://github.com/apps/dependabot)',
      '- ci(deps): bump turbo from 2.9.15 to 2.9.16 (#1651) @hoo-bar',
    ].join('\n');

    assert.equal(consolidateDependabotBumps(body), body);
  });

  it('keeps non-bump entries in place while consolidating surrounding bump entries', () => {
    const body = [
      '### 🧰 Maintenance',
      '',
      '- support: Update document for path style (#1687) @hoo-bar',
      '- ci(deps): bump @aws-sdk/client-s3 from 3.1064.0 to 3.1067.0 (#1673) @[dependabot[bot]](https://github.com/apps/dependabot)',
      '- ci(deps): bump @aws-sdk/lib-storage from 3.1066.0 to 3.1067.0 (#1686) @[dependabot[bot]](https://github.com/apps/dependabot)',
      '- ci(deps): bump @aws-sdk/lib-storage from 3.1057.0 to 3.1061.0 (#1663) @[dependabot[bot]](https://github.com/apps/dependabot)',
    ].join('\n');

    const expected = [
      '### 🧰 Maintenance',
      '',
      '- support: Update document for path style (#1687) @hoo-bar',
      '- ci(deps): bump @aws-sdk/client-s3 from 3.1064.0 to 3.1067.0 (#1673) @[dependabot[bot]](https://github.com/apps/dependabot)',
      '- ci(deps): bump @aws-sdk/lib-storage from 3.1057.0 to 3.1067.0 (#1663, #1686) @[dependabot[bot]](https://github.com/apps/dependabot)',
    ].join('\n');

    assert.equal(consolidateDependabotBumps(body), expected);
  });

  it('compares version numbers numerically rather than lexicographically', () => {
    const body = [
      '- ci(deps): bump example from 3.9.0 to 3.10.0 (#10) @[dependabot[bot]](https://github.com/apps/dependabot)',
      '- ci(deps): bump example from 3.10.0 to 3.11.0 (#11) @[dependabot[bot]](https://github.com/apps/dependabot)',
    ].join('\n');

    const expected = '- ci(deps): bump example from 3.9.0 to 3.11.0 (#10, #11) @[dependabot[bot]](https://github.com/apps/dependabot)';

    assert.equal(consolidateDependabotBumps(body), expected);
  });

  it('does not consolidate entries whose author is not in the default (dependabot) whitelist', () => {
    const body = [
      '- ci(deps): bump example from 1.0.0 to 1.1.0 (#1) @hoo-bar',
      '- ci(deps): bump example from 1.1.0 to 1.2.0 (#2) @hoo-bar',
    ].join('\n');

    assert.equal(consolidateDependabotBumps(body), body);
  });

  it('consolidates entries for authors passed via the authors option', () => {
    const body = [
      '- ci(deps): bump example from 1.0.0 to 1.1.0 (#1) @hoo-bar',
      '- ci(deps): bump example from 1.1.0 to 1.2.0 (#2) @hoo-bar',
    ].join('\n');

    const expected = '- ci(deps): bump example from 1.0.0 to 1.2.0 (#1, #2) @hoo-bar';

    assert.equal(consolidateDependabotBumps(body, { authors: ['hoo-bar'] }), expected);
  });

  it('consolidates separately within each category section', () => {
    const body = [
      '### 🐛 Bug Fixes',
      '',
      '- ci(deps): bump example from 1.0.0 to 1.1.0 (#1) @[dependabot[bot]](https://github.com/apps/dependabot)',
      '',
      '### 🧰 Maintenance',
      '',
      '- ci(deps): bump example from 1.1.0 to 1.2.0 (#2) @[dependabot[bot]](https://github.com/apps/dependabot)',
    ].join('\n');

    assert.equal(consolidateDependabotBumps(body), body);
  });
});
