// Event listener for when the extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.create({ url: "../rivendell.html" });
  chrome.scripting.executeScript({
    target: {tabId: tab.id},
    function: () => {
      return getSelection().toString();
    }
  }).then((selectedText) => {
    console.log(selectedText[0].result);
  });
});

// // Function to get selected text
// function getSelectedText() {
//   console.log("executing script");
//   // Get the selected text
//   const selectedText = window.getSelection().toString();
  
//   // Open a new tab with rivendell.html and pass the selected text as a parameter
//   chrome.tabs.create({ url: 'rivendell.html?text=' + encodeURIComponent(selectedText) });
// }
