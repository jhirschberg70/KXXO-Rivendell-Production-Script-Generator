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
chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  const excludes = ['MyComputerCaree'];
  const networks = { 'AdLarge - NC': '', 'Compass - NC': '', 'Premiere - NC': '', 'Sun Broadcasting - NC': '', 'Westwood One - NC - Nectar': '' };

  let alertMsg = '';
  let carts = new Set();
  let iscis = new Set();
  let records = msg.match(/\<Value\>.+\<\/Value\>/g);
  let spots = '';
  let startDate = null;

  records.forEach(function (field, index) {
    field = field.replace(/\<Value\>/, '').replace(/\<\/Value\>/, '');
    records[index] = field;
  });

  while (records.length) {
    const cart = records.shift();
    const network = records.shift();
    let   name = records.shift();
    const expiration = records.shift();
    const length = records.shift();
    const isci = records.shift();
    const date = moment((records.shift()), 'MM/DD/YYYY');
    const station = records.shift();

    // A new spot has a +\s at the beginning of the name field
    // If the spot is new, we want to produce it.  Otherwise, we
    // can skip it.
    if (name.startsWith('+')) {

      // Strip leading +\s from name
      name = name.replace(/\+\s/, '');

      // If this is the first date being processed or the current
      // record's date is earlier than all previous dates, set
      // startDate = date;
      if ((startDate === null) || (date.isBefore(startDate))) {
        startDate = date;
      }

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

  // week:  The date of the Monday of the week in which the new spots
  // begin
  const week = moment(startDate.subtract(((startDate.day() + 6) % 7), 'days'));

  $('#week').append(week.format('MM/DD/YYYY'));
  $('#spots').append(spots);

  $('#export').click(function () {
    for (const [network, script] of Object.entries(networks)) {
      if (script) {
        download(script, network + ' ' + week.format('YYYY-MM-DD') + '.sh', 'text/plain')
      }
    }
  });
});
