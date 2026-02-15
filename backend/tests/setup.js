'use strict';

const path = require('path');
const dotenv = require('dotenv');

// Load test environment variables BEFORE anything else
dotenv.config({ path: path.join(__dirname, '..', '.env.test'), override: true });
