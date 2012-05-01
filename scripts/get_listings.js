/*
 * Pass in valid opts to gen listings
 * (intended for cron)
 */
var request      = require("request")
    , cheerio    = require("cheerio")
    , async      = require("async") 
    , MM         = require('../models/rents.js')
    , DT         = require('../util/date.js');

// opts:
var argv = require('optimist')
    .usage('Usage: $0 --type [string] --name [string]')
    .demand(['type','name'])
    .argv;

// log:
var fdt     = DT.moment(new Date()).format('YYYY-MM-DD');
var logpath = '/var/www/pp/logs/listings/'+argv.type+'_';
    logpath += argv.name.replace(/\s/g,'').toLowerCase()+'_'+fdt+'.log';
    console.log('logging to: '+logpath);
var winston = require("winston");
    winston.add(winston.transports.File, { filename: logpath });
    winston.remove(winston.transports.Console);

var name_list      = ['state_name','area_name','region_name','nbhood_name'];
var nextlvl        = new Array();
    nextlvl.state  = 'area';
    nextlvl.area   = 'region';
    nextlvl.region = 'NBHood';

var page_tasks = [];

function ah_page_get(page_task,cb) {
    // get cid from link
    var cid       = 0;
    var cid_match = /.*\/(\d+).*/.exec(page_task.link);
    if (cid_match) {
        cid = cid_match[1];
    }
    else {
        // can't find cid?  ditch out
        winston.info({listing_no_cid: page_task.link});
        cb();
    }
    var existing_listing = MM.Listing.findOne({cid: cid}, function(err,found) {
        if (found) {
            // we've seen this listing before, ditch out
            cb();
        }
    });
    if (!/^http.*/.exec(page_task.link.toLowerCase())) {
        page_task.link = 'http://'+page_task.link;
    }
    request(page_task.link,function(err,resp,body) {
        var $          = cheerio.load(body);
        var title      = $('body h2').html();
        var cost_match = /^\$(\d+).*/.exec(title);
        var cost       = 0;
        if (cost_match) {
            cost = cost_match[1];
        }
        else {
            // can't find a price, ditch it
            winston.info({listing_no_cost: page_task.link});
            cb();
        }
        var br_match = /.*?(\d+)br.*/.exec(title.toLowerCase());
        if (br_match) {
            var br = br_match[1];
        }
        else {
            br_match = /.*?(studio).*/.exec(title.toLowerCase());
            if (br_match) {
                var br = 0;// studio
            }
            else {
                // can't find a br count, ditch it
                winston.info({listing_no_br: page_task.link});
                cb();
            }
        }
        var date_match = /.*?Date:\s+(\d{4}-\d{2}-\d{2},\s+\d+:\d+\w{2}\s+\w{3}).*?/.exec(body);
        if (date_match) {
            var date_posted = DT.parse_rent_date(date_match[1]);
        }
        else {
            // no date!?, ditch it
            winston.info({listing_no_date: page_task.link});
            cb();
        }

        var listing_info = {
            place       : page_task.place,
            features    : [{br : br}],
            cid         : cid,
            cost        : cost,
            title       : title,
            link        : page_task.link,
            date_posted : date_posted,
            created     : Date.now()
        };
        var listing = new MM.Listing(listing_info);
        listing.save(function(err,data) {
            // ok, saved new listing, lets ditch out
            winston.info({listing: listing_info});
            cb();
        });
    });
}

var q_page = async.queue(ah_page_get, 5); // 5 at a time?
q_page.drain = function() {
    //we're all done ... ?
    MM.mongoose.disconnect();
    console.log('done');
    winston.info('closing successfully');
}

