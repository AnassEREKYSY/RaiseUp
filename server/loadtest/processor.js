const { faker } = require('@faker-js/faker');

function init(context, events, done) { return done(); }

async function beforeScenario(context, events, done) {
  try {
    if (!context.vars.jwt) {
      const base = context.vars.base || '/api';
      const email = process.env.LT_EMAIL || 'loadtest+startup@example.com';
      const password = process.env.LT_PASSWORD || 'Passw0rd!';
      const role = process.env.LT_ROLE || 'STARTUP';

      let resp = await fetch(`${context.config.target}${base}/auth/login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (resp.status !== 200) {
        await fetch(`${context.config.target}${base}/auth/register`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ email, fullName: 'Load Tester', password, role })
        });
        resp = await fetch(`${context.config.target}${base}/auth/login`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        if (resp.status !== 200) throw new Error(`Auth failed ${resp.status}`);
      }

      const json = await resp.json();
      context.vars.jwt = json.token;
      context.vars.meId = json.user.id;
    }

    const industries = ['FINTECH', 'HEALTH', 'EDTECH', 'AI', 'SAAS'];
    const stages = ['IDEA', 'MVP', 'SEED', 'SERIES_A', 'GROWTH'];
    context.vars.pickIndustry = faker.helpers.arrayElement(industries);
    context.vars.pickStage = faker.helpers.arrayElement(stages);
    context.vars.pickCountry = faker.location.country();

    return done();
  } catch (e) { return done(e); }
}

function beforeRequest(req, context, ee, next) {
  if (context.vars.jwt) {
    req.headers = req.headers || {};
    req.headers.Authorization = `Bearer ${context.vars.jwt}`;
  }
  context.vars.fakeProjectTitle = faker.commerce.productName();
  context.vars.fakeParagraph = faker.lorem.paragraph();
  context.vars.fakeBudget = faker.number.int({ min: 1000, max: 50000 });
  context.vars.fakeSentence = faker.lorem.sentence();
  return next();
}

function maybeRunWrite(context, events, done) {
  context.vars.doWrite = Math.random() < (process.env.LT_WRITE_PROB ? Number(process.env.LT_WRITE_PROB) : 0.6);
  return done();
}

module.exports = { init, beforeScenario, beforeRequest, maybeRunWrite };
