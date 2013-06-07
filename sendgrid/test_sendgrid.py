 #! /usr/bin/python

import os
from sendgrid import *

send_welcome('Brian', 'brian.tubergen@gmail.com')
send_notif('Brian', 'Momchil', 'San Francisco', '1/1/13', '2/2/13',
        'brian.tubergen@gmail.com')

