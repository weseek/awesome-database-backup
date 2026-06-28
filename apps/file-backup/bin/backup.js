#!/usr/bin/env node

// Resolve the entry point relative to this file. A self-referential package
// import is not used because pnpm does not create a symlink for a package to
// itself, which would make it unresolvable at runtime.
const { main } = require('../package.json');
require(`../${main}`);
