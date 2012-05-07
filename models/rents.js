var mongoose = require('mongoose/')
    , Schema = mongoose.Schema;

/*
 * Module exports
 */
var MM = {};
module.exports = MM;
MM.mongoose = mongoose;

/* 
 * Connect to db
 */
mongoose.connect('mongodb://localhost/rents');


/*
 * Model Definitions
 */
var State = new Schema();
State.add({
    name : {type: String, required: true }
});

var Area = new Schema();
Area.add({
    name       : {type : String, required : true},
    state_name : {type : String, required : true},
    link       : {type : String, required : true},
    ah_link    : {type : String}
});

var Region = new Schema();
Region.add({
    name      : {type : String, required : true},
    area_name : {type : String, required : true},
    link      : {type : String, required : true},
    ah_link   : {type : String}
    
});

var NBHood = new Schema();
NBHood.add({
    name        : {type : String, required : true},
    region_name : {type : String, required : true},
    //nhcode      : {type : Number, required : true),
    ah_link     : {type : String, required : true}
});

var Feature = new Schema();
Feature.add({
    name        : {type : String, required : true},
    description : {type : String}
});

var Listing = new Schema();
Listing.add({
    place : {
        state_name  : {type : String, index: true},
        area_name   : {type : String, index: true},
        region_name : {type : String, index: true},
        nbhood_name : {type : String}
    },
    features : [],
    cid : {type: Number, index: true},
    cost : {type : Number},
    title : {type : String},
    link : {type: String},
    date_posted : {type: Date, index: true},
    created : {type: Date, default: Date.now, required: true}
});

/*
 * Model Registers
 */
MM.State   = mongoose.model('State', State);
MM.Area    = mongoose.model('Area', Area);
MM.Region  = mongoose.model('Region', Region);
MM.NBHood  = mongoose.model('NBHood', NBHood);
MM.Feature = mongoose.model('Feature', Feature);
MM.Listing = mongoose.model('Listing', Listing);

