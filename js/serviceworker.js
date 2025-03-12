chrome.action.onClicked.addListener(async (tab) => {
  const message = await createMessage(tab);
  const productionTab = await createTab("../rivendell.html");

  chrome.tabs.sendMessage(productionTab.id, message);
});

async function createMessage(tab) {
  return new Promise(async (resolve, reject) => {
    const xml = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: () => {
        return document.querySelector("CrystalReport").innerHTML;
      }
    });
    
    resolve(xml[0].result);
  });
}

async function createTab(url) {
  return new Promise((resolve, reject) => {
    chrome.tabs.create({ url: url }, (tab) => {
      if (tab.status === "complete") {
        resolve(tab);
      } else {
        chrome.tabs.onUpdated.addListener(updateListener = (tabId, changeInfo) => {
          if ((tab.id === tabId) && (changeInfo.status === "complete")) {
            chrome.tabs.onUpdated.removeListener(updateListener);
            resolve(tab);
          }
        });
      }
    });
  });
}