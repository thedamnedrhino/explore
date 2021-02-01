var WINDOW_SESSION_MAPPING = {}
var STACK = [1];

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
    if(thereIsNoSession(name)){
        createSessionWindow(name);
	 }
    else{
        switchToSessionWindow(name);
    }
}

function createSessionWindow(name){
	chrome.windows.create({}, (window) => {
		mapWindowToSession(window, name);
		switchToWindow(window);
	});

}


function mapWindowToSession(window, sessionName){
	// todo limitation
    WINDOW_SESSION_MAPPING[window.id] = sessionName
    console.log(WINDOW_SESSION_MAPPING);
}


function switchToSessionWindow(session_name){

}

function switchToWindow(window){
    chrome.windows.update(window.id, {focused: true}, (window) => {console.log(`changed focus to window ${window.id}`)})
}

function thereIsNoSession(name){
    //	todo
    return true;
}


function switchToSession(name){
    //	todo
}
