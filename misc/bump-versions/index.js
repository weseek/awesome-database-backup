#!/usr/bin/env node

(async function () {
  try {
    process.env.SHIPJS = true;
    const { cli } = await import('./cli.js');
    cli(process.argv);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
