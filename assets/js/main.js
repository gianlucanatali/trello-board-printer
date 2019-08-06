
jQuery.getJSON("assets/json/exported.json", function(data) {
    autorun(data);
});

function autorun(data) {
    if (null == data) {
        return alert('Please insert JSON data from Trello in the code')
    }
    showData(eatData(data));
}

function showData(data) {
    var template = $('#template-output').html()
    console.log(JSON.stringify(data, null, 2))
    $('#out').html(Mustache.render(template, data))
}

function eatData(trelloJson) {
    var data = {
        board: trelloJson.name,
        lists: [],
        ref: {}
    }
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