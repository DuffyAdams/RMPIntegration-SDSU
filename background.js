/*
Author: Aaron Edlebeck
Using RMP's internal GraphQL API directly
*/

"use strict";

console.log("RMP Extension: Background script loaded!");

chrome.runtime.onInstalled.addListener(function() {
   console.log("RMP Extension: Extension installed/updated");
   set('Enabled', 1);
   set('checkBoxState', true);
   console.log("RMP Extension: Ready!");
});

chrome.runtime.onMessage.addListener(
   function(request, sender, sendResponse) {
      if (request.msg == "update") {
         console.log("RMP Extension: Manual update requested");
      } else if (request.msg == "searchProfessor") {
         console.log("RMP Extension: Searching for professor:", request.name);
         searchAndCacheProfessor(request.name).then(result => {
            sendResponse(result);
         }).catch(error => {
            console.error("RMP Extension: Error in search:", error);
            sendResponse(null);
         });
         return true;
      }
   }
)

async function searchAndCacheProfessor(fullName) {
   try {
      const nameParts = fullName.trim().split(/\s+/);
      const firstName = nameParts[0];
      const lastName = nameParts[nameParts.length - 1];
      const storageKey = `${firstName.charAt(0)}. ${lastName}`.toUpperCase();
      
      console.log(`RMP Extension: Searching for ${fullName}`);
      console.log(`RMP Extension: Storage key: ${storageKey}`);
      
      // Use RMP's GraphQL API directly
      const query = {
         query: `query NewSearchTeachersQuery($text: String!) {
            newSearch {
               teachers(query: {text: $text, schoolID: "U2Nob29sLTg3Nw=="}) {
                  edges {
                     node {
                        id
                        firstName
                        lastName
                        school {
                           name
                           id
                        }
                        avgRating
                        numRatings
                        wouldTakeAgainPercent
                        avgDifficulty
                     }
                  }
               }
            }
         }`,
         variables: {
            text: fullName
         }
      };
      
      console.log(`RMP Extension: Sending GraphQL query for "${fullName}"`);
      
      const response = await fetch('https://www.ratemyprofessors.com/graphql', {
         method: 'POST',
         headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic dGVzdDp0ZXN0'
         },
         body: JSON.stringify(query)
      });
      
      console.log(`RMP Extension: Response status: ${response.status}`);
      
      if (!response.ok) {
         console.error(`RMP Extension: GraphQL request failed: ${response.status}`);
         
         // If GraphQL fails, try the legacy approach
         console.log(`RMP Extension: Trying fallback method...`);
         return await fallbackSearch(fullName, firstName, lastName, storageKey);
      }
      
      const data = await response.json();
      console.log(`RMP Extension: GraphQL response:`, JSON.stringify(data, null, 2));
      
      if (data.errors) {
         console.error(`RMP Extension: GraphQL errors:`, data.errors);
         return await fallbackSearch(fullName, firstName, lastName, storageKey);
      }
      
      const teachers = data.data?.newSearch?.teachers?.edges;
      
      if (!teachers || teachers.length === 0) {
         console.log(`RMP Extension: No teachers found, trying last name only...`);
         
         // Try with just last name
         const lastNameQuery = {
            query: query.query,
            variables: { text: lastName }
         };
         
         const response2 = await fetch('https://www.ratemyprofessors.com/graphql', {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
               'Authorization': 'Basic dGVzdDp0ZXN0'
            },
            body: JSON.stringify(lastNameQuery)
         });
         
         if (response2.ok) {
            const data2 = await response2.json();
            const teachers2 = data2.data?.newSearch?.teachers?.edges;
            
            if (teachers2 && teachers2.length > 0) {
               const match = teachers2[0].node;
               console.log(`RMP Extension: Found with last name: ${match.firstName} ${match.lastName}`);
               
               const rating = match.avgRating ? match.avgRating.toFixed(1) : "N/A";
               const numRatings = match.numRatings || 0;
               const ratingString = `${rating} - ${numRatings}`;
               
               set(storageKey, ratingString);
               return ratingString;
            }
         }
         
         console.log(`RMP Extension: No results found`);
         set(storageKey, "N/A");
         return null;
      }
      
      // Found results - use the first match
      const match = teachers[0].node;
      console.log(`RMP Extension: Found teacher: ${match.firstName} ${match.lastName}`);
      console.log(`RMP Extension: Rating: ${match.avgRating}, Reviews: ${match.numRatings}`);
      
      const rating = match.avgRating ? match.avgRating.toFixed(1) : "N/A";
      const numRatings = match.numRatings || 0;
      const ratingString = `${rating} - ${numRatings}`;
      
      console.log(`RMP Extension: Caching ${storageKey} = ${ratingString}`);
      set(storageKey, ratingString);
      
      return ratingString;
      
   } catch (error) {
      console.error(`RMP Extension: Error:`, error);
      return null;
   }
}

// Fallback: scrape the professor's direct page
async function fallbackSearch(fullName, firstName, lastName, storageKey) {
   try {
      console.log(`RMP Extension: Using fallback search method`);
      
      // Try to construct the professor's direct URL
      // Format: /professor/{school-id}/{encoded-name}
      const encodedName = encodeURIComponent(`${firstName}-${lastName}`);
      const profUrl = `https://www.ratemyprofessors.com/professor/877/${encodedName}`;
      
      console.log(`RMP Extension: Trying direct URL: ${profUrl}`);
      
      const response = await fetch(profUrl);
      
      if (response.ok) {
         const html = await response.text();
         
         // Try to extract rating from the page
         const ratingMatch = html.match(/avgRating["\s:]+([0-9.]+)/i);
         const numRatingsMatch = html.match(/numRatings["\s:]+([0-9]+)/i);
         
         if (ratingMatch) {
            const rating = parseFloat(ratingMatch[1]).toFixed(1);
            const numRatings = numRatingsMatch ? numRatingsMatch[1] : "?";
            const ratingString = `${rating} - ${numRatings}`;
            
            console.log(`RMP Extension: Extracted from page: ${ratingString}`);
            set(storageKey, ratingString);
            return ratingString;
         }
      }
      
      console.log(`RMP Extension: Fallback search failed`);
      set(storageKey, "N/A");
      return null;
      
   } catch (error) {
      console.error(`RMP Extension: Fallback error:`, error);
      set(storageKey, "N/A");
      return null;
   }
}

function set(key, value) {
   var dataObj = {};
   dataObj[key] = value;
   chrome.storage.local.set(dataObj, function () {
      console.log("RMP Extension: Set value in storage: " + JSON.stringify(dataObj));
   })
}