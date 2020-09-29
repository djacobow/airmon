

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
        var chartdata = data.map((datum) => {
            var dv = datum.obs.aqi;
            if (dv.avg != null) {
                dv = dv.avg;
            }
            return { 'x': Date.parse(datum.time), 'y': dv }
	});

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
