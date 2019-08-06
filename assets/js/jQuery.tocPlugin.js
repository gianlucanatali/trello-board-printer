jQuery.tableOfContents =                                                                   
function (tocList,selector) {                                                                   
    jQuery(tocList).empty();                                                            
    var prevH1Item = null;                                                             
    var prevH1List = null;                                                             
    
    var index = 0;
    var h1Counter=0;
    var h2Counter=1;                                                                     
    jQuery(selector).each(function() {                                                      
    
        var anchor = "<a name='" + index + "'></a>";                                   
        jQuery(this).before(anchor);                                                        
        
         
        
        if( jQuery(this).is("h1") ){  
            h1Counter++;  
            h2Counter=1;    
            var li     = "<li><a href='#" + index + "'>" + 
            h1Counter + ". " + jQuery(this).text() + "</a></li>";                                                    
            prevH1List = jQuery("<ul></ul>");                                               
            prevH1Item = jQuery(li);                                                        
            prevH1Item.append(prevH1List);                                             
            prevH1Item.appendTo(tocList);      
                                                 
        } else if( jQuery(this).is("h2") ){   
            var li     = "<li><a href='#" + index + "'>" + 
            h1Counter + "." + h2Counter +". " + jQuery(this).text() + "</a></li>";                                                                      
            prevH1List.append(li);    
            h2Counter++;                                                 
        } else {                                                                       
            //prevH2List.append(li);                                                     
        }                                                                              
        index++;                                                                       
    });                                                                                
}    