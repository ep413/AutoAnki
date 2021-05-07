chrome.runtime.onMessage.addListener(
    function(search, sender, onSuccess) {
        fetch(search)
            .then(response => response.text())
            .then(responseText => onSuccess(responseText))
        
        return true; 
    }
);