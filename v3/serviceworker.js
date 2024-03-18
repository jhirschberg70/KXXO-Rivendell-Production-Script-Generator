// Event listener for when the extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
  // chrome.tabs.create({ url: "rivendell.html" });
  chrome.scripting.executeScript({
    target: {tabId: tab.id},
    function: () => {
      // chrome.tabs.create({ url: "rivendell.html" });
      alert(getSelection().toString());
    }
  });
});

// Function to get selected text
function getSelectedText() {
  console.log("executing script");
  // Get the selected text
  const selectedText = window.getSelection().toString();
  
  // Open a new tab with rivendell.html and pass the selected text as a parameter
  chrome.tabs.create({ url: 'rivendell.html?text=' + encodeURIComponent(selectedText) });
}
