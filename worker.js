const config = {
  no_ref: "off", //Control the HTTP referrer header, if you want to create an anonymous link that will hide the HTTP Referer header, please set to "on" .
  theme: "",//Homepage theme, use the empty value for default theme. To use urlcool theme, please fill with "theme/urlcool" .
  cors: "on",//Allow Cross-origin resource sharing for API requests.
  unique_link: false,//If it is true, the same long url will be shorten into the same short url
  custom_link: true,//Allow users to customize the short url.
  snapchat_mode: false,//The link will be distroyed after access.
  visit_count: true,//Count visit times.
}

const html404 = `<!DOCTYPE html>
  <html>
  <body>
    <h1>404 Not Found.</h1>
    <p>The url you visit is not found.</p>
    <p> <a href="https://github.com/nazdridoy" target="_self">Find me on GitHub</a> </p>
  </body>
  </html>`

let response_header = {
  "content-type": "text/html;charset=UTF-8",
}

if (config.cors == "on") {
  response_header = {
    "content-type": "text/html;charset=UTF-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST",
    "Access-Control-Allow-Headers": "Content-Type",
  }
}

async function randomString(len) {
  len = len || 6;
  let $chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678';    /**** Excluding easily confused characters: oOLl,9gq,Vv,Uu,I1 ****/
  let maxPos = $chars.length;
  let result = '';
  for (i = 0; i < len; i++) {
    result += $chars.charAt(Math.floor(Math.random() * maxPos));
  }
  return result;
}

