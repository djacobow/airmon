#!/usr/bin/env python3

import time, serial, threading, queue, datetime, csv
import pms5003
import aqi

import webapp, dateencoder


class AirMonitor():
    def __init__(self):
        self.keep_harvesting = True
        self.keep_unharvesting = True
        self.uart = serial.Serial("/dev/serial0", baudrate=9600, timeout=0.25)
        reset_pin = None
        self.pm25 = pms5003.PM25_UART(self.uart, reset_pin)
        self.dq = queue.Queue()
        self.history_fn = 'history.json'
        self.epochs = (
            {
                'name': 'second',
                'precursor': None,
                'max_len': 600,
                'precursor_len': None,
                'detector': lambda t: True,
            },
            {
                'name': 'minute',
                'precursor': 'second',
                'max_len': 60,
                'precursor_len': 60,
                'detector': lambda t: t.second == 0,
                'after_functions': [self.writeDB, self.writeAQI],
            },
            {
                'name': '10minute',
                'precursor': 'minute',
                'max_len': 72,
                'precursor_len': 10,
                'detector': lambda t: t.minute % 10 == 0 and t.second == 0,
            },
            {
                'name': 'hour',
                'precursor': '10minute',
                'max_len': 72,
                'precursor_len': 6,
                'detector': lambda t: t.minute == 0 and t.second == 0,
            },
            {
                'name': 'day',
                'precursor': 'hour',
                'max_len': 14,
                'precursor_len': 24,
                'detector': lambda t: t.hour == 0 and t.minute == 0 and t.second == 0,
            },
        )

        try:
            self.histdata = dateencoder.fromJS(self.history_fn)
        except Exception as e:
            print(f'Could not load history from {self.history_fn} because: {repr(e)}')
            print(f'Starting without history instead') 
            self.histdata = {}
            for e in self.epochs:
                self.histdata[e['name']] = []

        try:
            self.ofh = open('aqdata.csv','a+')
            self.csvwriter = csv.writer(self.ofh)
            self.aqfields = self.pm25.getFields()
            self.csvwriter.writerow(('date','aqi',) + self.aqfields)
            self.ofh.flush()
        except Exception as e:
            print(f'Could not open file, exception: {repr(e)}')


    def start(self):
        self.hthread = threading.Thread(target=self.harvest)
        self.uthread = threading.Thread(target=self.unharvest)
        self.hthread.start()
        self.uthread.start()

    def stop(self):
        self.hthread.join()
        self.uthread.join()
        print('All done.')

    def writeDB(self, now):
        try:
            d = self.getHistory()
            with open(self.history_fn,'w') as ofh:
                ofh.write(dateencoder.toJS(d))
        except Exception as e:
            print(f'-Error- Could not write history file: {self.history_fn} because {repr(e)}')

    def harvest(self):
        while self.keep_harvesting:
            time.sleep(1)
            aqdata = None
            try:
                aqdata = self.pm25.read()
            except Exception as e:
                print(f'Exception {repr(e)} trying to read sensor')
            if aqdata is not None:
                self.dq.put(aqdata)

    def reduceArrayOfDict(self, ad):
        alen = len(ad)
        if alen:
            rv = {}
            kns = ad[0].keys()
            for kn in kns:
                items = [ d[kn] for d in ad ]
                if isinstance(items[0],dict):
                    items = [ x['avg'] for x in items ]
                ksum = sum(items)
                rv[kn] = {
                    'max' : max(items),
                    'min' : min(items),
                    'avg' : sum(items) / alen,
                }
            return rv
        else:
            print(f'Can\'d reduce empty array.')
            return None


    def getHistory(self):
        return self.histdata

    def update_history(self, now, r):
        for e in self.epochs:
            go = e['detector'](now)
            if go:
                ename = e['name']
                print(f'go {ename}')
                if e['precursor'] is None:
                    self.histdata[ename].append({'time': now, 'obs': r})
                else:
                    prior_data = [ x['obs'] for x in self.histdata[e['precursor']][-e['precursor_len']:] ]

                    if len(prior_data) == e['precursor_len']:
                        self.histdata[ename].append({
                            'time': now,
                            'obs': self.reduceArrayOfDict(prior_data)
                        })
                if len(self.histdata[ename]) > e['max_len']:
                    self.histdata[ename].pop(0)

                cb_fns = e.get('after_functions',[])
                for cb_fn in cb_fns:
                    cb_fn(now)

    def writeAQI(self, now):
        if len(self.histdata['minute']):
            mindata = self.histdata['minute'][-1]['obs']
            #print('mindata',mindata)
            darry = [ mindata[x]['avg'] for x in ('aqi',) + self.aqfields ]
            self.csvwriter.writerow([str(now)] + darry)
            self.ofh.flush()


    def unharvest(self):
        while self.keep_unharvesting:
            aqdata = self.dq.get()
            aqdata['aqi'] = int(aqi.to_iaqi(aqi.POLLUTANT_PM25, aqdata['pm25_standard']).to_integral())
            now = datetime.datetime.now(datetime.timezone.utc).replace(microsecond=0)
            self.update_history(now, aqdata)


if __name__ == '__main__':
    am = AirMonitor()
    wa = webapp.WebApp(am)

    am.start()
    wa.run()
    am.stop()

