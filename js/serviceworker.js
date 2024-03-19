// Event listener for when the extension icon is clicked
chrome.action.onClicked.addListener(async (tab) => {
  const productionTab = await chrome.tabs.create({ url: "../rivendell.html" });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: () => {
      return getSelection().toString();
    }
  }).then((selectedText) => {
    const msg = selectedText[0].result;
    chrome.tabs.sendMessage(productionTab.id, msg);
  });
});
