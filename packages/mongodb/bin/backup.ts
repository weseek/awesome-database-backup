#!/usr/bin/env node

import { MongoDBAwesomeBackup } from '../src/index'

const mab = new MongoDBAwesomeBackup();
mab.listFiles('s3://temp-mab/');
