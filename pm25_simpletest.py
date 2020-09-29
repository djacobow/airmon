#!/usr/bin/env python3

"""
Example sketch to connect to PM2.5 sensor with either I2C or UART.
"""

# pylint: disable=unused-import
import time
import adafruit_pm25

reset_pin = None
# If you have a GPIO, its not a bad idea to connect it to the RESET pin
# reset_pin = DigitalInOut(board.G0)
# reset_pin.direction = Direction.OUTPUT
# reset_pin.value = False


# For use with a computer running Windows:
import serial
uart = serial.Serial("/dev/serial0", baudrate=9600, timeout=0.25)

# For use with microcontroller board:
# (Connect the sensor TX pin to the board/computer RX pin)
# uart = busio.UART(board.TX, board.RX, baudrate=9600)

# For use with Raspberry Pi/Linux:
# import serial
# uart = serial.Serial("/dev/ttyS0", baudrate=9600, timeout=0.25)

# For use with USB-to-serial cable:
# import serial
# uart = serial.Serial("/dev/ttyUSB0", baudrate=9600, timeout=0.25)

# Connect to a PM2.5 sensor over UART
pm25 = adafruit_pm25.PM25_UART(uart, reset_pin)

print("Found PM2.5 sensor, reading data...")

while True:
    time.sleep(1)

    try:
        aqdata = pm25.read()
        # print(aqdata)
    except RuntimeError:
        print("Unable to read from sensor, retrying...")
        continue

    print()
    print("Concentration Units (standard)")
    print("---------------------------------------")
    print(
        "PM 1.0: %d\tPM2.5: %d\tPM10: %d"
        % (aqdata["pm10_standard"], aqdata["pm25_standard"], aqdata["pm100_standard"])
    )
    print("Concentration Units (environmental)")
    print("---------------------------------------")
    print(
        "PM 1.0: %d\tPM2.5: %d\tPM10: %d"
        % (aqdata["pm10_env"], aqdata["pm25_env"], aqdata["pm100_env"])
    )
    print("---------------------------------------")
    print("Particles > 0.3um / 0.1L air:", aqdata["particles_03um"])
    print("Particles > 0.5um / 0.1L air:", aqdata["particles_05um"])
    print("Particles > 1.0um / 0.1L air:", aqdata["particles_10um"])
    print("Particles > 2.5um / 0.1L air:", aqdata["particles_25um"])
    print("Particles > 5.0um / 0.1L air:", aqdata["particles_50um"])
    print("Particles > 10 um / 0.1L air:", aqdata["particles_100um"])
    print("---------------------------------------")
