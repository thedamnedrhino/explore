document.getElementById("the_select").addEventListener("change", function() {
    var name = this.value;
    console.log('SELECT selected');
    console.log(name);
    if (name != '-'){
        chrome.runtime.sendMessage({meta: 'start session', data: {name: name}});
    }
});

document.getElementById("create_session").addEventListener("click", function() {
    var name = document.getElementById("new_session_name").value;
    if (!name)
        return;

    chrome.runtime.sendMessage({meta: 'create session', data: {name: name}});
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.meta == 'session list'){
        setSessionList(message.data);
    }
});


function setSessionList(sessions){
    const select = document.getElementById('the_select');
    select.innerHTML = '';
    sessions.unshift('-');
    sessions.forEach(sessionName => {
        const o = document.createElement('option');
        o.appendChild(document.createTextNode(sessionName));
        o.value = sessionName;
        select.appendChild(o);
    });
}
