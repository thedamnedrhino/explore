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

chrome.runtime.onInstalled.addListener(function() {
  chrome.storage.sync.set({color: '#3aa757'}, function() {
    console.log("The color is green.");
  });
});
console.log('hola');
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
	chrome.storage.local.get(['window-session mapping'], (result) => {
		console.log('RESULT');
		console.log(result);
		var mapping = result['window-session mapping'] ? result['window-session mapping'] : {};
		console.log('GOT mapping');
		console.log(mapping)
		mapping[window.id] = sessionName;
		chrome.storage.local.set({'window-session mapping': mapping}, () => {
			console.log('SET mapping');
			console.log(mapping);
		});
	});
}

function switchToWindow(window){
// TODO
}

function thereIsNoSession(name){
    //	todo
    return true;
}


function switchToSession(name){
    //	todo
}
