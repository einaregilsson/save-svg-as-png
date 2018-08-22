var contextMenuId = chrome.contextMenus.create({
    title: "Save SVG as PNG...", 
    contexts:["page"], 
    onclick: function(info, tab) {
        chrome.tabs.sendMessage(tab.id, {}, function(response) {
            saveAsPng(response.svg);
        });
    }
});

chrome.browserAction.onClicked.addListener(function(tab) {
    chrome.tabs.sendMessage(tab.id, {}, function(response) {
        saveAsPng(response.svg);
    });
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (!changeInfo.url) {
        return;
    }
    setVisibility(changeInfo.url, tabId);
}); 
 
chrome.tabs.onActivated.addListener(function(activeInfo) {
    chrome.tabs.get(activeInfo.tabId, function(tab){
        setVisibility(tab.url, activeInfo.tabId);
    });
}); 

function setVisibility(url, tabId) {
    url = url.replace(/\?.*/, '');
    url = url.toLowerCase();
    var isSvg = !!url.match(/\.svg$/);
    chrome.contextMenus.update(contextMenuId, {visible:isSvg});
    if (isSvg) {
        chrome.browserAction.enable(tabId);
    } else {
        chrome.browserAction.disable(tabId);
    }
}

function saveAsPng(svgXml) {
    //Figure out width from viewBox...

    var viewbox = svgXml.match(/viewbox="(.*?)"/i);
    if (!viewbox) {
        alert('Error: failed to figure out width and height, can\'t save :(');
        return;
    }


    //Remove width and height so we can scale...
    var rootElement = svgXml.substr(0, svgXml.indexOf('>')+1);
    var restOfStuff = svgXml.substr(svgXml.indexOf('>')+1);
    rootElement = rootElement.replace(/ width=".*?"/, ' ').replace(/ height=".*?"/, ' ');
    svgXml = rootElement + restOfStuff;

    var parts = viewbox[1].split(/\s+/);
    var width = parseFloat(parts[2]);
    var height = parseFloat(parts[3]);

    var newWidth = prompt('Enter width (original width: ' + width.toFixed(1) + '): ', parseInt(width)+'');
    if (newWidth === null) {
        return; //Cancelled
    }

    if (!newWidth.match(/^\d+$/)) {
        alert('ERROR: Invalid width value.');
        return;
    }
    newWidth = parseInt(newWidth);

    var percentage = newWidth / width;

    var calculatedWidth = Math.ceil(percentage * width);
    var calculatedHeight = Math.ceil(percentage * height);
    var canvas = document.createElement('canvas');
    canvas.width = calculatedWidth;
    canvas.height = calculatedHeight;

    document.body.appendChild(canvas);
    var ctx = canvas.getContext('2d');
   
    // make it base64
    var svg64 = btoa(svgXml);
    var b64Start = 'data:image/svg+xml;base64,';

    // prepend a "header"
    var image64 = b64Start + svg64;

    var img = document.createElement('img');
    img.width = calculatedWidth;
    img.height = calculatedHeight;
    
    img.onload = function() {
        ctx.drawImage(img, 0, 0);
        var w = window.open('about:blank');
        w.document.write('<html><body><img style="display:block;margin:10px auto; box-shadow:gray 0 0 4px" src="' + canvas.toDataURL('image/png') + '" />' +
            '<p style="text-align:center; font-family:sans-serif;font-size:18px;">Right click on image and choose <strong>Save Image as...</strong> to save this image</p></body></html>');
        document.body.removeChild(canvas);
    };
    img.src = image64;
}