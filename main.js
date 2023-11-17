let res

let apiSrv = window.location.pathname

function shorturl() {
  if (document.querySelector("#longURL").value == "") {
    alert("Url cannot be empty!")
    return
  }

  document.getElementById("addBtn").disabled = true;
  document.getElementById("addBtn").innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>Please wait...';
  fetch(apiSrv, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cmd: "add", url: document.querySelector("#longURL").value, key: document.querySelector("#keyPhrase").value, password: document.querySelector("#passwordText").value })
  }).then(function (response) {
    return response.json();
  })
    .then(function (myJson) {
      res = myJson;
      document.getElementById("addBtn").disabled = false;
      document.getElementById("addBtn").innerHTML = 'Shorten it';

      // Successfully generated a short link
      if (res.status == "200") {
        let keyPhrase = res.key;
        let valueLongURL = document.querySelector("#longURL").value;
        // save to localStorage
        localStorage.setItem(keyPhrase, valueLongURL);
        // add to urlList on the page
        addUrlToList(keyPhrase, valueLongURL)

        document.getElementById("result").innerHTML = window.location.protocol + "//" + window.location.host + "/" + res.key;
      } else {
        document.getElementById("result").innerHTML = res.error;
      }

      $('#resultModal').modal('show')

    }).catch(function (err) {
      alert("Unknow error. Please retry!");
      console.log(err);
      document.getElementById("addBtn").disabled = false;
      document.getElementById("addBtn").innerHTML = 'Shorten it';
    })
}

function copyurl(id, attr) {
  let target = null;

  if (attr) {
    target = document.createElement('div');
    target.id = 'tempTarget';
    target.style.opacity = '0';
    if (id) {
      let curNode = document.querySelector('#' + id);
      target.innerText = curNode[attr];
    } else {
      target.innerText = attr;
    }
    document.body.appendChild(target);
  } else {
    target = document.querySelector('#' + id);
  }

  try {
    let range = document.createRange();
    range.selectNode(target);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
    document.execCommand('copy');
    window.getSelection().removeAllRanges();
    console.log('Copy success')
  } catch (e) {
    console.log('Copy error')
  }

  if (attr) {
    // remove temp target
    target.parentElement.removeChild(target);
  }
}

function loadUrlList() {
  // Clear the list
  let urlList = document.querySelector("#urlList")
  while (urlList.firstChild) {
    urlList.removeChild(urlList.firstChild)
  }

  // Long URL from the text box
  let longUrl = document.querySelector("#longURL").value
  console.log(longUrl)

  // Iterate through localStorage
  let len = localStorage.length
  console.log(+len)
  for (; len > 0; len--) {
    let keyShortURL = localStorage.key(len - 1)
    
    // Skip adding the entry if the key is "password"
    if (keyShortURL === "password") {
      continue;
    }
    
    let valueLongURL = localStorage.getItem(keyShortURL)

    // If the long URL is empty, load all localStorage
    // If the long URL is not empty, load matching localStorage
    if (longUrl == "" || (longUrl == valueLongURL)) {
      addUrlToList(keyShortURL, valueLongURL)
    }
  }
}

function addUrlToList(shortUrl, longUrl) {
  let urlList = document.querySelector("#urlList")

  let child = document.createElement('div')
  child.classList.add("list-group-item")

  // Delete button
  let delBtn = document.createElement('button')
  delBtn.setAttribute('type', 'button')
  delBtn.classList.add("btn", "btn-danger")
  delBtn.setAttribute('onclick', 'deleteShortUrl(\"' + shortUrl + '\")')
  delBtn.setAttribute('id', 'delBtn-' + shortUrl)
  delBtn.innerText = "X"
  child.appendChild(delBtn)

  // Query visit count button
  let qryCntBtn = document.createElement('button')
  qryCntBtn.setAttribute('type', 'button')
  qryCntBtn.classList.add("btn", "btn-info")
  qryCntBtn.setAttribute('onclick', 'queryVisitCount(\"' + shortUrl + '\")')
  qryCntBtn.setAttribute('id', 'qryCntBtn-' + shortUrl)
  qryCntBtn.innerText = "?"
  child.appendChild(qryCntBtn)

  // Short link information
  let keyTxt = document.createElement('span')
  keyTxt.classList.add("lnk")
  keyTxt.innerText = window.location.protocol + "//" + window.location.host + "/" + shortUrl
  child.appendChild(keyTxt)
  
  // Long link information
  let valueTxt = document.createElement('span')
  valueTxt.classList.add("lnk")
  valueTxt.innerText = longUrl
  child.appendChild(valueTxt)

  urlList.append(child)
}

function clearLocalStorage() {
  localStorage.clear()
}

function deleteShortUrl(delKeyPhrase) {
  // Button state
  document.getElementById("delBtn-" + delKeyPhrase).disabled = true;
  document.getElementById("delBtn-" + delKeyPhrase).innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span>';

  // Delete from KV
  fetch(apiSrv, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cmd: "del", key: delKeyPhrase, password: document.querySelector("#passwordText").value })
  }).then(function (response) {
    return response.json();
  })
    .then(function (myJson) {
      res = myJson;

      // Successful deletion
      if (res.status == "200") {
        // Remove from localStorage
        localStorage.removeItem(delKeyPhrase)

        // Load localStorage
        loadUrlList()

        document.getElementById("result").innerHTML = "Delete Successful"
      } else {
        document.getElementById("result").innerHTML = res.error;
      }

      $('#resultModal').modal('show')

    }).catch(function (err) {
      alert("Unknow error. Please retry!");
      console.log(err);
    })
}

function queryVisitCount(qryKeyPhrase) {
  // Button state
  document.getElementById("qryCntBtn-" + qryKeyPhrase).disabled = true;
  document.getElementById("qryCntBtn-" + qryKeyPhrase).innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span>';

  // Query from KV
  fetch(apiSrv, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cmd: "qry", key: qryKeyPhrase + "-count", password: document.querySelector("#passwordText").value })
  }).then(function (response) {
    return response.json();
  })
    .then(function (myJson) {
      res = myJson;

      // Successful query
      if (res.status == "200") {
        document.getElementById("qryCntBtn-" + qryKeyPhrase).innerHTML = res.url;
      } else {
        document.getElementById("result").innerHTML = res.error;
        $('#resultModal').modal('show')
      }

    }).catch(function (err) {
      alert("Unknow error. Please retry!");
      console.log(err);
    })
}

$(function () {
  $('[data-toggle="popover"]').popover()
})

loadUrlList()
