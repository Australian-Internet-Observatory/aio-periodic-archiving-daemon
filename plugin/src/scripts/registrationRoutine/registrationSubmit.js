import ext from '../utils/utilitiesCrossBrowser';
import storage from '../utils/utilitiesStorage';
import { getConfig } from '../config';

/*
	This function generates a UUID
*/
function uuidv4() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
		const r = Math.random() * 16 | 0;
		const v = c === 'x' ? r : (r & 0x3 | 0x8);
		return v.toString(16);
	});
}

/*
	This function collapses all sections of a page, revealing only the chosen section
*/
function collapseShow(thisPartialID, debounce) {
	setTimeout(()=>{
		const collapses = ["loading", "register", "registered", "error"]
		const collapsesToHide = collapses.filter(v => v !== thisPartialID);
		collapsesToHide.forEach(somePartialID => {
	  		$(`#container-${somePartialID}`).collapse("hide");
		});
		$(`#container-${thisPartialID}`).collapse("show");
	}, (debounce ? 500 : 0));
}

/*
	This function refreshes the registration page (to either the 'register', or 'registered' options)
*/
async function registrationPageRefresh() {
	return await new Promise((resolve, reject) => {
	  // Otherwise, we are actually sending data up
	  storage.get('hash_key', (this_hash_key_object)=>{
	  	console.log(this_hash_key_object);
		// If the plugin does not have a hash key...
		if (!this_hash_key_object.hash_key) {
				// The participant is not registered
				collapseShow("register");
			} else {
				// The participant is registered
				collapseShow("registered");

			}
		});
	});
}




/*
	This function submits a registration request for a new participant
*/
async function registrationSubmitRequest(thisRegistrationObject) {
	collapseShow("loading");
  	(new Promise((resolve, reject) => {
      	getConfig().then(config => {
			fetch(config.apiEndpoints.demographic, {
				method: 'POST',
				headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json'
				},
				body: JSON.stringify({
				"action" : "register",
				"registrationObject" : {...thisRegistrationObject, ...{"version" : ext.runtime.getManifest().version}}
				})
			}).then(response => {
				resolve(response.json());
			}).catch(error => {
				resolve(Object());
				console.log(error);
			});
		});
	})).then((responseObject)=> {
		if (responseObject.registrationSuccess) {
			collapseShow("registered", true);
			storage.set({'hash_key': thisRegistrationObject["uuid"] },()=>{
				// Then run the first search process
				var port = ext.runtime.connect(ext.runtime.id);
				port.postMessage({ action: "provoke-initial-search-process" });
			});
		} else {
			collapseShow("error", true);
		}
		console.log(responseObject);
  	});
}

/*
	This function creates a form collector function, used to retrieve and organize (into an object) the values of all inputs ascribed the className
*/
function createFormCollector(className) {
	return function collectValues() {
		const elements = document.querySelectorAll(
			`select.${className}, input.${className}[type="number"], input.${className}[type="text"]`
		);

		const result = {};

		elements.forEach(el => {
			const key = el.name || el.id || el.className || `unnamed_${Math.random().toString(36).substr(2, 5)}`;
			result[key] = el.value;
		});

		return result;
	};
}

/*
	This function attempts to prepare the registration to submit the registration details
*/
function registrationSubmit() {
	registrationSubmitForm.reportValidity();
	if (registrationSubmitForm.checkValidity()) {
		// Registratoin is submitted here
		const getDemographicFields = createFormCollector("demographic-field");
		var thisRegistrationObject = {
			"uuid" : uuidv4(),
			"demographic_details" : getDemographicFields()
		};
		registrationSubmitRequest(thisRegistrationObject);
		
	}
}

/*
	The main routine
*/
async function main() {

	registrationPageRefresh();

	const registrationSubmitForm = document.getElementById("registrationSubmitForm");
	registrationSubmitForm.addEventListener("submit", function(e) {
		e.preventDefault(); // prevent page reload
		registrationSubmit();
	});
}
window.addEventListener("load", () => {
	main();
});


