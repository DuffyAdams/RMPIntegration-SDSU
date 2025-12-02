/*
Author: Aaron Edlebeck
Updated for new SDSU portal
*/

document.addEventListener('DOMContentLoaded', function() { 
   restoreState();
   document.getElementById("switch1").addEventListener('click', checkBoxFunction);
   document.getElementById("button1").addEventListener('click', updateButton);
});

function checkBoxFunction() {
   if (document.getElementById('switch1').checked == true) {
      set('checkBoxState', true);
      chrome.tabs.query({active: true, lastFocusedWindow: true}, tabs => {
         let url = tabs[0].url;
         url.toString();
         // Updated to match new SDSU portal URL pattern
         if (url.includes("cmsweb.cms.sdsu.edu")) {
            chrome.tabs.update(tabs[0].id, {url: tabs[0].url});
         };
     });
   } else {
      set('checkBoxState', false);
      chrome.tabs.query({active: true, lastFocusedWindow: true}, tabs => {
         let url = tabs[0].url;
         url.toString();
         // Updated to match new SDSU portal URL pattern
         if (url.includes("cmsweb.cms.sdsu.edu")) {
            chrome.tabs.update(tabs[0].id, {url: tabs[0].url});
         };
     });
   }
}

function updateButton() {
   chrome.runtime.sendMessage({msg: "update"});
}

function restoreState () {
   chrome.storage.local.get({'checkBoxState' : false}, function (data) {
      document.getElementById("switch1").checked = data.checkBoxState;
   })
}

function set(key, value) {
   var dataObj = {};
   dataObj[key] = value;
   chrome.storage.local.set(dataObj, function () {
      console.log("Set value in storage: " + JSON.stringify(dataObj));
   });
}