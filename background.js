chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (changeInfo.status === "complete") {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, "").catch(() => { });
    });
  }
});

chrome.action.onClicked.addListener(function (tab) {
  chrome.tabs.create({ url: "http://pontoeletronico.capgv.intra.bnb/pontoweb", active: true });
});