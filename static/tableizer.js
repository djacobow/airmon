

function cr(what,clsn = null, it = null) {
    var x = document.createElement(what);
    if (clsn) {
        x.className = clsn;
    }
    if (it) {
        x.innerText = it;
    }
    return x;
}

function gebi(en) {
    return document.getElementById(en);
}

function exTrue(x,y) { return (x.hasOwnProperty(y) && x.y); }

function removeChildren(e) {
    if (typeof e === 'string') {
        e = document.getElementById(e);
    }
    while (e.firstChild) e.removeChild(e.firstChild);
    return e;
}


function GetJS(url,cb) {
    var xhr = new XMLHttpRequest();
    xhr.onerror = function(e) { 
        return cb('fetch_err',e);
    };
    xhr.onload = function() {
        if (xhr.status == 403) location.reload();
        var data = null;
        try {
            data = JSON.parse(xhr.responseText);
            return cb(null, data);
        } catch(e) {
            console.log('json no parsey',e);
            return cb('rdata did not parse', {responseText:xhr.responseText});
        }
    };
    xhr.open('GET',url);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send();
}


function zPad(num, size) {
    var s = num + '';
    while (s.length < size) {
        s = "0" + s;
    }
    return s;
}

function formatDate(d) {
    var year = d.getFullYear();
    var month = zPad(d.getMonth(),2);
    var date = zPad(d.getDate(),2);
    var hours = zPad(d.getHours(),2);
    var mins = zPad(d.getMinutes(),2);
    var secs = zPad(d.getSeconds(),2);
    var d0  = cr('div');
    var sp0 = cr('span',null,`${year}-${month}-${date}`);
    var br = cr('br');
    var sp1 = cr('span',null,`${hours}:${mins}:${secs}`);
    d0.appendChild(sp0);
    d0.appendChild(br);
    d0.appendChild(sp1);
    return d0;	   
}

function getModalDelta(data) {        
    var last_time = null;
    var delta_dict = {};
    data.forEach((datum) => {
        var time = Date.parse(datum.time);
        var delta = 0;
        if (last_time != null) {
            delta = 1000 * Math.floor(((time - last_time) / 1000) + 0.5);
	}
        if (delta in delta_dict) {
            delta_dict[delta] += 1;
	} else {
            delta_dict[delta] = 1;
	}
        last_time = time;
    });

    var modal_delta = Object.keys(delta_dict).reduce((a,b) => delta_dict[a] > delta_dict[b] ? a : b);

    if (delta_dict[modal_delta] >= 2) {
        return parseInt(modal_delta);
    }
    return null;
}

function marshallDataAndInsertGaps(data) {        
    var chartdata = [];
    var last_time = null;

    var modal_delta = getModalDelta(data);

    data.forEach((datum) => {
        var dv = datum.obs.aqi;
        var time = Date.parse(datum.time);
        if (dv.avg != null) {
            dv = dv.avg;
        }
        if ((modal_delta != null) && 
            (last_time != null)) {
            var this_delta = 1000 * Math.floor(((time - last_time) / 1000) + 0.5);
            if (this_delta > modal_delta) {
                chartdata.push({ 'x': last_time + modal_delta, 'y': null });
            }
        }
        chartdata.push({ 'x': time, 'y': dv });
        last_time = time;
    });
    return chartdata;
}

function marshallDataIgnoreGaps(data) {
    var chartdata = data.map((datum) => {
        var dv = datum.obs.aqi;
        if (dv.avg != null) {
            dv = dv.avg;
        }
        return { 'x': Date.parse(datum.time), 'y': dv }
    });
    return chartdata;
}

function tDeltaToHMS(tdelta) {
    var secs    = Math.floor(tdelta/1000);
    var days_f  = secs / (60 * 60 * 24);
    var days_i  = Math.floor(days_f);
    var hours_f = 24 * (days_f - days_i);
    var hours_i = Math.floor(hours_f);
    var minutes_f = 60 * (hours_f - hours_i);
    var minutes_i = Math.floor(minutes_f);
    var seconds_f = 60 * (minutes_f - minutes_i);
    var seconds_i = Math.floor(seconds_f);
    chunks = [];
    if (days_i) {
        chunks.push(days_i.toString() + 'd');
    }
    if (hours_i) {
        chunks.push(hours_i.toString() + 'h');
    }
    if (minutes_i) {
        chunks.push(minutes_i.toString() + 'm')
    }
    if (seconds_i) {
        chunks.push(seconds_i.toString() + 's')
    }
    return chunks.join(', ');
}

function makeGroup_table(target, name, data) {
    
    if (data.length) {

        var dnames = Object.keys(data[0].obs).sort();
        var header = cr('div','groupheader',`AQI by ${name}`);
        var subheader = cr('div','groupsubheader',`(last ${data.length} measurements)`);
        header.appendChild(subheader);
        var blockdiv = cr('div');
        blockdiv.appendChild(header)
        target.appendChild(blockdiv);
        var tablediv = cr('div');

        var table = cr('table','grouptable');
        table.style.display = 'none';
        blockdiv.appendChild(table);

        header.addEventListener('click', () => {
            if (table.style.display == 'none') {
                table.style.display = 'block';
	    } else {
                table.style.display = 'none';
	    }
	});

        var tr = cr('tr');
        var th0 = cr('th',null,'date');
        tr.appendChild(th0);

        table.appendChild(tr);
        var width = Math.floor(100 / (dnames.length+1));
        dnames.forEach((dname) => {
            dname = dname.replace('_',' ').replace('um','μm').replace('standard','std');
            var th = cr('th',null,dname.replace('_',' '));
            th.width = `${width}%`;
            tr.appendChild(th);
        });

        data.forEach((datum) => {
            var tr = cr('tr');
            var td0 = cr('td','datetd');
            td0.appendChild(formatDate(new Date(Date.parse(datum.time))));
            tr.appendChild(td0);
            dnames.forEach((dname) => {
                var dvalue = datum.obs[dname];
                if (dvalue.avg != null) {
		    dvalue = dvalue.avg;
		}
                var td = cr('td',null,Math.round(dvalue));
                tr.appendChild(td);
            });
            table.appendChild(tr);
        })

        var chartd = cr('div');
        chartd.className = 'ct-chart ct-major-sixth';

        var chartdata = marshallDataAndInsertGaps(data);
        var time_span = chartdata[chartdata.length-1]['x'] - chartdata[0]['x']
        var time_span_str = tDeltaToHMS(time_span);
        subheader.innerText = `(${chartdata.length} measurements, spanning ${time_span_str})`;

        target.appendChild(chartd);
        var chart = new Chartist.Line(chartd, {
            series: [
                {
                    name: 'AQI',
                    data: chartdata,
                }
            ]
        }, {
            axisX: {
                type:Chartist.FixedScaleAxis,
                divisor: 6,
                labelInterpolationFnc: (value) => {
                    return moment(value).format('MMM D HH:mm:ss');
		}
            },
            axisY: {
                axisTitle: 'AQI',
            },
	});
    }
}


function showit(err, data) {
    var tgroups = ['second','minute','10minute','hour','day'];
    var target = gebi('main');
    tgroups.forEach((tgroup, idx) => {
        var group_div = cr('div','groupdiv');
        target.appendChild(group_div);
        group_data = data[tgroup];
        makeGroup_table(group_div, tgroup, group_data);
    });
}

function start() {
    GetJS('/data',showit);
}