function ah_list_get(list_task, cb) {
    if (typeof(list_task.link) === 'undefined') {
        console.log('UNDEFINED LINK:  ');
        console.log(list_task);
        cb();
    }
    if (!/^http.*/.exec(list_task.link.toLowerCase())) {
        list_task.link = 'http://'+list_task.link;
    }
    request(list_task.link,function(err,resp,body) {
        var $ = cheerio.load(body);
        // look for additional pages
        // if found, queue them up
        if (list_task.paginate) {
            if ($('#messages').children().size() > 0) {
                // standard page
                // just grab next 10 until figure something else out
                var new_link = list_task.link;
                for (var i=1; i<=10; i++) {
                    var new_list_task = {};
                    new_list_task.place = list_task.place;
                    new_list_task.link = new_link+'index'+i+'00.html';
                    new_list_task.paginate = false;
console.log("QPUSH P:  "+new_list_task.link);
                    q_list.push(new_list_task,function(err) {
                        winston.info({list_task: new_list_task});
                    });
                }
            }
            else {
                //nbhood page w/ 1,2,3 links
                if ($('h4 a b').size() > 0) {
                    new_task_links = [];
                    $('h4 a').each(function() {
                        if (/\d/.exec($(this).html())) {
                            new_task_links[$(this).html()] = $(this).attr('href');
                        }
                    });
                    new_task_links.forEach(function(new_link) {
                        var new_list_task = {};
                        new_list_task.place = list_task.place;
                        new_list_task.link = new_link;
                        new_list_task.paginate = false;
console.log("QPUSH P:  "+new_list_task.link);
                        q_list.push(new_list_task,function(err) {
                            winston.info({list_task: new_list_task});
                        });
                    });
                }
            }
        }
        // then move on to queueing up pages for current list
        var page_count = 0;
        $('blockquote p a').each(function() {
            if ($(this).attr('href').length > 20) {
                page_count++;
            }
        });
        if (page_count > 0) {
            $('blockquote p a').each(function() {
                if ($(this).attr('href').length > 20) {
                    page_count--;
                    var page = {};
                    page.link = $(this).attr('href');
                    page.place = list_task.place;
                    page_tasks.push(page);
                    /*
                    q_page.push(page,function(err) {
                        winston.info({page_task: page});
                    });
                    */
                    if (page_count === 0) {
                        cb();
                    }
                }
            });
        }
        else {
            cb();
        }
    });
}


var q_list = async.queue(ah_list_get, 2); // 5 at a time?
q_list.drain = function() {
    q_page.push(page_tasks,function(err) {
    });
    console.log('Finished with list queue');
}

function ah_set(type,prev_type,prev_names,name) {
    var typeupper = type.charAt(0).toUpperCase() + type.slice(1); 
    var field_type = 'name';
    if (prev_type) {
        field_type = prev_type+'_name';
    }
    q = new Object();
    q[field_type] = name;
    MM[typeupper].find(q,function(err,objs) {
        if (!objs || objs.length === 0) {
            //error
        }
        var ct = objs.length;
        var cur_names = new Array();
        var obj_count = objs.length;
        objs.forEach(function(obj) {
            obj_count--;
            prev_names[prev_names_index[type]] = obj.name;
            if (obj.ah_link) {
                //push to queue
                var ah_task = {};
                ah_task.place = {};
                for (var i=0; i<prev_names.length; i++) {
                   ah_task.place[name_list[i]] = prev_names[i]; 
                }
                ah_task.link = obj.ah_link;
                ah_task.paginate = true;
                    console.log("QPUSH:  "+obj.ah_link);
                q_list.push(ah_task, function(err) {
                    winston.info({list_task: ah_task});
                });
            }
            else {
                if (nextlvl[type]) {
                    console.log("NEXT LVL:  "+nextlvl[type]);
                    ah_set(nextlvl[type],type,prev_names.slice(),obj.name);
                }
                else {
                    console.log('Done pulling records for list queue');
                }
            }
            if (obj_count === 0) {
                console.log('Done pulling records for list queue for level = '+type);
            }
        });
    });
}

var prev_names              = ['','','',''];
var prev_names_index        = new Array();
    prev_names_index.state  = 0;
    prev_names_index.area   = 1;
    prev_names_index.region = 2;
    prev_names_index.NBHood = 3;

ah_set(argv.type,null,prev_names.slice(),argv.name);
