/*
This file was created by Sara Robinson at https://gist.github.com/sararob/b0b299cad9c1aa7558cedbdf95fad65f.
It was mentioned in the article at https://hackernoon.com/how-people-talk-about-marijuana-on-reddit-a-natural-language-analysis-a8d595882a7a.

Replace YOUR_API_KEY in the nlRequestUri variable below with your Google API key.

Input: reddit-comments.json in the same path.
Output: output.json in the same path.

*/

'use strict';

const fs = require('fs');
const ndjson = require('ndjson');
const request = require('request');

fs.createReadStream('reddit-comments.json') // Newline delimited JSON file
  .pipe(ndjson.parse())
  .on('data', function(obj) {

	  let text = obj.body;

		let nlRequestUri = "https://language.googleapis.com/v1/documents:annotateText?key=YOUR_API_KEY";

		let nlReq = {
		  	"document": {
		  		"content": text,
		  		"type": "PLAIN_TEXT"
		  	},
		  	"features": {
		  		"extractSyntax": true,
		  		"extractEntities": true,
		  		"extractDocumentSentiment": true
		  	}
		  }
		let reqOptions = {
			  url: nlRequestUri,
			  method: "POST",
			  body: nlReq,
			  json: true
		  }

		request(reqOptions, function(err, resp, respBody) {
			if (!err && resp.statusCode == 200) {

				if (respBody.language === 'en') {

					let row = {
						sentiment_score: respBody.documentSentiment.score,
						magnitude: respBody.documentSentiment.magnitude,
						entities: respBody.entities,
						tokens: respBody.tokens,
						text: text,
						comment_score: parseInt(obj.score),
						created: obj.date_posted
					}
          // Newline delimited JSON because that's the format we need to upload to BigQuery
					fs.appendFileSync('output.json', JSON.stringify(row) + '\n');

				}
			} else {
				console.log('nl api error err', resp);
			}
		});
  });
