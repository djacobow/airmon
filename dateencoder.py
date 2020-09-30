import datetime, json

class JSONEncoderWithGMTDates(json.JSONEncoder):
    def default(self, obj):
        try:
            if isinstance(obj,datetime.datetime):
                return obj.isoformat()
            iterable = iter(obj)
        except TypeError:
            pass
        else:
            return list(iterable)

        return json.JSONEncoder.default(self, obj)

def toJS(d):
    return json.dumps(d,cls=JSONEncoderWithGMTDates)


def dateify(dct):
    if 'time' in dct:
        dct['time'] = datetime.datetime.fromisoformat(dct['time'])
    return dct


def fromJS(fn):
    try:
        with open(fn,'r') as ifh:
            d = json.load(ifh, object_hook=dateify)
            return d
    except Exception as e:
        print(f'Exception decoding {fn}: {repr(e)}')


if __name__ == '__main__':
    x = fromJS('q.json')
    print(x)
