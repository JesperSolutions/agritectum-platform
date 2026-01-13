// Swedish translations aggregator
// This file combines all Swedish translation files into a single object

import common from './common.json';
import navigation from './navigation.json';
import dashboard from './dashboard.json';
import reports from './reports.json';
import reportForm from './reportForm.json';
import offers from './offers.json';
import customers from './customers.json';
import schedule from './schedule.json';
import admin from './admin.json';
import email from './email.json';
import validation from './validation.json';
import errors from './errors.json';
import address from './address.json';
import login from './login.json';
import profile from './profile.json';
import analytics from './analytics.json';
import notifications from './notifications.json';
import serviceAgreements from './serviceAgreements.json';
import buildings from './buildings.json';
import esg from './esg.json';

// Combine all translation files into a single object
const svMessages = {
  ...common,
  ...navigation,
  ...dashboard,
  ...reports,
  ...reportForm,
  ...offers,
  ...customers,
  ...schedule,
  ...admin,
  ...email,
  ...validation,
  ...errors,
  ...address,
  ...login,
  ...profile,
  ...analytics,
  ...notifications,
  ...serviceAgreements,
  ...buildings,
  ...esg,
};

export default svMessages;
