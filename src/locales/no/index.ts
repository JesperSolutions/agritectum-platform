// Norwegian translations aggregator
// Imports Swedish as base and overrides with Norwegian-specific translations

import svMessages from '../sv/index';
import billing from './billing.json';

// Override Swedish base with Norwegian billing translations
const noMessages = {
  ...svMessages,
  ...billing,
};

export default noMessages;
