const fs = require('fs');
const sh = require('shelljs');
const crypto = require('crypto');
const pingWebHook = require('./scripts/pingWebHook');
const fetchPmTech = require('./scripts/fetchPmTech');
const { allow } = require('./package.json');

const { pmTech: allowedPmTech } = allow;
const delay = 1000;
const runtime = {
  pm: [''],
};

if (process.env.PM_TECH) {
  sh.exec('mkdir -p public');

  Object.keys(runtime).forEach((key) => {
    if (runtime[key][0]) {
      const fileBuffer = fs.readFileSync(runtime[key][0]);
      const hashSum = crypto.createHash('sha1');
      const ext = runtime[key][0]
        .split('/')
        .pop()
        .split('.')
        .pop();

      hashSum.update(fileBuffer);

      const hex = hashSum.digest('hex');

      runtime[key].push(`_${hex}.${ext}`);

      sh.exec(`cp ${runtime[key][0]} public/${runtime[key][1]}`);
    }
  });
}

const prefetch = async () => {
  sh.exec('mkdir -p bff-data');
  await pingWebHook();

  let pmTech = '';

  if (process.env.PM_TECH) {
    pmTech = sh.exec('cat scripts/pmt.js').stdout;

    sh.exec('mkdir -p public');

    Object.keys(runtime).forEach((key) => {
      if (runtime[key][0]) {
        const fileBuffer = fs.readFileSync(runtime[key][0]);
        const hashSum = crypto.createHash('sha1');
        const ext = runtime[key][0]
          .split('/')
          .pop()
          .split('.')
          .pop();

        hashSum.update(fileBuffer);

        const hex = hashSum.digest('hex');

        runtime[key].push(`_${hex}.${ext}`);

        setTimeout(() => {
          sh.exec(`cp ${runtime[key][0]} public/${runtime[key][1]}`);
        }, delay);
      }
    });
  }

  /* eslint-disable */
  const script = (process.env.PM_TECH
      && `
${pmTech}
setTimeout(function(){
  var propertyName = 'api-gateways';
  if (window.pmt) {
    window.pmt('setScalp', [{
      property: propertyName
    }]);
    window.pmt('scalp', [
      'pm-analytics',
      'load',
      document.location.pathname
    ]);
    window.pmt('trackClicks');
  }
}, 1000);
    `)
    || `
      console.info('Postman OSS');
    `;
  /* eslint-enable */

  fs.writeFile('bff.json', JSON.stringify({ script }), (err) => {
    if (err) {
      throw err;
    }
  });
};

prefetch();
