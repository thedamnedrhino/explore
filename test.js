const BASE_WAIT_TIME = 100;
const DEFAULT_TAB_URL = 'chrome://newtab/';
const urls = ['https://yahoo.com', 'https://facebook.com', 'https://google.com', 'https://cnn.com'];
var urlIndex = 0;
// these are the tabs that chrome opens
var initTabs = false;
var openUrls = [];
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
}

function cleanUp(){
    initTabs = false;
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

/**
 * @param list expectedUrls the urls that are already expected to be in the session. They will be updated accordingly by this function. They will be supplied to the `then` argument.
 */
function openSomeTabs(window, n, expectedUrls, then){
    var theUrls = [];
    for (var i = 0; i < n; i++){
        var url = urls[urlIndex++ % urls.length];
        expectedUrls.push(url);
        chrome.tabs.create({windowId: window.id, url: url}, (tab) => {openTabs[tab.id] = url; openTabIds.push(tab.id);});
    }
    _wait(() => assertWindowManipulationWorkedThen(window, expectedUrls, then), BASE_WAIT_TIME*10);
}

function closeSomeTabs(window, positions, expectedUrls, then){
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
        removeFromArray(sessionsUrls, url); // sessionsUrls has been removed. Must migrate to non-global state.
        removeFromArray(openTabs, tabId);
        delete openTabs[tabId];
    });
    _wait(then, positions.length*50);
}

function syncTabs(){}

function closeSession(window, then=() => {}, inMs=BASE_WAIT_TIME*10){
    _wait(() => chrome.windows.remove(window.id, () => {cleanUp(); then();}), inMs);
}

function startTheSessionAgain(){}

function makeSureTabsAreKeptTrackOf(expectedUrls, then, numberOfNewTabs){
    // we need to start the session again and check that
    // the tabs that are opened are right (in expected urls)
    // let's look at coreTest
    cleanUp();
    let afterStart = (window, tabs) => {
        sessionStarted(window, tabs);
        // check opentabs and expected urls
        _wait(() => {assertTabsAndExpectedUrlsMatch(tabs, expectedUrls, numberOfNewTabs);
            closeSession(window);
            then();});
    }
    _wait(() => startTheSession(afterStart), 1000);
}

function assertTabsAndExpectedUrlsMatch(openTabs, expectedUrls, expectedNumberOfNewTabs){
    console.log('ASSERTION!!!!');
    console.assert(Object.keys(openTabs).length  === expectedUrls.length, 'the lengths don\'t match, openTabs: %s, expectedUrls: %s', openTabs, expectedUrls);
    if (typeof expectedNumberOfNewTabs !== 'undefined'){
        console.assert(expectedUrls.length === expectedNumberOfNewTabs + newSessionsUrls.length, "We're not sure what we're expecting. Keeping bad track of it");
    }
    else{
        console.log('No Sanity Check for this Test');
    }
}

/**
 * This is NOT a function to see if the session functionality is working.
 * It is a meta-test function that is testing whether this test is manipulating the session's window correctly.
 */
function assertWindowManipulationWorkedThen(window, expectedUrls, then){
    chrome.tabs.query({windowId: window.id}, (tabs) => {
        assertTabsAndExpectedUrlsMatch(tabs, expectedUrls);
        then(expectedUrls);
    });
}

function finish(){}

test();

function test(){
    testOpen();
}
/**
 * This function opens a session, runs sessionStarted(), runs sessionManipulation, closes the session, and runs makeSureEverythingIsKeptTrackOf, and then finish().
 * sessionManipulation() must be in such a way that the global expectedUrls
 * would reflect the actual expectedUrls from the session.
 *
 * @param sessionManipulation function(window, afterManipulation) {... afterManipulation(expectedUrls);}
 *  this is run after the session is started. It should manipulate the session at will and run the afterManipulation callback with the urls that it expects the session to hold.
 *
 * @param numberOfNewTabs a sanity check to make sure we're actually testing something
 */
function coreTest(sessionManipulation, numberOfNewTabs){
    init();
    let then = (window, tabs) => {
        sessionStarted(window, tabs);
        let afterManipulation = (expectedUrls) => {
            closeSession(window, () => makeSureTabsAreKeptTrackOf(expectedUrls, _wait_(finish), numberOfNewTabs));
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
    });
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
    coreTest((window, then) => {
        openSomeTabs(window, 3, getEmptySessionTabs(), then);
    }, 3);
}

function testOpenClose(){
    function sessionManipulation(window, then){
        let afterOpen = (expectedUrls) => {
            closeSomeTabs(window, 2, expectedUrls, then);
        }
        openSomeTabs(window, 4, getEmptySessionTabs(), afterOpen);
    }
    coreTest(sessionManipulation, 2);
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

function getEmptySessionTabs(){
    return [...newSessionsUrls]
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
