document.getElementById("the_select").addEventListener("change", function() {
    var name = this.value;
    console.log('SELECT selected')
    console.log(name)
    if (name != '-'){
        chrome.runtime.sendMessage({meta: 'start session', data: {name: name}});
    }
});

