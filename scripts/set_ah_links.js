/*
 * Run once to init states and regions collections
 *
 */
var request      = require("request")
    , cheerio    = require("cheerio")
    , async      = require("async") 
    , MM         = require('../models/rents.js');

var count = 0;
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
    MM.mongoose.disconnect();
    console.log('Worked!?');
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
        function(areas_with_regions,callback) {
            MM.Area.find({}).where('name').nin(areas_with_regions, function(err,areas) {
                if (!areas || areas.length === 0) {
                    console.log('no areas');
                    error();
                }
                console.log('Found '+areas.length+' areas to check');
                areas.forEach(function(area) {
                    q.push(area, function(err) {
                        count++;
                        console.log(count+' '+area.name+' is done\n'); 
                    });
                });
            });
        }],
        function (error, result) {
           console.log('waterfall done!?'); 
        }
    );
}
setAHLink(function() { MM.mongoose.disconnect(); console.log('Well, something went wrong...'); });


