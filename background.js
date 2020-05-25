const CREATE_SHADOWDOM = "CREATE_SHADOWDOM";
const OPEN_POPUP = "OPEN_POPUP";
const LETS_START_FOLLOWING = "LETS_START_FOLLOWING"
const START_FOLLOWING = "START_FOLLOWING";
const LETS_START_UNFOLLOWING = "LETS_START_UNFOLLOWING"
const START_UNFOLLOWING = "START_UNFOLLOWING";
const LETS_STOP = "LETS_STOP";
const SHOW_PAGE_ACTION = "SHOW_PAGE_ACTION";

let site = {};
let state, noOfPages = 0, maxNumberOfPages = 1

chrome.pageAction.onClicked.addListener(tab => {
    chrome.tabs.sendMessage(tab.id, { reason: OPEN_POPUP })
    return true;
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.reason === LETS_START_FOLLOWING) {
        maxNumberOfPages = message.maxNumberOfPages;
        state = START_FOLLOWING;
        noOfPages = noOfPages + 1
        sendResponse(true)
    } else if (message.reason === LETS_START_UNFOLLOWING) {
        maxNumberOfPages = message.maxNumberOfPages;
        state = START_UNFOLLOWING;
        noOfPages = noOfPages + 1;
        sendResponse(true);
    } else if (message.reason === LETS_STOP) {
        state = null
        noOfPages = 0
        sendResponse(true)
    } else if (message.reason === SHOW_PAGE_ACTION) {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.pageAction.show(tabs[0].id);
        });
    } 
    return true;
})

chrome.tabs.onUpdated.addListener((tabId, info, tab) => {
    if (info && info['status'] === "complete") {
        
        if ((state === START_FOLLOWING || state === START_UNFOLLOWING) &&
            noOfPages < maxNumberOfPages
        ) {
            noOfPages = noOfPages + 1;
            chrome.tabs.sendMessage(tabId, { reason: state });
        } else {
            state = null
            noOfPages = 0
            chrome.tabs.sendMessage(tabId, { reason: CREATE_SHADOWDOM });
            chrome.tabs.sendMessage(tabId, { reason: OPEN_POPUP });
        }   
    }
    return true;
})