#!/usr/bin/env python3

import time, json
import flask
import dateencoder

class WebApp():
    def __init__(self, am):
        self.app = flask.Flask(__name__)
        self.am = am
        self.app.route('/data')(self.ww_data)
        self.app.route('/')(self.ww_index)
        self.app.route('/tableizer.js')(self.ww_js)
        self.app.route('/style.css')(self.ww_css)

    def run(self):
        self.app.run(debug=False, host='0.0.0.0')

    def splat(self,fn):
        try:
            with open(fn,'r') as ifh:
                return ifh.read()
        except:
            return None

    def ww_data(self):
        return flask.Response(dateencoder.toJS(self.am.getHistory()), mimetype='application/json')

    def ww_index(self):
        return self.splat('static/index.html')

    def ww_js(self):
        return self.splat('static/tableizer.js')

    def ww_css(self):
        return self.splat('static/style.css')

