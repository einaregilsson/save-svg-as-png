chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        sendResponse({svg: document.documentElement.outerHTML});
    }
);