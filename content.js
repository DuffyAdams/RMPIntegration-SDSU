/*
Author: Aaron Edlebeck
Updated for new SDSU portal - On-Demand Version
*/

"use strict";

console.log("RMP Extension: Content script loaded!");

chrome.storage.local.get('checkBoxState', function (data) {
   console.log("RMP Extension: CheckBox state:", data.checkBoxState);
   if (data.checkBoxState == true) {
      setTimeout(() => {
         console.log("RMP Extension: Running program...");
         runProgram();
      }, 2000);
   }
});

// Listen for dynamic content changes
const observer = new MutationObserver((mutations) => {
   chrome.storage.local.get('checkBoxState', function (data) {
      if (data.checkBoxState == true) {
         runProgram();
      }
   });
});

setTimeout(() => {
   observer.observe(document.body, {
      childList: true,
      subtree: true
   });
}, 3000);

function getInstructorCells() {
   // Try multiple selectors
   let selectors = [
      'td[headers*="Instructor"]',
      'td[headers*="INSTRUCTOR"]',
      'td.Instructor',
      '[class*="Instructor"]',
      'td:nth-child(8)',
   ];
   
   for (let selector of selectors) {
      let cells = document.querySelectorAll(selector);
      if (cells.length > 0) {
         console.log(`RMP Extension: Found ${cells.length} instructor cells using selector: ${selector}`);
         return { cells, selector };
      }
   }
   
   return { cells: [], selector: null };
}

async function runProgram() {
   const { cells } = getInstructorCells();
   
   if (cells.length === 0) {
      console.log("RMP Extension: No instructor cells found");
      return;
   }
   
   console.log(`RMP Extension: Processing ${cells.length} instructor cells`);
   
   const processedNames = new Set();
   
   for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      const fullName = cell.innerText.trim();
      
      // Skip if empty, TBA, or already processed
      if (!fullName || fullName === 'TBA' || processedNames.has(fullName)) {
         continue;
      }
      
      console.log(`RMP Extension: Processing instructor: ${fullName}`);
      processedNames.add(fullName);
      
      // Format the storage key
      const nameParts = fullName.split(/\s+/);
      const firstName = nameParts[0];
      const lastName = nameParts[nameParts.length - 1];
      const storageKey = `${firstName.charAt(0)}. ${lastName}`.toUpperCase();
      
      // Check if we already have this data cached
      const cached = await chrome.storage.local.get(storageKey);
      
      if (cached[storageKey]) {
         console.log(`RMP Extension: Using cached data for ${storageKey}: ${cached[storageKey]}`);
         updateInstructorCells(fullName, cached[storageKey]);
      } else {
         console.log(`RMP Extension: No cached data, requesting from background script...`);
         
         // Request the background script to search for this professor
         chrome.runtime.sendMessage(
            { msg: "searchProfessor", name: fullName },
            function(response) {
               if (response) {
                  console.log(`RMP Extension: Received rating: ${response}`);
                  updateInstructorCells(fullName, response);
               } else {
                  console.log(`RMP Extension: No rating found for ${fullName}`);
               }
            }
         );
      }
   }
}

function updateInstructorCells(fullName, ratingData) {
   const { cells } = getInstructorCells();

   for (let cell of cells) {
      const cellText = cell.innerText.trim();

      if (cellText === fullName) {
         let displayText;
         let ratingColor = '#4A90E2'; // Default blue

         if (ratingData && ratingData !== "N/A") {
            const parts = ratingData.split(' - ');
            const rating = parseFloat(parts[0]);
            const numReviews = parts[1] || '0';

            // Color code based on rating
            if (rating >= 4.0) {
               ratingColor = '#28a745'; // Green for very good
            } else if (rating >= 3.0) {
               ratingColor = '#ffc107'; // Yellow for okay
            } else if (rating >= 2.0) {
               ratingColor = '#fd7e14'; // Orange for poor
            } else if (rating >= 1.0) {
               ratingColor = '#dc3545'; // Red for very bad
            }

            displayText = `${fullName} (<span style="color: ${ratingColor}; font-weight: bold;">${parts[0]}</span> | ${numReviews} reviews)`;
         } else {
            displayText = `${fullName} (${ratingData})`;
         }

         // Add some styling
         cell.innerHTML = `<span style="font-weight: 500;">${displayText}</span>`;
         console.log(`RMP Extension: Updated cell with: ${displayText}`);
      }
   }
}
