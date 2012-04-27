var moment = require('moment');

var utcoffsets = new Array();
    utcoffsets.ADT = '-0300';
    utcoffsets.AKDT = '-0800';
    utcoffsets.AKST = '-0900';
    utcoffsets.AST = '-0400';
    utcoffsets.CDT = '-0500';
    utcoffsets.CST = '-0600';
    utcoffsets.EDT = '-0400';
    utcoffsets.EGST = '+0000';
    utcoffsets.EGT = '-0100';
    utcoffsets.EST = '-0500';
    utcoffsets.HADT = '-0900';
    utcoffsets.HAST = '-1000';
    utcoffsets.MDT = '-0600';
    utcoffsets.MST = '-0700';
    utcoffsets.NDT = '-0230';
    utcoffsets.NST = '-0330';
    utcoffsets.PDT = '-0700';
    utcoffsets.PMDT = '-0200';
    utcoffsets.PMST = '-0300';
    utcoffsets.PST = '-0800';
    utcoffsets.WGST = '-0200';
    utcoffsets.WGT = '-0300';

var DT = {}
module.exports = DT;

DT.parse_rent_date = function(date) {
    var m = /(\d{4})-(\d{2})-(\d{2}),\s+(\d+):(\d+)(\w{2})\s+(\w{3})/.exec(date);
    var dstr = m[1]+'-'+m[2]+'-'+m[3]+' '+m[4]+':'+m[5]+m[6];
        dstr += ' '+utcoffsets[m[7]];
    var df = 'YYYY-MM-DD ';
        df += m[4].len === 2 ? 'hh' : 'h';
        df += ':mm'
        df += m[6].toLowerCase() === 'am' ? 'a' : 'A';
        df += ' Z';
    return moment(dstr,df).format();
};
