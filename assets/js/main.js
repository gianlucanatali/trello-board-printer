
var store;
var configObj;
var storeName="TrelloPrinter";

$(function() {
    
    $("#loadJsonBtn").click(function(){   
        configObj.trelloBoardJson=JSON.parse($("#jsonTrelloBoard").val());
        showData(configObj.trelloBoardJson);
        persistConfigObj(configObj.trelloBoardJson);
    }); 
    loadConfigObj();
    if(!configObj.trelloBoardJson){
        jQuery.getJSON("assets/json/exported.json", function(data) {
            configObj.trelloBoardJson=data;
            var textAreaVal ;
            
            if(configObj.trelloBoardJson){
                textAreaVal=JSON.stringify(configObj.trelloBoardJson);
                showData(configObj.trelloBoardJson);
            }else{
                textAreaVal="";
            }
            $("#jsonTrelloBoard").val(textAreaVal);
        }).fail(function() {
                console.log( "error" );
            });
    }else{
        showData(configObj.trelloBoardJson);
    }

   
    
});



function showData(json) {
    data=eatData(json);
    var template = $('#template-output').html()
    console.log(JSON.stringify(data, null, 2))
    $('#out').html(Mustache.render(template, data))
    jQuery.tableOfContents("#tocList","h1.tocHeader, h2.tocHeader"); 
}

function loadConfigObj(){
    store = new Persist.Store(storeName);
    configObjStored = store.get('configObj');
    var objVersion = 2;
    var restoreObj=configObjStored&&configObjStored.version===objVersion;
    if(restoreObj){
        configObj = JSON.parse(configObjStored);
    }else{
        configObj = {
            version: objVersion
        };
    }
}

function persistConfigObj(){
    var myJSON = JSON.stringify(configObj);
    store.set('configObj', myJSON);
}

function eatData(trelloJson) {
    var data = {
        board: trelloJson.name,
        lists: [],
        ref: {}
    }
    window.document.title = trelloJson.name;
    $.each(trelloJson.labels, function( index, value ) {
        data.ref[value.id] = {
            name: value.name,
            color: value.color
        }
    });
    $.each(trelloJson.lists, function( index, value ) {
        if (value.closed) {
            return;
        }
        data.ref[value.id] = {
            name: value.name,
            cards: []
        }
        data.lists.push(data.ref[value.id])
    });
    $.each(trelloJson.cards, function( index, value ) {
        if (value.closed) {
            return;
        }
        data.ref[value.id] = {
            name: value.name,
            desc: marked(value.desc),
            checklists: [],
            labels: [],
            actions: []
        }
        value.labels.sort(function(a,b){
            if(a.name < b.name) { return -1; }
            if(a.name > b.name) { return 1; }
            return 0;
        });
        $.each(value.labels, function( index2, label ) {
            if(data.ref[label.id]){
                data.ref[value.id].labels.push(data.ref[label.id]);
            }
            //checkItem.name=marked(checkItem.name);
        });
        if(data.ref[value.idList]){
            data.ref[value.idList].cards.push(data.ref[value.id]);
        }
    });
    $.each(trelloJson.actions, function( index, value ) {
        if (value.type != "commentCard") {
            return;
        }
        data.ref[value.id] = {
            text: marked(value.data.text),
            date: moment(value.date).format('YYYY-MM-DD')
        }
        try {
            data.ref[value.data.card.id].actions.push(data.ref[value.id])
        } catch (e) {}
    });
    $.each(trelloJson.checklists, function( index, value ) {
        if (value.closed) {
            return;
        }
        $.each(value.checkItems, function( index2, checkItem ) {
            checkItem.name=marked.inlineLexer(checkItem.name, [])
            //checkItem.name=marked(checkItem.name);
        });
        data.ref[value.id] = {
            name: value.name,
            checkItems: value.checkItems
        }
        try {
            data.ref[value.idCard].checklists.push(data.ref[value.id])
        } catch (e) {}
    });

    return data;
}