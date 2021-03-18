const BASE_WAIT_TIME = 100;
const DEFAULT_TAB_URL = 'chrome://newtab/';
const urls = ['https://yahoo.com', 'https://facebook.com', 'https://google.com', 'https://cnn.com'];
var urlIndex = 0;
// these are the tabs that chrome opens
var initTabs = false;
var sessionWindowId = null;
var sessionWindow = null;
var openUrls = [];
var sessionsUrls = [];
const newSessionsUrls = [DEFAULT_TAB_URL];
var openTabs = {}
var openTabIds = []

var counter = 1;
console.log('test was imported*******', counter++);

function init(){
    SESSION_DATA_KEY = 'TEST';
    persist(SESSION_DATA_KEY, {})
    cleanUp();
    urlIndex = 0;
    // the vars above and below don't go into cleanUp. cleanUp cleans
    // the data related to the the session's window (not the session itself)
    sessionsUrls = [];
}

function cleanUp(){
    initTabs = false;
    sessionWindowId = null;
    sessionWindow = null;
    openUrls = [];
    openTabs = {};
}

function startTheSession(thenWhat){
    let then = (window) => {
        chrome.tabs.query({windowId: window.id}, (tabs) => thenWhat(window, tabs));
        }
    startSession('test', then);/*
    var salam = 'salam';
    let callback = () => {
        sessionWindowId = getSessionWindow('test');
    var tabs = false;
        chrome.windows.get(sessionWindowId, {}, (window) => {console.log('WINDOW', window); theWindow = window; tabs = window.tabs; sessionWindow = window;});
        let callback2 = () => {
            console.log(salam);
            console.log('HERE IS WHAT WE GOT', sessionWindowId, openUrls, tabs);
            if (tabs === false){
                console.log('ERRRRRRROR -- TABS IS FALSE')
            }
            initTabs = tabs.length;
            if (tabs){
                openUrls = tabs.map((tab) => tab.url);
            }
        }
        _wait(callback2);
    }
    _wait(callback);*/
}

function openSomeTabs(n, then){
    var theUrls = [];
    for (var i = 0; i < n; i++){
        var url = urls[urlIndex++ % urls.length];
        sessionsUrls.push(url);
        chrome.tabs.create({windowId: sessionWindowId, url: url}, (tab) => {openTabs[tab.id] = url; openTabIds.push(tab.id);});
    }
    _wait(then, BASE_WAIT_TIME*10);
}

function closeSomeTabs(positions, then){
    if (!positions.length){
        //assuming it's an integer at this point and not a list
        if (positions > openTabIds.length){
            throw 'not that many tabs open:', openTabIds.length, positions
        }
        for (var i = 0; i < positions; i++){
            positions.push(openTabIds.length - 1 - i);
        }
        positions = [];
    }
    const tabIds = positions.map((i) => openTabIds[i]);
    chrome.tabs.remove(tabIds);
    //sort positions in descending order so we don't have to deal with changing indexes
    positions.sort((a, b) => b - a);
    positions.forEach((i, index) => {
        const tabId = openTabIds[index];
        const url = openTabs[tabId];
        removeFromArray(sessionsUrls, url);
        removeFromArray(openTabs, tabId);
        delete openTabs[tabId];
    });
    _wait(then, positions.length*50);
}

function syncTabs(){}

function closeSession(then, inMs=BASE_WAIT_TIME*10){
    _wait(() => chrome.windows.remove(sessionWindowId, () => {cleanUp(); then();}), inMs);
}

function startTheSessionAgain(){}

function makeSureTabsAreKeptTrackOf(then, numberOfNewTabs){
    // we need to start the session again and check that
    // the tabs that are opened are right (in expected urls)
    // let's look at coreTest
    const expectedUrls = sessionsUrls;
    cleanUp();
    sessionsUrls = [];
    let afterStart = (window, tabs) => {
        sessionStarted(window, tabs);
        // check opentabs and expected urls
        _wait(() => {assertOpenTabsAndExpectedUrlsMatch(expectedUrls, numberOfNewTabs);
            then();});
    }
    _wait(() => startTheSession(afterStart), 1000);
}

function assertOpenTabsAndExpectedUrlsMatch(expectedUrls, numberOfNewTabs){
    console.log('ASSERTION!!!!');
    console.assert(Object.keys(openTabs).length  === expectedUrls.length, 'the lengths don\'t match, openTabs: %s, sessionsUrls: %s', openTabs, expectedUrls);
    if (typeof numberOfNewTabs !== 'undefined'){
        console.assert(expectedUrls.length === numberOfNewTabs + newSessionsUrls.length);
    }
    else{
        console.log('No Sanity Check for this Test');
    }
}

function finish(){}

test();

function test(){
    testOpen();
}
/**
 * @param a sanity check to make sure we're actually testing something
 */
function coreTest(sessionManipulation, numberOfNewTabs){
    init();
    let then = (window, tabs) => {
        sessionStarted(window, tabs);
        let afterManipulation = () => {
            closeSession(() => makeSureTabsAreKeptTrackOf(_wait_(finish), numberOfNewTabs));
        }
        sessionManipulation(window, afterManipulation);
    };
    startTheSession(then);
}

function sessionStarted(window, tabs, firstTime = true){
    initTabs = tabs.length;
    tabs.forEach((tab) => {
        const url = tab.url || tab.pendingUrl;
        openTabIds.push(tab.id);
        openTabs[tab.id] = url;
        /*I will hardcode an empty session's initial tabs on startup. If we look at them and save them, this will make it difficult for multiple session starts. This block was replaced by the block below
            sessionsUrls.push(url);*/
    });
    if (firstTime)
        sessionsUrls = [...newSessionsUrls];
    sessionWindowId = window.id;
}

function coreTestWithMultipleStarts(sessionManipulations){
    init();
    manipulations.each((manipulation) => {
        startTheSession();
        manipulation();
        closeSession();
    });
    makeSureTabsAreKeptTrackOf();
    finish();
}

function testOpen(){
    coreTest((window, then) => openSomeTabs(3, then), 3);
}

function testOpenClose(){
    coreTest((window, then) => { openSomeTabs(4, () => closeSomeTabs(2, then))});
}

function testMultipleStarts(){
    const firstManipulation = () => {
        openSomeTabs(2);
    };
    const secondManipulation = () => {
        openSomeTabs(2);
        closeSomeTabs([1, 4]);
    };
    coreTestWithMultipleStarts([firstManipulation, secondManipulation]);
}

function _wait(callback, ms=BASE_WAIT_TIME*3){
    setTimeout(callback, ms);
}

function _wait_(callback, ms=BASE_WAIT_TIME*3){
    return () => _wait(callback, ms);
}

function removeFromArray(arr, e){
    const i = arr.indexOf(e);
    if (!(i >= 0 && i < arr.length)){
        throw arr, ' does not have ', e;
    }
    arr.splice(i, 1);
}
