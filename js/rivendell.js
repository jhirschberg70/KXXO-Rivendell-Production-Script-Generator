let adLarge = '';
let compass = '';
let premiere = '';
let sun = '';
let westwood = '';
let isciMap = new Map();
let cartMap = new Map();

function buildRivendell(cart, advertiser, name, isci) {
  return 'rdimport --delete-cuts --clear-datetimes --clear-daypart-times ' +
    '--to-cart=' + cart + ' ' +
    '--set-string-title=\"' + advertiser + '\" ' +
    '--set-string-client=\"' + advertiser + '\" ' +
    '--set-string-artist=\"' + name + '\" ' +
    'SPOTS *' + isci + '* &\nwait\n';
}

function download(data, fileName) {
  let a = document.createElement("a");
  a.download = fileName;
  a.href = "data:plain/txt charset=utf-8," + data;
  a.click();
}

$(function () {
  let week = null;

  $('#export').click(function () {
    let weekName = week.format('YYYY-MM-DD');

    // download(adLarge, 'AdLarge' + weekName + '.sh', 'text/plain');
    // download(sun, 'Sun' + weekName + '.sh', 'text/plain');
    // download(compass, 'Compass' + weekName + '.sh', 'text/plain');
    download(premiere, 'Premiere' + weekName + '.sh');
    download(westwood, 'Westwood' + weekName + '.sh');
  });

  chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    let records = msg.match(/\<Value\>.+\<\/Value\>/g);

    records.forEach(function (field, index) {
      field = field.replace(/\<Value\>/, '').replace(/\<\/Value\>/, '');
      records[index] = field;
    });

    let iscis = [];
    let tapes = '';
    let alertMsg = '';

    while (records.length) {
      let cart = '';
      let advertiser = '';
      let name = '';
      let expiration = '';
      let length = '';
      let isci = '';
      let station = '';

      cart = records.shift();
      advertiser = records.shift();
      name = records.shift();
      expiration = records.shift();
      length = records.shift();
      isci = records.shift();
      date = moment((records.shift()), 'MM/DD/YYYY');
      station = records.shift();


      iscis.push(isci);

      // A new spot has a +\s at the beginning of the name field
      // If the spot is new, we want to produce it.  Otherwise, we
      // can skip it.
      if (name.startsWith('+')) {

        // Strip leading +\s from name
        name = name.replace(/\+\s/, '');

        // If this is the first date being processed or the current
        // record's date is earlier than all previous dates, set
        // week = date;
        if ((week === null) || (date.isBefore(week))) {
          week = date;
        }

        // Check if ISCI codes/cart numbers are used multiple times
        if (isciMap.has(isci)) {
          alertMsg += 'Duplicate ISCI: ' + isci + '\n';
        }
        else {
          isciMap.set(isci, '');
        }

        if (cartMap.has(cart)) {
          alertMsg += 'Duplicate Cart: ' + cart + '\n';
        }
        else {
          cartMap.set(cart, '');
        }

        if (advertiser === 'AdLarge - NC') {
          adLarge += buildRivendell(cart, advertiser, name, isci);
        }

        if (advertiser === 'Compass - NC') {
          compass += buildRivendell(cart, advertiser, name, isci);
        }

        if (advertiser === 'Premiere - NC') {
          premiere += buildRivendell(cart, advertiser, name, isci);
        }

        if (advertiser === 'Sun Broadcasting - NC') {
          sun += buildRivendell(cart, advertiser, name, isci);
        }

        if (advertiser === 'Westwood One - NC - Nectar') {
          westwood += buildRivendell(cart, advertiser, name, isci);
        }

        tapes += '<tr><td>' + cart + '</td><td>' + advertiser + '</td><td>' + name + '</td><td>' + isci + '</td></tr>';
      }

      if (alertMsg) {
        alert(alertMsg);
        alertMsg = '';  // Clear the message so it isn't duplicated
      }
    }

    // week:  The date of the Monday of the week in which the new spots
    // begin
    week = moment(week.subtract(((week.day() + 6) % 7), 'days'));

    $('#week').append(week.format('MM/DD/YYYY'));
    $('#tapes').append(tapes);

    iscis.sort();

    let isciList = '';

    for (let index = 0; index < iscis.length; index++) {
      isciList += iscis[index] + '\n';
    }
  });
});
