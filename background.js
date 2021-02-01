var WINDOW_SESSION_MAPPING = {}
var SESSION_WINDOW_MAPPING = {}

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse){
	console.log('MESSAGE received in BACK');
	console.log(message);
	switch (message.meta){
		case 'start session':
			startSession(message.data.name);
			break;
		default:
			console.log('DEFAULT is called');
			console.log(message.meta);
	}
});

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


function mapWindowToSession(window, sessionName){
	// limitation: only one window for a session
    // the limitation is realized on the double mapping below
    // if MULTIPLE WINDOWS are opened for a session
    // the effective one will be the LAST ONE TO BE OPENED
    WINDOW_SESSION_MAPPING[window.id] = sessionName
    SESSION_WINDOW_MAPPING[sessionName] = window.id

    console.log(WINDOW_SESSION_MAPPING);
}

function switchToWindow(window){
    chrome.windows.update(window.id, {focused: true}, (window) => {console.log(`changed focus to window ${window.id}`)});
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
                otherwiseThis();
            }
        });
    }
}


function switchToSession(name){
    //	todo
}
