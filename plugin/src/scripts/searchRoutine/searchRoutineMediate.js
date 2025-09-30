import ext from '../utils/utilitiesCrossBrowser';
import storage from '../utils/utilitiesStorage';
import { LOCAL_DEBUG, CONST_MANIFEST_VERSION_INTEGER, getConfig } from '../config';
import SearchRoutine from '../searchRoutine/searchRoutineMain';

// This action mediates the search process to ensure that the page has been invoked correctly
var port = ext.runtime.connect(ext.runtime.id);
port.postMessage({ action: "mediate-search-routine" });

// This function recursively polls the service worker while the search process is taking place
function recursivelyRegisterServiceWorker() {
	// Attempt to register the service worker (if it is not already registered)
	if ('serviceWorker' in navigator) {
		navigator.serviceWorker.register('../background.js').then(function(registration) {
			// Registration was successful
			if (LOCAL_DEBUG) { console.log('ServiceWorker registration successful with scope: ', registration.scope); }
		}, function(err) {
			// registration failed :(
			if (LOCAL_DEBUG) { console.log('ServiceWorker registration failed: ', err); }
		});
	}
	setTimeout(function() { recursivelyRegisterServiceWorker(); }, );
}

// Implement service worker for manifest version >= 3
if (CONST_MANIFEST_VERSION_INTEGER >= 3) {
	recursivelyRegisterServiceWorker();
}

function checkSearchProcessPulse() {
	// If there is no activity for longer than twice the search page interval, kill the search process.
	if (LOCAL_DEBUG) {  console.log("Executing a search process pulse..."); }
	storage.get("searchRoutinePulse", (result) => {
		if ('searchRoutinePulse' in result) {
			getConfig().then(config => {
				var pulseValue = 0;
				try { 
					pulseValue = parseInt(result.searchRoutinePulse);
				} catch (e) { 
					if (LOCAL_DEBUG) { console.log("The search process is ending early due to a dead pulse error."); }
	                SearchRoutine.searchRoutineCleanUp();
	            }
				if (((+new Date()) - pulseValue) > (config.constants.searchProcessInterval*config.constants.maxTimesToRunPerDay)) {
					// Kill the process
	                if (LOCAL_DEBUG) { console.log("The search process is ending early due to a dead pulse error."); }
	                SearchRoutine.searchRoutineCleanUp();
				}

				if (LOCAL_DEBUG) { 
					console.log("Pulse value:",pulseValue," | Current Date:", (+new Date()), " | Difference:", ((+new Date()) - pulseValue));
					console.log("Search process interval:", (config.constants.searchProcessInterval*config.constants.maxTimesToRunPerDay));
				}

				setTimeout(checkSearchProcessPulse, config.constants.timeMillisecondsCheckTimerValue);
			});
		}
	});
}

checkSearchProcessPulse();

