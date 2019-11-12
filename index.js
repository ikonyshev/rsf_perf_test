const fetch = require('node-fetch');
const minimist = require('minimist');
const asciichart = require ('asciichart')
const parseMoovT = require('./utils/parseMoovT');
const calculateAverages = require('./utils/calculateAverages');

const args = minimist(process.argv.slice(2));

const printUsage = () => {
  console.log('npm run -u <url> -c <numberOfFetches>');
  console.log(' -u   URL to load');
  console.log(' -c   Number of fetches. Defaults to 20');
};

const url = args.u;

if (!url) {
  console.error('No URL provided');
  printUsage();
  return -1;
}

const count = args.c || 20;

const printMetrics = (m, type = 'AVERAGE') => {
  console.log(`
  ==== ${type} METRICS ====
  TOTAL TIME: ${m.time} ms
  
  MOOV WORKER: Total ${m.wt}, Execution ${m.wp}, Longest Upstream Request ${m.wm}, Requests count: ${m.wc}
  MPS: Total ${m.mt}, Upstream waiting ${m.mu}${m.mp ? `, MPS Execution ${m.mp}` : ''}, BLOB waiting ${m.mb}
  Inner Edge Varnish: Total ${m.vt}, Upstream ${m.vf}
  Inner Edge NGINX: Total ${m.nt}
  Outer Edge Varnish: Total ${m.ot}, Upstream ${m.of}${m.bd ? `, Bot detection ${m.bd}` : ''}
  Shield Outer Edge Varnish: Total ${m.st}, Upstream ${m.sf}
  Common Outer Edge Varnish: Total ${m.bf}
  ==== ${type} METRICS ====
  `);
};

const test = async () => {
  const callTime = Date.now();
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A356 Safari/604.1',
    }
  });
  const resultTime = Date.now();
  const xMoovT = response.headers.get('x-moov-t');
  const requestId = response.headers.get('x-request-id');
  const time = resultTime - callTime;
  const metrics = {
    time,
    ...parseMoovT(xMoovT),
  };
  console.log(`Attempt: Time ${time}, OE Time ${metrics.bf}, Execution ${metrics.wp}, Upstream ${metrics.wm}, ${response.status}`);

  return {
    requestId,
    metrics,
    status: response.status,
  };
};

const runTest = async () => {
  const results = [];
  for (let i = 0; i < count; i++) {
    results.push(await test());
  }

  results.filter((res) => res.status > 200).forEach((errRes) => {
    console.log('Entry', errRes.requestId, ':', errRes.status);
  });

  const entries = results.filter((res) => res.status === 200);

  console.log('=== TOTAL TIME ===');
  console.log(asciichart.plot(entries.map((res) => res.metrics.time), { height: 8 }));
  console.log('=== EXECUTION TIME ===');
  console.log(asciichart.plot(entries.map((res) => res.metrics.wp), { height: 8 }));
  console.log('=== UPSTREAM TIME ===');
  console.log(asciichart.plot(entries.map((res) => res.metrics.wm), { height: 8 }));

  const { avg, longest } = calculateAverages(entries.map((res) => res.metrics), ['time', 'wp', 'wm']);

  printMetrics(avg);
  printMetrics(longest['time'].metrics, 'MAX TIME');
  printMetrics(longest['wp'].metrics, 'MAX EXECUTION');
  printMetrics(longest['wm'].metrics, 'MAX UPSTREAM REQUEST');

};

runTest();
