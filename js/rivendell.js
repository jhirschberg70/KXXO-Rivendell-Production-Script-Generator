function buildRivendellScript(cart, network, name, isci) {
  return (
    `rdimport ` +
    `--delete-cuts ` +
    `--clear-datetimes ` +
    `--clear-daypart-times ` +
    `--to-cart=${cart} ` +
    `--set-string-title="${network}" `+
    `--set-string-client="${network}" ` +
    `--set-string-artist="${name}" ` +
    `SPOTS *${isci}* &\n` +
    `wait\n`
  );
}

function download(data, fileName) {
  let a = document.createElement("a");
  a.download = fileName;
  a.href = "data:plain/txt charset=utf-8," + data;
  a.click();
}
chrome.runtime.onMessage.addListener((message) => {
  const excludes = ['MyComputerCaree', 'NewsMax', 'Instinctive Med/My Computer'];
  const networks = { 'AdLarge - NC': '', 'Compass - NC': '', 'G Networks - NC': '', 'Premiere - NC': '', 'Sun Broadcasting - NC': '', 'Westwood One - NC - Nectar': '' };

  let alertMsg = '';
  let carts = new Set();
  let duplicateCarts = new Set();
  let duplicateIscis = new Set();
  let iscis = new Set();
  let spots = '';
  let weekOf = null;

  // Regular expression to match just the new spots for the week and
  // create capturing groups for cart, network, copy name, isci and start
  // date
  const regex = /(?:<Value>(.+?)<\/Value>.+?<Value>(.+?)<\/Value>.+?)+?<Value>\+(.+?)<\/Value>.+?<Value>.+?<\/Value>.+?<Value>.+?<\/Value>.+?<Value>(.+?)<\/Value>.+?<Value>(.+?)<\/Value>.+?<Value>.+?<\/Value>/gs;
  
  for (const [match, cart, network, name, isci, date] of message.matchAll(regex)) {
    if (!weekOf) {
      let d = new Date(date);
      d.setDate(d.getDate() - ((d.getDay()) ? (d.getDay() - 1) : 6));
      weekOf = d.toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" });
    }

    // Check if ISCI codes/cart numbers are used multiple times
    if (iscis.has(isci)) {
      if (!duplicateIscis.has(isci)) {
        duplicateIscis.add(isci);
        alertMsg += `Duplicate ISCI: ${isci}\n\n`;
      }
    } else {
      iscis.add(isci);
    }

    if (carts.has(cart)) {
      if (!duplicateCarts.has(cart)) {
        duplicateCarts.add(cart);
        alertMsg += `Duplicate Cart: ${cart}\n\n`;
      }
    } else {
      carts.add(cart);
    }

    // Exclude spot if the name contains any of the strings found in excludes[]
    if (!(excludes.some((exclude) => { return name.includes(exclude); }))) {
      networks[network] += buildRivendellScript(cart, network, name, isci);
      spots += `<tr><td>${cart}</td><td>${network}</td><td>${name}</td><td>${isci}</td></tr>`;
    } else {
      alertMsg += `Cart ${cart} ${network} ${name} ${isci} excluded from production\n\n`
    }
  }

  if (alertMsg) {
    alert(alertMsg);
  }

  const [month, day, year] = weekOf.split("/");

  document.getElementById('week').append(weekOf);
  document.getElementById('spots').innerHTML += spots;

  document.getElementById('download-link').addEventListener('click', () => {
    for (const [network, script] of Object.entries(networks)) {
      if (script) {
        download(script, `${network} ${year}-${month}-${day}.sh`, 'text/plain')
      }
    }
  });
});