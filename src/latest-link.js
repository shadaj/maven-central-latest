import fetch from 'node-fetch';
const cheerio = require('cheerio')

exports.handler = function(event, context, callback) {
  const org = event.queryStringParameters.org;
  const libraryName = event.queryStringParameters.name;
  const centralPagePath = `http://central.maven.org/maven2/${org.split('.').join('/')}/${libraryName}/`;

  fetch(centralPagePath).then(res => res.text()).then(t => {
    const $ = cheerio.load(t);
    const versions = [];
    const versionContents = $("#contents").contents().map(function(i, el) {
      return $(this).text();
    }).toArray().slice(2);

    let i = 0;
    while (i < versionContents.length && versionContents[i] !== "maven-metadata.xml") {
      const version = versionContents[i].slice(0, versionContents[i].length - 1);
      const date = versionContents[i + 1].split(" - ")[0].trim();
      versions.push({
        version,
        date
      });
      i += 2;
    }
    
    const latest = versions.sort((a, b) => {
      return a.date < b.date ? 1 : -1;
    })[0].version;

    if (event.queryStringParameters.format) {
      callback(null, {
        statusCode: 200,
        body: event.queryStringParameters.format.replace("VERSION", latest).replace(/\%20/g, " ").replace(/\%22/g, "\"")
      });
    } else {
      callback(null, {
        statusCode: 302,
        headers: {
          Location: event.queryStringParameters.formatRedirect.replace("VERSION", latest).replace(/\%20/g, " ").replace(/\%22/g, "\""),
        },
        body: ""
      });
    }
  }).catch(e => {
    console.log(e);
  });
}
