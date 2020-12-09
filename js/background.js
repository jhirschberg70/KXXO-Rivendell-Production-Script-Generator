var productionTabID = 0;
var msg = '';

chrome.browserAction.onClicked.addListener(function(){
  chrome.tabs.executeScript({
    code: 'window.getSelection().toString();'
  }, function(selection){
    msg=selection[0];
    chrome.tabs.create({url:'rivendell.html'}, function(tab){
      productionTabID = tab.id;
    });
  });
});

chrome.tabs.onUpdated.addListener(function(tab, info) {
  if ((tab===productionTabID) && (info.status==='complete')){
    chrome.tabs.sendMessage(productionTabID, msg, function (response){productionTabID = 0;});
  }
});
