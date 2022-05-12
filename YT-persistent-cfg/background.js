try{
	// Fired when the highlighted or selected tabs in a window changes.
	chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) =>{
		if (changeInfo.status == "complete") {
			console.log(tabId)
			updatePageAction(tabId);
		}
	});

	// Fires when the active tab in a window changes. Note that the tab's URL may not be set at the time this event fired, but you can listen to onUpdated events so as to be notified when a URL is set.
	chrome.tabs.onActivated.addListener((activeInfo)=>{
		chrome.tabs.query({currentWindow: true, active : true},
			(tabArray) => {
				console.log(tabArray[0].id)
				updatePageAction(tabArray[0].id)
			}
		)
	});

	function updatePageAction(tabId){
		chrome.tabs.sendRequest(tabId, {is_content_script: true}, function(response) {
			if (response){
				console.log('YT persistent Cfg:',response, tabId)
			}
			// if (response.is_content_script)
				// chrome.pageAction.show(tabId);
		});
	};
}
catch{}

