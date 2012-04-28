/*
 * Run once to init areas and regions collections
 *
 */
var request      = require("request")
    , cheerio    = require("cheerio")
    , async      = require("async") 
    , MM         = require('../models/rents.js');

var can_drain = false;
var q = async.queue(function(task, callback) {
    request(task.link, function (err, resp, body) {
        var $ = cheerio.load(body);
        var ah = $('#hhh0').children().first().children().first().attr('href');
        if (ah.length > 5) {
            ah = 'aap/'; 
        }
        task.ah_link = task.link+ah;
        task.save();
        callback();
    });
}, 10); // 5 at a time?

q.drain = function() {
    // we're all done
    if (can_drain) {
        MM.mongoose.disconnect();
        console.log('Queue is done');
    }
}

function setAHLink(error) {
    async.waterfall([
        function(callback) {
            MM.Region.find({}, function(err,regions) {
                if (!regions || regions.length === 0) {
                    console.log('no regions');
                    error();
                }
                var region_count = regions.length;
                var areas_with_regions = new Array();
                console.log('Found '+region_count+' regions to check');
                regions.forEach(function(region) {
                    areas_with_regions.push(region.area_name);
                    q.push(region, function(err) {
                        region_count--;
                        if (region_count === 0) {
                            callback(null, areas_with_regions);
                        }
                    });
                });
            });
        },
        function(areas_with_regions,cb2) {
            MM.Area.where('name').nin(areas_with_regions).run(function(err,areas) {
                if (!areas || areas.length === 0) {
                    console.log('no areas');
                    error();
                }
                var area_count = areas.length;
                console.log('Found '+area_count+' areas to check');
                areas.forEach(function(area) {
                    q.push(area, function(err) {
                        area_count--;
                        if (area_count === 0) {
                            cb2(null,'');
                        }
                    });
                });
            });
        }],
        function (error, result) {
           can_drain = true;
        }
    );
}
setAHLink(function() { MM.mongoose.disconnect(); console.log('Well, something went wrong...'); });


