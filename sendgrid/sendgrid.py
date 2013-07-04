import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from_email = "princeton.in.blank@gmail.com"

# TODO FIXME these are retired....
SENDGRID_USERNAME = 'PARAM4' # SENDGRID_USERNAME
SENDGRID_PASSWORD = 'PARAM5' # SENDGRID_PASSWORD

def send_email(subject, text, to_email):
    # Create message container - the correct MIME type is multipart/alternative.
    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = from_email
    msg['To'] = to_email

    # Login credentials
    username = os.environ[SENDGRID_USERNAME]
    password = os.environ[SENDGRID_PASSWORD]

    # Record the MIME types of both parts - text/plain and text/html.
    part1 = MIMEText(text, 'plain')
    # part2 = MIMEText(html, 'html')

    # Attach parts into message container.
    msg.attach(part1)
    # msg.attach(part2)

    # Open a connection to the SendGrid mail server
    s = smtplib.SMTP('smtp.sendgrid.net', 587)

    # Authenticate
    s.login(username, password)

    # sendmail function takes 3 arguments: sender's address, recipient's address
    # and message to send - here it is sent as one string.
    s.sendmail(from_email, to_email, msg.as_string())

    s.quit()

def send_notif(
        to_user_firstname,
        friend_fullname,
        friend_loc,
        startdate,
        enddate,
        to_email):
    d = { 'to_user_firstname': to_user_firstname, 
          'friend_fullname': friend_fullname,
          'friend_loc': friend_loc,
          'startdate': startdate,
          'enddate': enddate,
          'company': 'pton.in'
        }

    text = """
    Hi {to_user_firstname}!

    Your friend {friend_fullname} will be in {friend_loc} between {startdate} and {enddate}.

    Best,

    The {company} team
    """.format(**d)
    subject = '%s will be nearby!' % d['friend_fullname']
    send_email(subject, text, to_email)

def send_welcome(
        user_firstname,
        to_email):
    d = { 'user_firstname': user_firstname, 
          'company': 'pton.in'
        }

    text = """
    Hi {user_firstname}!

    Thanks for creating an account at {company}! Please contact us with comments or suggestions.

    Best,

    The {company} team
    """.format(**d)
    subject = 'Welcome to %s!' % d['company']
    send_email(subject, text, to_email)
