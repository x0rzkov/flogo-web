package app

var jsonMetadata = `{
  "name": "tibco-app",
  "version": "0.0.1",
  "description": "Simple App Activity",
  "inputs":[
    {
      "name": "attribute",
      "type": "string",
      "required": true
    },
    {
      "name": "operation",
      "type": "string",
      "required" : true,
      "allowed" : ["ADD","GET","UPDATE"]
    },
    {
      "name": "type",
      "type": "string",
      "allowed" : [	"string", "integer", "number", "boolean", "object", "array", "params"]
    },
    {
      "name": "value",
      "type": "any"
    }
  ],
  "outputs": [
    {
      "name": "value",
      "type": "any"
    }
  ]
}`