async function sha512(url) {
  url = new TextEncoder().encode(url)

  const url_digest = await crypto.subtle.digest(
    {
      name: "SHA-512",
    },
    url, // The data you want to hash as an ArrayBuffer
  )
  const hashArray = Array.from(new Uint8Array(url_digest)); // convert buffer to byte array
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  //console.log(hashHex)
  return hashHex
}
async function checkURL(URL) {
  let str = URL;
  let Expression = /http(s)?:\/\/([\w-]+\.)+[\w-]+(\/[\w- .\/?%&=]*)?/;
  let objExp = new RegExp(Expression);
  if (objExp.test(str) == true) {
    if (str[0] == 'h')
      return true;
    else
      return false;
  } else {
    return false;
  }
}
async function save_url(URL) {
  let random_key = await randomString()
  let is_exist = await LINKS.get(random_key)
  console.log(is_exist)
  if (is_exist == null) {
    // Counting functionality
    if (config.visit_count) {
      // When saving the link, create a statistical key for it and initialize it to 0
      await LINKS.put(random_key + "-count", "0");
    }
    return await LINKS.put(random_key, URL), random_key
  }
  else
    save_url(URL)
}
async function is_url_exist(url_sha512) {
  let is_exist = await LINKS.get(url_sha512)
  console.log(is_exist)
  if (is_exist == null) {
    return false
  } else {
    return is_exist
  }
}
async function handleRequest(request) {
  console.log(request)

  // Look up the value corresponding to 'password' in KV
  const password_value = await LINKS.get("password");

  if (request.method === "POST") {
    let req = await request.json()

    let req_cmd = req["cmd"]
    let req_url = req["url"]
    let req_key = req["key"]
    let req_password = req["password"]

    console.log(req_cmd)
    console.log(req_url)
    console.log(req_key)
    console.log(req_password)

    if (req_password != password_value) {
      return new Response(`{"status":500,"key": "", "error":"Error: Invalid password."}`, {
        headers: response_header,
      })
    }

    if (req_cmd == "add") {
      if (!await checkURL(req_url)) {
        return new Response(`{"status":500, "url": "` + req_url + `", "error":"Error: Url illegal."}`, {
          headers: response_header,
        })
      }

      let stat, random_key
      if (config.custom_link && (req_key != "")) {
        let is_exist = await LINKS.get(req_key)
        if (req_key == "password") {
          return new Response(`{"status":500,"key": "` + req_key + `", "error":"Error: Custom shortURL NOT PERMITTED."}`, {
            headers: response_header,
          })
        } else if (is_exist != null) {
          return new Response(`{"status":500,"key": "` + req_key + `", "error":"Error: Custom shortURL existed."}`, {
            headers: response_header,
          })
        } else {
          random_key = req_key
          stat, await LINKS.put(req_key, req_url)
        }
      } else if (config.unique_link) {
        let url_sha512 = await sha512(req_url)
        let url_key = await is_url_exist(url_sha512)
        if (url_key) {
          random_key = url_key
        } else {
          stat, random_key = await save_url(req_url)
          if (typeof (stat) == "undefined") {
            console.log(await LINKS.put(url_sha512, random_key))
          }
        }
      } else {
        stat, random_key = await save_url(req_url)
      }
      console.log(stat)
      if (typeof (stat) == "undefined") {
        return new Response(`{"status":200, "key":"` + random_key + `", "error": ""}`, {
          headers: response_header,
        })
      } else {
        return new Response(`{"status":500, "key": "", "error":"Error:Reach the KV write limitation."}`, {
          headers: response_header,
        })
      }
    } else if (req_cmd == "del") {
      if (req_key == "password") {

        return new Response(`{"status":500, "key": "` + req_key + `", "error":"Error:PROTECTED KEY"}`, {
          headers: response_header,
        })
      } else {
        await LINKS.delete(req_key)
        
        // If the counting functionality is enabled, delete the corresponding KV entry for counting
        if (config.visit_count) {
          await LINKS.delete(req_key + "-count")
        }

        return new Response(`{"status":200, "key": "` + req_key + `", "error": ""}`, {
          headers: response_header,
        })
      }
    } else if (req_cmd == "qry") {
      let value = await LINKS.get(req_key)
      if (value != null) {
        return new Response(`{"status":200, "key": "` + req_key + `", "url": "` + value + `", "error":""}`, {
          headers: response_header,
        })
      } else {
        return new Response(`{"status":500, "key": "` + req_key + `", "error":"Error:shortURL not exist."}`, {
          headers: response_header,
        })
      }
    }

  } else if (request.method === "OPTIONS") {
    return new Response(``, {
      headers: response_header,
    })
  }

  const requestURL = new URL(request.url)
  const path = requestURL.pathname.split("/")[1]
  const params = requestURL.search;

  console.log(path)
  // If the path is empty, i.e., directly accessing the URL
  if (!path) {
    return Response.redirect("https://www.google.com/search?q=password", 302)
    /* new Response(html404, {
      headers: {
        "content-type": "text/html;charset=UTF-8",
      },
      status: 404
    }) */
  }

  // If the path matches the password, display the application interface
  if (path == password_value) {
    let index = await fetch("https://raw.githubusercontent.com/nazdridoy/CF-UrlShorten/main/" + config.theme + "/index.html")
    index = await index.text()
//    index = index.replace(/__PASSWORD__/gm, password_value)
    return new Response(index, {
      headers: {
        "content-type": "text/html;charset=UTF-8",
      },
    })
  }

  // Query the original link corresponding to the short link in KV
  const value = await LINKS.get(path);
  let location;

  if (params) {
    location = value + params
  } else {
    location = value
  }
  console.log(value)

  if (location) {
    // Counting functionality
    if (config.visit_count) {
      // Get and increment visit count
      let count = await LINKS.get(path + "-count");
      if (count === null) {
        await LINKS.put(path + "-count", "1"); // Initialize to 1 because this is the first visit
      } else {
        count = parseInt(count) + 1;
        await LINKS.put(path + "-count", count.toString());
      }
    }

    // If in read-and-burn mode
    if (config.snapchat_mode) {
      // Delete the record in KV
      await LINKS.delete(path)
    }

    if (config.no_ref == "on") {
      let no_ref = await fetch("https://raw.githubusercontent.com/nazdridoy/CF-UrlShorten/main/no-ref.html")
      no_ref = await no_ref.text()
      no_ref = no_ref.replace(/{Replace}/gm, location)
      return new Response(no_ref, {
        headers: {
          "content-type": "text/html;charset=UTF-8",
        },
      })
    } else {
      return Response.redirect(location, 302)
    }
  }
  
  // If request not in kv, return 404
  return new Response(html404, {
    headers: {
      "content-type": "text/html;charset=UTF-8",
    },
    status: 404
  })
}

addEventListener("fetch", async event => {
  event.respondWith(handleRequest(event.request))
})
