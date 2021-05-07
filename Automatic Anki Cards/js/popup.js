document.addEventListener('DOMContentLoaded', documentEvents, false);
/*jshint -W009 */

var term;
var pair = [];
var segs = [];
var jishoURL ="https://jisho.org/api/v1/search/words?keyword=";

function tokenizeInput(input) { 
    console.log("input is : " + input.value);
    str = input.value;
    
    let regex = /[\u3002\u300D\u300F\uFF01\uFF1F]/;
    var term = str.split(regex);
    
    for(var i=0;i<term.length;i++){
      console.log(term[i]);
      example = term[i];
      
      var segmenter = new TinySegmenter();
      segs = segmenter.segment(term[i]);
      console.log(segs);
      segs = cleanInput(segs);
      console.log("cleaned segs is: " + segs);
   
      for(var j=0;j<segs.length;j++){
        getEngDefs(segs[j],example);
       }
       
    }
 }


function cleanInput(segs) {
  
  let uniqueTerms = [...new Set(segs)];
  uniqueTerms = Array.from(uniqueTerms);
  var cleanTerms = [];
  
  var iranaiMono = /\u3069\u3046\u3057\u3088\u3046|\u304D\u3057?\u3081\u3066|\u3042(?:\u3063\u305F|\u308B)|\u306A(?:\u3093\u304B|[\u3044\u3063])|[\u3042\u305D]\u3093\u306A|\u3053(?:\u3093\u306A|\u3068)|\u304B(?:\u3044\u308C|[\u3063\u3089])|\u3044(?:\u305F\u3044|[\u3044\u3046\u3064\u308B])|\u3069\u3046|\u3044\u305F?|\u308C\u308B|\u3067\u3082|\u306D\u3047|\u307B\u3069|\u3082\u3046|\u3060\u3063|\u307E[\u305F\u3063]|\u3088[\u3046\u308A]|\u305F[\u3044\u3093]|\u3063\u3068|[\u3067\u3082]|\u3060|\u304B|\u3088|\u305F|\u3063|[ \u3000\u3001\u300C\u300E\u304C\u3055\u3057\u3058\u3066\u3068\u306B\u306E-\u3070\u308F\u3092\u3093]/;
  
  for(i=0;i<uniqueTerms.length;i++){
      var cleanTerm = uniqueTerms[i].replace(iranaiMono,"");
      if(cleanTerm!==""){
        cleanTerms.push(cleanTerm);
      }
  }
   return(cleanTerms);
} 

function getEngDefs(seg,example){
  search = new URL(jishoURL.concat(seg));

  chrome.runtime.sendMessage(
      search,
      dict => $.getJSON(search, function(data){
      dict = JSON.parse(dict);
      var def = [];
      imi = dict.data[0].senses[0].english_definitions;
      
      for(var i=0;i<imi.length;i++){
        def.push(imi[i]);
        console.log("def is: " + def[i]);
         }
         
      pair = [seg,def,example];
      console.log(pair);
      sendToAnki(pair);
      
}));
}
  
async function sendToAnki(pair){
  frontside = pair[2].concat("\(",pair[0],"\)")
  backside = pair[0].concat(" : ",pair[1])
  console.log("backside is: " + backside)
  console.log("frontside is: " + frontside)
  
  try {
    const result = await ankiConnectInvoke('createDeck', 6,{"deck":"AutoAnki"});
    console.log(`passed deck creating: ${result}`);
} catch (e) {
    console.log(`error deck creating: ${e}`);
}

try {
    const result = await ankiConnectInvoke('addNote', 6,{
        "note": {
            "deckName": "AutoAnki",
            "modelName": "Basic",
            "fields": {
                "Front": frontside,
                "Back": backside
            },
            "options": {
                "allowDuplicate": false,
                "duplicateScope": "deck",
                "duplicateScopeOptions": {
                    "deckName": "Default",
                    "checkChildren": false
                }
            },
            "tags": ["AutoAnki"]
        }
    });
    console.log(`passed note creating: ${result}`);
} catch (e) {
    console.log(`error note creating: ${e}`);
}
}
function ankiConnectInvoke(action, version, params={}) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.addEventListener('error', () => reject('failed to connect to AnkiConnect'));
        xhr.addEventListener('load', () => {
            try {
                const response = JSON.parse(xhr.responseText);
                if (response.error) {
                    throw response.error;
                } else {
                    if (response.hasOwnProperty('result')) {
                        resolve(response.result);
                    } else {
                        reject('failed to get results from AnkiConnect');
                    }
                }
            } catch (e) {
                reject(e);
            }
        });

        xhr.open('POST', 'http://127.0.0.1:8765');
        xhr.send(JSON.stringify({action, version, params}));
    });
}




function documentEvents() {    
  document.getElementById('submitButton').addEventListener('click', 
    function() { tokenizeInput(document.getElementById('jpntext'));
  });
}

