/*
 * Pass in valid opts to gen listings
 * (intended for cron)
 */
var request      = require("request")
    , cheerio    = require("cheerio")
    , async      = require("async") 
    , MM         = require('../models/rents.js');

// opts:
var argv = require('optimist')
    .usage('Usage: $0 --type [string] --name [string] --link [string]')
    .demand(['type','name','link'])
    .argv;

// log:
var dt      = new Date();
var fdt     = dt.getFullYear()+'-'+dt.getMonth()+'-'+dt.getDay();
var logpath = '../logs/listings/'+fdt+'_'+argv.name+'.log';
var winston = require("winston");
var log     = new (winston.logger)({
    transports: [
        new (winston.transports.Console)(),
        new (winston.transports.File)({ filename: logpath})
    ]
});

var name_list      = ['state_name','area_name','region_name','nbhood_name'];
var nextlvl        = new Array();
    nextlvl.state  = 'area';
    nextlvl.area   = 'region';
    nextlvl.region = 'nbhood';


function ah_page_get(page_task,cb) {
    // get cid from link
    var cid = 0;
    var match = /.*\/(\d+).*/.exec(page_task.link);
    if (match[1]) {
        cid = match[1];
    }
    request(page_task.link,function(err,resp,body) {
        var $ = cheerio.load(body);
        var title = $('body h2').html();
        var match = /\$(\d+).*/.exec(title);
        var cost = 0;
        // need br count!!!
        if (match[1]) {
            cost = match[1];
        }
        // should decide whether to keep or not based on cost and br count
        //      if keeping, set place {} and features[]
        //
        // need to try load before save ... mongoose create?
        var listing = new MM.Listing({
            place : {},
            features : []
            cid :
            cost :
            title :
            link :
            date_posted : 
            created : Date.now()


        });
    });
}

var q_page = async.queue(ah_page_get, 5); // 5 at a time?
q_page.drain = function() {
    //we're all done ... ?
    MM.mongoose.disconnect();
    console.log('Worked!?');
}

function ah_list_get(list_task, cb) {
    request(list_task.link,function(err,resp,body) {
        var $ = cheerio.load(body);
        // look for additional pages
        // if found, queue them up
        if ($('.ban span').size() === 0) {
            //standard page
            // just grab next 10 until figure something else out
            for (var i=1; i<=10; i++) {
                list_task.link = list_task.link+'index'+i+'00.html';
                q_list.push(list_task,function(err) {
                    // log here?
                });
            }
        }
        else {
            //nbhood page w/ 1,2,3 links
            list_task.link = $('h4 a b').parent().attr('href');
            q_list.push(list_task,function(err) {
                // log here?
            });
        }
        // then move on to queueing up pages for current list
        var page_count = $('p a').size() - 1;
        $('p a').each(function() {
            if ($(this).attr('href').length > 20) {
                page_count--;
                // create obj w/ enough info to create a listing
                q_page.push(blah,function(err) {
                    // log here?
                });
                if (page_count === 0) {
                    cb();
                }
            }
        });
    });
}


var q_list = async.queue(ah_list_get, 5); // 5 at a time?
q_list.drain = function() {
    console.log('Finished with list queue');
}

function ah_set(type,prev_type,prev_names,name) {
    var typeupper = type.charAt(0).toUpperCase() + type.slice(1); 
    if (prev_type) {
        MM[typeupper].find({prev_type+'_name': name},function(err,objs) {
            if (!objs || objs.length === 0) {
                //error
            }
            var ct = objs.length;
            var cur_names = new Array();
            objs.forEach(function(obj) {
                if (obj.ah_link) {
                    //push to queue
                    var ah_task = {};
                    for (var i=0; i<prev_names.length; i++) {
                       ah_task.place[names_list[i]] = prev_names[i]; 
                    }
                    ah_task.link = obj.ah_link;
                    ah_task.ah_link = obj.ah_link;
                    q_list.push(ah_task, function(err) {
                        //log here
                    });
                }
                else {
                    if (nextlvl[type]) {
                        prev_names.push(obj.name);
                        ah(nextlvl[type],type,prev_names,obj.name);
                    }
                }
            });
        });
    }
    else {
        MM[typeupper].find({name: name}, function(err,obj) {
            if (obj) {
                ah(nextlvl[type],type,prev_names,names);
            }
        });
    }
}


