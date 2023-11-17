

# API documentation

Short links can be generated in a programmable way by calling the API interface

### API call address

Self-deployed CloudFlare Worker address, for example: https://url.dem0.workers.dev or a self-bound domain name

### Calling method: HTTP POST Request format: JSON
Example:
````
{
  "cmd": "add",
  "url": "https://example.com",
  "key": "ilikeu",
  "password": "bodongshouqulveweifengci"
}
````

### Request parameters:
```
cmd: add | del | qry
url: The long link
key: The short link
password: Authentication
```

### Example response (JSON):

````
{
  "status": 200,
  "error": "",
  "key": "HcAx62",
  "url": ""
}
````

### Response parameters:
````
"status": 200 | 500
"error": error details
"key": The short link
"url": The long link
````

"status": 200 means success, other code means failed.
