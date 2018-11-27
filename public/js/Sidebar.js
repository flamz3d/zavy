function Sidebar(div, graph) {

    RenderTemplate("templates/Sidebar.html", div).then(function (html) {

        $('#words').tagsinput({
          allowDuplicates: false
        });

        $('#sounds').tagsinput({
          allowDuplicates: false
        });
        
        axios.get('./lexicon')
          .then(function (response) {
            
            // words
            _.each(response.data.words, function(word) {
                $('#words').tagsinput('add', word, {preventPost: true});
            });

            $('#words').on('itemAdded', function(event) {
                updateDatabase('add', event.item, "words", function(){});
            });

            $('#words').on('itemRemoved', function(event) {
                updateDatabase("remove", event.item, "words");
            });


            // sounds
            _.each(response.data.sounds, function(word) {
                $('#sounds').tagsinput('add', word, {preventPost: true});
            });

            $('#sounds').on('itemAdded', function(event) {
                updateDatabase('add', event.item, "sounds", function(){});
            });

            $('#sounds').on('itemRemoved', function(event) {
                updateDatabase("remove", event.item, "sounds");
            });

            // phrases
            var phrases = $("#phrases");
            _.each(response.data.phrases, function(phrase) {
                insertPhraseUI(phrase, phrases);
            });

            $("#add_phrase").click( function() {
                addPhrase($("#new_phrase").val());
            });

          })
          .catch(function (error) {
            // handle error
            console.log(error);
          })
          .then(function () {
            // always executed
          });

        $("#menu-toggle,#collapse-menu").click(function (e) {
            e.preventDefault();
            div.toggleClass("toggled");
        });
    })
}

function insertPhraseUI(phrase, container) {

    var training_words = $("#words").tagsinput('items');
    var training_sounds = $("#sounds").tagsinput('items');

    var wordsInPhrase = phrase.split(" ");
    var klass = "";

    _.each(training_sounds, function (sound) {
        if (phrase.toLowerCase().indexOf(sound)>=0) {
            klass = "training_phrase";
        }
    });

    _.each(wordsInPhrase, function (word) {
        if (training_words.includes(word.toLowerCase()))  {
            klass = "training_phrase";
        }
    });

    $("<div class='inner-addon right-addon'><i class='glyphicon glyphicon-user fas fa-trash-alt'></i><input readonly type='text' value='" + phrase + "' class='form-control form-control-sm phrase " + klass + "'/></div>")
    .appendTo(container)
    .find("i")
    .click( function(d) {
        var self = $(this).parent();
     axios.get(encodeURI('./remove?collection=phrases&word=' + phrase)).then(function (response) {
        self.remove();
        });       
    })

}

function updateDatabase(action, word, collection, callback) {
 axios.get('./' + action + '?collection=' + collection + "&word=" + word).then(function (response) {
    console.log(response);
    });
}

function addPhrase(phrase) {
    phrase = phrase.replace ("  ", " ")
    axios.get(encodeURI('./add_phrase?phrase=' + phrase)).then(function (response) {
        if (response.data.length==0) {
            insertPhraseUI(phrase, $("#phrases"));
            $("#new_phrase").val("");
            return;
        }

        var words = phrase.split(" ");
        var errorTokens = []
        _.each(response.data, function(error) {
            var phraseUpToError = phrase.substring(0, error.end);
            var allo = (phraseUpToError.match(/ /g) || []).length;
            errorTokens.push(words[allo])
        });

        var errorMessage = $('#errorMessage');
        errorMessage.empty();
        var errorHTML = ""
        _.each(words,function(w) {
            if (errorHTML.length>0)
                errorHTML += " ";
            if (errorTokens.includes(w))
            {
                errorHTML += "<b class='spelling_mistake' data-toggle='popover' data-placement='bottom'>" + w + "</b>";

            } else {
                errorHTML += w;
            }
        });

        $("<p>" + errorHTML + "</p>").appendTo(errorMessage);
        errorMessage.find("b").click(function(e)  {
                
            });

        $('[data-toggle="popover"]').popover( { html: true, content: function(d) {            
            var div_id =  "tmp-id-" + $.now();
            return getCorrections(div_id, $(this).text());
        }});

        $('#errorModal').modal();

    });   
}

function getCorrections(div_id, word) {

    axios.get(encodeURI('./correct?word=' + word)).then(function (response) {
        
        var parentDiv = $("#" + div_id);
        parentDiv.empty();
        _.each(response.data, function(d) {
            $('<button type="button" class="btn btn-primary btn-sm">' + d + '</button>')
            .click(function(e) {
                var errorMessage = $('#errorMessage');
                var newPhrase = errorMessage.text().replace(word, d);
                $("#new_phrase").val(newPhrase);
                $('#errorModal').modal('hide');
                addPhrase(newPhrase);
            })
            .appendTo(parentDiv);
        })
    });

  return '<div id="'+ div_id +'">Loading...</div>';  
}

/*
<li class="nav-item dropdown">
    <a class="nav-link dropdown-toggle" data-toggle="dropdown" href="#" role="button" aria-haspopup="true" aria-expanded="false">Dropdown</a>
    <div class="dropdown-menu" x-placement="bottom-start" style="position: absolute; transform: translate3d(0px, 40px, 0px); top: 0px; left: 0px; will-change: transform;">
      <a class="dropdown-item" href="#">Action</a>
      <a class="dropdown-item" href="#">Another action</a>
      <a class="dropdown-item" href="#">Something else here</a>
      <div class="dropdown-divider"></div>
      <a class="dropdown-item" href="#">Separated link</a>
    </div>
  </li>*/