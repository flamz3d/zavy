var fs = require("fs");
var url = require('url');
var SpellChecker = require('spellchecker');

const express = require('express')
const app = express()
const port = 3000
app.use(express.static('public'))

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}


app.get('/lexicon', function (req, res) 
{
    var url_parts = url.parse(req.url, true);
    var query = url_parts.query;
    var content = JSON.parse(fs.readFileSync("./lan/fr/words.json"));
    if (query.random)
    {
        content.phrases = shuffle(content.phrases);
    }

    res.json(content);
})

app.get('/add', function (req, res) 
{
    var url_parts = url.parse(req.url, true);
    var query = url_parts.query;

    var content = fs.readFileSync("./lan/fr/words.json");
    var database = JSON.parse(content);
    database[query.collection].push(query.word);
    fs.writeFileSync('./lan/fr/words.json', JSON.stringify(database), 'utf8');
    res.json(database);
})

app.get('/remove', function (req, res) 
{
    var url_parts = url.parse(req.url, true);
    var query = url_parts.query;

    var content = fs.readFileSync("./lan/fr/words.json");
    var database = JSON.parse(content);

    database[query.collection] = database[query.collection].filter(function(value, index, arr){
        return value != query.word;
    });
    
    fs.writeFileSync('./lan/fr/words.json', JSON.stringify(database), 'utf8');
    res.json(database);
})

app.get('/add_phrase', function (req, res) 
{
    var url_parts = url.parse(req.url, true);
    var query = url_parts.query;
    var errors = SpellChecker.checkSpelling(query.phrase);
    if (errors.length==0)
    {
        var content = fs.readFileSync("./lan/fr/words.json");
        var database = JSON.parse(content);
        if (!database["phrases"].includes(query.phrase))
            database["phrases"].push(query.phrase);
        fs.writeFileSync('./lan/fr/words.json', JSON.stringify(database), 'utf8');
    }
    res.json(errors);
})

app.get('/correct', function (req, res) 
{
    var url_parts = url.parse(req.url, true);
    var query = url_parts.query;
    var corrections = SpellChecker.getCorrectionsForMisspelling(query.word)
    res.json(corrections);
})

app.listen(port, () => console.log(`Zavy app listening on port ${port}!`))