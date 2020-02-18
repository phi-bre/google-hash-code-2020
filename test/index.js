import baretest from 'baretest';
import assert from 'assert';
import suites from './*.test.js';

const test = baretest('Google Hash Code 2020 🎉');
Object.values(suites).map(suite => suite.default(test, assert));

!(async () => await test.run())();
