
var store;
var configObj;
var storeName="TrelloPrinter";
var objVersion = "0.3";
var loadFromJsonUrl=false;

var markedOptions;

$(function() {
    const renderer = new marked.Renderer();
    const linkRenderer = renderer.link;
    renderer.link = (href, title, text) => {
        const html = linkRenderer.call(renderer, href, title, text);
        return html.replace(/^<a /, '<a target="_blank" rel="nofollow" ');
    };
    markedOptions = {
        "renderer": renderer
    }
    
    $("#loadJsonBtn").click(function(){   
        try {
            var textAreaVal = JSON.parse($("#jsonTrelloBoard").val());
            configObj.trelloBoardJson= textAreaVal;
            showData(configObj.trelloBoardJson);
            persistConfigObj();
        } catch (error) {
            alert("Check your JSON!");
        }
        
        
    }); 
    loadConfigObj();
    if(loadFromJsonUrl&&!configObj.trelloBoardJson){
        try {
            jQuery.getJSON("assets/json/exported.json", function(data) {
                configObj.trelloBoardJson=data;
                loadDocumentFromCache();
            }).fail(function() {
                    console.log( "error" );
                });
        } catch (error) {
            console.log( error );
        }
        
    }else{
        loadDocumentFromCache();
    }

   
    
});

function loadDocumentFromCache(){
    var textAreaVal ;
                
    if(configObj.trelloBoardJson){
        textAreaVal=JSON.stringify(configObj.trelloBoardJson);
        showData(configObj.trelloBoardJson);
    }else{
        textAreaVal="";
    }
    $("#jsonTrelloBoard").val(textAreaVal);
}

function urlIsImage(url){
    return url.match(/.(jpg|jpeg|png|gif)$/i);
   
}


function showData(json) {
    data=eatData(json);
    var template = $('#template-output').html()
    //console.log(JSON.stringify(data, null, 2))
    $('#out').html(Mustache.render(template, data))
    jQuery.tableOfContents("#tocList","h1.tocHeader, h2.tocHeader"); 
}

function loadConfigObj(){
    store = new Persist.Store(storeName);
    configObjStored = store.get('configObj');
    var recreateObj=true;
    if(configObjStored){
        configObj = JSON.parse(configObjStored);
        if(configObj.version===objVersion){
            recreateObj=false;
        }
    }
    
    if(recreateObj){
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
            desc: marked(value.desc, markedOptions),
            checklists: [],
            labels: [],
            actions: [],
            images: []
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
        $.each(value.attachments, function( index2, attachment ) {
            
           if(attachment.url&&urlIsImage(attachment.url)){
             var imgIndex = Math.min(4,attachment.previews.length-1);
             data.ref[value.id].images.push(
                 {
                    "scaled":attachment.previews[imgIndex].url,
                    "original":attachment.url
                }
            );
           }

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
            text: marked(value.data.text, markedOptions),
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
            checkItem.name=marked.inlineLexer(checkItem.name, [], markedOptions)
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