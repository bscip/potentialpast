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


function ah_page_get(page,cb) {
}

var q_page = async.queue(ah_page_get, 5); // 5 at a time?
q_page.drain = function() {
    // we're all done
    //MM.mongoose.disconnect();
    //console.log('Worked!?');
}

function ah_list_get(list, cb) {
    request(list.link,function(err,resp,body) {
        var $ = cheerio.load(body);
        // look for additional pages
        // if found, queue them up

        // then move on to queueing up pages
    });
}


var q_list = async.queue(ah_list_get, 5); // 5 at a time?
q_list.drain = function() {
    // we're all done
    //MM.mongoose.disconnect();
    //console.log('Worked!?');
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
                    q.push(ah_task, function(err) {
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


