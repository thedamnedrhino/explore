var WINDOW_SESSION_MAPPING = {};
var SESSION_WINDOW_MAPPING = {};
var SESSION_DATA = {};
const SESSION_DATA_KEY = 'SESSION-DATA';

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse){
	//console.log('MESSAGE received in BACK');
	//console.log(message);
	switch (message.meta){
		case 'start session':
			startSession(message.data.name);
			break;
		default:
			console.log('DEFAULT is called');
			console.log(message.meta);
	}
});

/*chrome.windows.onRemoved.addListener((windowId) => {
    // check if the window is associated with the session
    sessionName = getWindowSession(windowId);
    if(sessionName != null){
        // get the window instance
        chrome.windows.get(windowId, {}, (window) => {
        // save the session's tabs in storage
            saveSessionWindow(sessionName, window);
        // can we retrieve a window's tabs after it's been closed??
            // NOOOOO

        });
    }
});*/

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    //console.log('tab updated listener called:');
    //console.log(changeInfo);
    // only listen to loading event for now -- this is when a new url is loading
    if (changeInfo.status != 'loading' || !changeInfo.url) return;
    session = getSessionForTab(tab);
    /*console.log('changeInfo', changeInfo);
    console.log('session for tab:');
    console.log(session);*/
    if (!session){
        // tab is not in a session, nothing to do
        return;
    }
    const newUrl = changeInfo.url;
    if (newUrl){
        updateSessionItemUrl(session, tab, newUrl);
    }

});


function getSessionForTab(tab){
    return getWindowSession(tab.windowId);
}

function updateSessionItemUrl(sessionName, tab, url){
    SESSION_DATA[sessionName] = SESSION_DATA[sessionName] || {};
    SESSION_DATA[sessionName][tab.id] = url;
   // console.log('SESSION_DATA, session name, tab.id, url');
   // console.log(SESSION_DATA, sessionName, tab.id, url);
}

/*chrome.runtime.onInstalled.addListener(function() {
  chrome.storage.sync.set({color: '#3aa757'}, function() {
    console.log("The color is green.");
  });
});
console.log('hola');
*/

function startSession(name){
    thereIsASession(name, (window) => {switchToWindow(window)}, () => {createSessionWindow(name);});
}

function createSessionWindow(name){
	chrome.windows.create({}, (window) => {
		mapWindowToSession(window, name);
		switchToWindow(window);
	});

}

/*function saveSessionWindow(sessionName, window){
    var key = 'SESSION-' + sessionName;
    chrome.storage.local.get(key, (sessionData) => {
        console.log('Session RETRIEVED');
        console.log(sessionData);
        sessionData['window'] = window;
        chrome.storage.local.set({key: sessionData}, () => {
            console.log('Session SAVED');
            console.log(key);
            console.log(sessionData);
        });
    });
}
*/
function mapWindowToSession(window, sessionName){
	// limitation: only one window for a session
    // the limitation is realized on the double mapping below
    // if MULTIPLE WINDOWS are opened for a session
    // the effective one will be the LAST ONE TO BE OPENED
    WINDOW_SESSION_MAPPING[window.id] = sessionName
    SESSION_WINDOW_MAPPING[sessionName] = window.id
    console.log('Mapped window to session. Window session mapping:');
    console.log(WINDOW_SESSION_MAPPING);
}

function getWindowSession(windowId){
    console.log('Getting session for window. WINDOW SESSION MAP:')
    console.log(WINDOW_SESSION_MAPPING, windowId, windowId in WINDOW_SESSION_MAPPING);
    return windowId in WINDOW_SESSION_MAPPING ? WINDOW_SESSION_MAPPING[windowId] : null;
}

function switchToWindow(window){
    chrome.windows.update(window.id, {focused: true}, (window) => {});
}

function thereIsASession(name, executeThisWithWindow, otherwiseThis){
    if (!(name in SESSION_WINDOW_MAPPING)){
        otherwiseThis();
    }
    else {
        chrome.windows.get(SESSION_WINDOW_MAPPING[name], (window) => {
            if(window){
                executeThisWithWindow(window);
            }
            else{
                console.log('EXECUTED WITHOUT WINDOW');
                otherwiseThis();
            }
        });
    }
}
