// {windowId: sessionName } - no extra keys (closed windows are removed)
var WINDOW_SESSION_MAPPING = {};
// {sessionName: windowId} - no extra keys (closed sessions are removed)
var SESSION_WINDOW_MAPPING = {};
// we need the below in addition to session_window_mapping to handle tab detach event
// {tabId: sessionName} - might contain tabs with inactive sessions
var TAB_SESSION_MAPPING = {};
// {sessionName: {tabId: url}} - no extra keys (closed sessions are removed)
var SESSION_DATA = {};
var SESSION_DATA_KEY = 'SESSION-DATA';

// persist some data fixtures to test the startup functionality
chrome.runtime.onInstalled.addListener(() => persist(SESSION_DATA_KEY, {'test session 2': ['https://yahoo.com', 'https://facebook.com']}));

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

chrome.windows.onRemoved.addListener((windowId) => windowClosed(windowId));

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

chrome.tabs.onCreated.addListener((tab) => setTimeout(() => {
    //console.log('onCreatedFired');
    addTabToItsWindowsSession(tab);
}, 100));

chrome.tabs.onAttached.addListener((tab, attachInfo) => {
    addTabToWindowsSession(tab, attachInfo.windowId);
});

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
    if(!removeInfo.isWindowClosing){
        removeTabFromItsSession(tabId);
    }
});


chrome.tabs.onDetached.addListener((tabId, detachInfo) => {
    removeTabFromItsSession(tabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => setTimeout(() => {
    //console.log('tab updated listener called:');
    //console.log(changeInfo);
    // only listen to loading event for now -- this is when a new url is loading
    //console.log('updated fired');
    if (changeInfo.status != 'loading' || !changeInfo.url) return;
    //console.log('RUNNING UPDATED');
    //console.log(changeInfo.url);
    // fix this to take of new tabs
    sessionName = TAB_SESSION_MAPPING[tabId];
    //console.log(sessionName);
    /*console.log('changeInfo', changeInfo);
    //console.log('session for tab:');
    //console.log(session);*/
    if (!sessionName){
        // tab is not in a session, nothing to do
        return;
    }

    SESSION_DATA[sessionName][tabId] = changeInfo.url;
    persistSession(sessionName);
    //console.log(SESSION_DATA);
}, 200));

function removeTabFromItsSession(tabId){
    // we want to remove this tab from its relevant session (if it has one):
    const tabSession = TAB_SESSION_MAPPING[tabId];
    if (!tabSession) return;
    // 1. remove it from the tab session mapping
    delete TAB_SESSION_MAPPING[tabId];
    // 2. remove it from the session data
    delete SESSION_DATA[tabSession][tabId];
    persistSession(tabSession);
    //console.log('DELETED SESSION DATA OF TAB');
}

function addTabToItsWindowsSession(tab){
    addTabToWindowsSession(tab, tab.windowId);
}

function addTabToWindowsSession(tab, windowId){
        const sessionName = WINDOW_SESSION_MAPPING[windowId];
        // do nothing if
        if (!sessionName) return;
        // add to tab session mapping
        TAB_SESSION_MAPPING[tab.id] = sessionName;
        // add to the session url mapping
        SESSION_DATA[sessionName][tab.id] = tab.url;
        persistSession(sessionName);
}


/*function updateSessionItemUrl(sessionName, tab, url){
    // KEPT FOR LATER REFACTOR
    SESSION_DATA[sessionName] = SESSION_DATA[sessionName] || {};
    SESSION_DATA[sessionName][tab.id] = url;
   // console.log('SESSION_DATA, session name, tab.id, url');
   // console.log(SESSION_DATA, sessionName, tab.id, url);
}*/
function startSession(name, then){
    console.log(then ? 'TRUE' : 'FALSE')
    then = then ? then : () => {};
    thereIsASession(name, (window) => {switchToWindow(window); then(window);}, () => {startNewSession(name, then);});
}


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


function startNewSession(name, then){
    SESSION_DATA[name] = {};
    createSessionWindow(name, then);
}

function createSessionWindow(sessionName, then){
    then = then ? then : () => {};
    const callback = (urls) => {
        chrome.windows.create({url: urls}, (window) => {
            mapWindowToSession(window, sessionName);
            switchToWindow(window);
            then(window);
        });
    }
    executeWithPersistedSessionUrls(sessionName, callback);
}

function windowClosed(windowId){
    const sessionName = getWindowSession(windowId);
    stopSession(sessionName);
}


function stopSession(sessionName){
    persistSession(sessionName);
    removeWorkingSessionData(sessionName);
}


function removeWorkingSessionData(sessionName){
    delete WINDOW_SESSION_MAPPING[SESSION_WINDOW_MAPPING[sessionName]];
    delete SESSION_WINDOW_MAPPING[sessionName];
    delete SESSION_DATA[sessionName];
}

function getSessionWindow(sessionName){
    return sessionName in SESSION_WINDOW_MAPPING ? SESSION_WINDOW_MAPPING[sessionName] : false;
}

function getWindowSession(windowId){
    //console.log('Getting session for window. WINDOW SESSION MAP:')
    //console.log(WINDOW_SESSION_MAPPING, windowId, windowId in WINDOW_SESSION_MAPPING);
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
                //console.log('EXECUTED WITHOUT WINDOW');
                otherwiseThis();
            }
        });
    }
}


function persistSession(sessionName){

    const data = SESSION_DATA[sessionName];
    // persist a list of urls for now
    retrieve(SESSION_DATA_KEY, (sessionData) => {
        console.log('SESSION NAMEEEEEE', sessionName);
        sessionData[sessionName] = Object.values(data);
        persist(SESSION_DATA_KEY, sessionData);
    });
}

function executeWithPersistedSessionUrls(sessionName, callback){

    retrieve(SESSION_DATA_KEY, (urls) => {
        console.log('URLS*****', urls);
        callback(urls[sessionName]);
    });
}

function persist(key, value){
    var data = {};
    data[key] = value;
    chrome.storage.local.set(data);
}

function retrieve(key, callback){
    chrome.storage.local.get(key, (result) => callback(result[key]));
}
