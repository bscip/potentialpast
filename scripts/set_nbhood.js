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
        console.log('inside '+task.link);
        var $ = cheerio.load(body);
        if ($('#hoodpicker').children().size() > 0) {
            var hoods = $('#hoodpicker div #nh').children(); 
            var hoods_count = hoods.length;
            console.log('**** Found '+hoods_count+' hoods');
            var rlink     = task.link;
            var rpieces   = rlink.split('/');
            var hood_link = rpieces[2]+'/search/'+rpieces[4]+'/'+rpieces[3];
            hood_link += '?query=&srchType=A&minAsk=&maxAsk=&bedrooms=&nh=';
            $.each(hoods, function(i) {
                console.log(hood_link);
                var nbhood = new MM.NBHood({
                    name        : $(this).html(),
                    region_name : task.name,
                    ah_link     : hood_link+$(this).attr('value')
                });
                console.log(nbhood);
                nbhood.save(function(error, data) { 
                    hoods_count--;
                    if(hoods_count === 0) {
                        callback();
                    }
                });
            });
        }
        else {
            console.log('no hoods');
            callback();
        }
    });
}, 5); // 5 at a time?

q.drain = function() {
    // we're all done
    MM.mongoose.disconnect();
    console.log('Worked!?');
}

function setnbhoods(err) {
    MM.Region.find({}, function(err,regions) {
        if (!regions || regions.length === 0) {
            console.log('no regions');
            err();
        }
        else {
            console.log('Found '+regions.length+' regions to check');
        }
        regions.forEach(function(region) {
           // console.log({name: region.name, link: region.ah_link});
            q.push({name: region.name, link: region.ah_link}, function(err) {
                count++;
                console.log(count+' '+region.name+' is done\n'); 
            });
        });
    });
}
setnbhoods(function() { MM.mongoose.disconnect(); console.log('Well, something went wrong...'); });


