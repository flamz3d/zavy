function Main(div) {

        $("#next_phrase").click( function   () {
                NextPhrase( function(phrase) {
                    $("#exam_phrase").text(phrase);
                }, $("#exam_phrase").text());
        });

        NextPhrase( function(phrase) {
            $("#exam_phrase").text(phrase);
        }, "");
}

function NextPhrase(cb, previous)
{
    axios.get('./lexicon?random=true')
      .then(function (response) {

        var validPhrases = _.filter(response.data.phrases, function(phrase) {

            var validPhrase = false;
            _.each(response.data.sounds, function (sound) {
                if (phrase.toLowerCase().indexOf(sound)>=0) {
                    validPhrase = true;
                }
            });

            if (!validPhrase)
            {
                var wordsInPhrase = phrase.split(" ");
                _.each(wordsInPhrase, function (word) {
                    if (response.data.words.includes(word.toLowerCase()))  {
                        validPhrase = true;
                    }
                });
            }
            return validPhrase  ;
        });

        if (validPhrases.length  ==0)
        {
            cb("no valid phrases in database");
        } 
        else 
        {
            //cb(validPhrases[Math.floor(Math.random() * validPhrases.length)]);
            var cur = 0;
            if (validPhrases[0]==previous)
                cb(validPhrases[1]);
            else
                cb(validPhrases[0]);
        }
      })
      .catch(function (error) {
        // handle error
        console.log(error);
      })
      .then(function () {
        // always executed
      });
}