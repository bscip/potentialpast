/*
 * Run once to init states and areas collections
 *
 */
var jsdom        = require("jsdom")
    , MM         = require('../models/rents.js')
    , async      = require("async") 
    , js_jq_link = 'http://code.jquery.com/jquery-1.7.1.min.js';


var q = async.queue(function(task, callback) {
    jsdom.env(task.link,[js_jq_link],function(errors,window) {
        console.log('using '+task.link);
        if (errors) {
            callback();
        }
        else {
            var $ = window.$;
            var regs = $('span.sublinks a');
            var regs_count = regs.length;
            if (regs_count > 1) {
                console.log('**** Found '+regs_count+' regs');
                $.each(regs, function(i) {
                    var region = new MM.Region({
                        name      : $(this).attr('title'),
                        area_name : task.name,
                        link      : task.link+$(this).attr('href')
                    });
                    region.save(function(error, data) { 
                        regs_count--;
                        if(regs_count === 0) {
                            callback();
                        }
                    });
                });
            }
            callback();
        }
    });
}, 10); // 10 at a time

q.drain = function() {
    // we're all done
    MM.mongoose.disconnect();
    console.log('Worked!?');
}

function setRegions(err) {
    //MM.Area.find({name: /^[a].*/i},function(err,areas){
    MM.Area.find({}, function(err,areas) {
        if (!areas || areas.length === 0) {
            console.log('no areas');
            err();
        }
        else {
            console.log('Found '+areas.length+' areas to check');
        }
        areas.forEach(function(area) {
            q.push({name: area.name, link: area.link}, function(err) {
                console.log(area.name+' is done\n'); 
            });
        });
    });
}
setRegions(function() { MM.mongoose.disconnect(); console.log('Well, something went wrong...'); });


