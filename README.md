# AirMon

This is a simple web-based air monitor that can run on a Raspberry Pi using
a PMS5003 PM2.5 monitor.

Data is not written to a database, but is instead held in memory for a 
certain period, where it is used to make graphs of different time
averages and periods.

It also writes 1-minute average data to a file `aqdata.csv` as well,
which you can use in any spreadsheet.

## Credits

Started with the code from Adafruit

## Installation

I run mine on a Raspberry Pi Zero W. You only need to hook up the
sensors Vcc, GND, and serial tx pins.
    * Vcc to 5V on the Pi
    * gnd to any ground pin on the pi
    * PMS5003 tx pin to the Pi's UART 0 Rx pin.

On the Pi, you need to use `raspi-config` to enable the serial
port but disable it as a regular login console.

You need python3 installed as well as flask (I installed from apt)
and python-aqi (I installed from pip3)

## run as a daemon

You can copy the example systemd service file over to
`/etc/systemd/system` and then enable it like this:

```bash
sudo systemctl daemon-reload
sudo systemctl enable airmon
sudo sytemctl start airmon
```

After that you should be able to just go to the Pi's IP address
at port 5000 and see your graphs and charts. Note that when the
unit just starts up, there's not much data to show.

