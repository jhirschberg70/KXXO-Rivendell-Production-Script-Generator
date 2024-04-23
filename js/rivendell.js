function buildRivendellScript(cart, network, name, isci) {
  return 'rdimport --delete-cuts --clear-datetimes --clear-daypart-times ' +
    '--to-cart=' + cart + ' ' +
    '--set-string-title=\"' + network + '\" ' +
    '--set-string-client=\"' + network + '\" ' +
    '--set-string-artist=\"' + name + '\" ' +
    'SPOTS *' + isci + '* &\nwait\n';
}

function download(data, fileName) {
  let a = document.createElement("a");
  a.download = fileName;
  a.href = "data:plain/txt charset=utf-8," + data;
  a.click();
}
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  const excludes = ['MyComputerCaree'];
  const networks = { 'AdLarge - NC': '', 'Compass - NC': '', 'Premiere - NC': '', 'Sun Broadcasting - NC': '', 'Westwood One - NC - Nectar': '' };

  let alertMsg = '';
  let carts = new Set();
  let iscis = new Set();
  let records = msg.match(/\<Value\>.+\<\/Value\>/g);
  let spots = '';
  let startDate = null;

  records.forEach((field, index) => {
    field = field.replace(/\<Value\>/, '').replace(/\<\/Value\>/, '');
    records[index] = field;
  });

  while (records.length) {
    const cart = records.shift();
    const network = records.shift();
    let name = records.shift();
    const expiration = records.shift();
    const length = records.shift();
    const isci = records.shift();
    const date = new Date(records.shift());
    const station = records.shift();

    // A new spot has a +\s at the beginning of the name field
    // If the spot is new, we want to produce it.  Otherwise, we
    // can skip it.
    if (name.startsWith('+')) {

      // Strip leading +\s from name
      name = name.replace(/\+\s/, '');

      // If the current record's date is earlier than all
      // previous dates, set startDate = date;
      startDate = ((date < startDate) || startDate === null) ? date : startDate;

      // Check if ISCI codes/cart numbers are used multiple times
      if (iscis.has(isci)) {
        alertMsg += 'Duplicate ISCI: ' + isci + '\n';
      }
      else {
        iscis.add(isci);
      }

      if (carts.has(cart)) {
        alertMsg += 'Duplicate Cart: ' + cart + '\n';
      }
      else {
        carts.add(cart);
      }

      // Exclude spot if the name contains any of the strings found in excludes[]
      if (!(excludes.some((exclude) => { return name.includes(exclude); }))) {
        networks[network] += buildRivendellScript(cart, network, name, isci);
        spots += '<tr><td>' + cart + '</td><td>' + network + '</td><td>' + name + '</td><td>' + isci + '</td></tr>';
      }
    }

    if (alertMsg) {
      alert(alertMsg);
      alertMsg = '';  // Clear the message so it isn't duplicated
    }
  }

  // set startDate to the date of the Monday of the week in which
  // the new spots begin
  startDate.setDate(startDate.getDate() - ((startDate.getDay()) ? (startDate.getDay() - 1) : 6));

  startDateString = startDate.toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" });

  const [month, day, year] = startDateString.split("/");

  document.getElementById('week').append(startDateString);
  document.getElementById('spots').innerHTML += spots;

  document.getElementById('download-link').addEventListener('click', () => {
    for (const [network, script] of Object.entries(networks)) {
      if (script) {
        download(script, `${network} ${year}-${month}-${day}.sh`, 'text/plain')
      }
    }
  });
});
