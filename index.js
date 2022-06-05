const fs = require('fs');
const { inspect } = require('util');
const readline = require('readline');

const IGNORE_IPS = [''];

async function main () {
  const rlIface = readline.createInterface({
    input: fs.createReadStream(process.argv[process.argv.length - 1]),
    crlfDelay: Infinity
  });

  const agg = {
    total: 0,
    status: {},
    remote: {},
    hosts: {}
  };

  rlIface.on('line', (line) => {
    try {
      const p = JSON.parse(line);
      
      if (p.status) {
        if (!agg.status[p.status]) {
          agg.status[p.status] = 0;
        }

        agg.status[p.status]++;
      }

      if (p.request?.remote_ip) {
        if (IGNORE_IPS.includes(p.request.remote_ip)) {
          return;
        }

        agg.total++;

        if (!agg.remote[p.request.remote_ip]) {
          agg.remote[p.request.remote_ip] = {
            total: 0,
            routes: {}
          };
        }

        agg.remote[p.request.remote_ip].total++;
        
        if (!agg.remote[p.request.remote_ip].routes[p.request.host]) {
          agg.remote[p.request.remote_ip].routes[p.request.host] = {};
        }

        if (!agg.hosts[p.request.host]) {
          agg.hosts[p.request.host] = {
            remote: {},
            total: 0
          };
        }

        if (!agg.hosts[p.request.host].remote[p.request.remote_ip]) {
          agg.hosts[p.request.host].remote[p.request.remote_ip] = 0;
        }

        agg.hosts[p.request.host].total++;
        agg.hosts[p.request.host].remote[p.request.remote_ip]++;
        
        const host = agg.remote[p.request.remote_ip].routes[p.request.host];
        if (!host[p.request.uri]) {
          host[p.request.uri] = 0;
        }

        host[p.request.uri]++;
      }
    } catch {}
  }); 

  rlIface.on('close', () => {
    agg.unique_remotes = Object.keys(agg.remote).length;
    let outstr = inspect(agg, { depth: Infinity, colors: true, sorted: true });
    if (process.argv.includes('--json')) {
      outstr = JSON.stringify(agg, null, 2);
    }
    console.log(outstr);
  });
}

main();
