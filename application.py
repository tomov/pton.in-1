import os
from flask import Flask, request, render_template, send_from_directory, Response, url_for, session, redirect, flash
from flask_oauth import OAuth

import model
from model import db
from model import User, Trip, Group, Alias
from model import create_db
from constants import *
from util import *

# this is to make it work on beanstalk...
# there you cannot give enviroment parameters custom names, gotta use the default ones
# TODO fix this (right now to work locally you either have to rename them or to use the stupid beanstalk names...)
# for a fast work around to launch locally, copy-paste the exports from export_env_vars in the command line and execute

SECRET_KEY = 'PARAM1'  # SECRET_KEY
FACEBOOK_APP_ID = 'PARAM2'   # FACEBOOK_APP_ID
FACEBOOK_APP_SECRET = 'PARAM3'  # FACEBOOK_APP_SECRET
SENDGRID_USERNAME = 'PARAM4' # SENDGRID_USERNAME
SENDGRID_PASSWORD = 'PARAM5' # SENDGRID_PASSWORD

#----------------------------------------
# initialization
#----------------------------------------

############# init app ##################

application = Flask(__name__)  # Amazon Beanstalk bs...
app = application              # ...and a hack around it

app.config.update(
    DEBUG = True,              # TODO (mom) remove before deploying
)

############# init db ###################

app.config['SQLALCHEMY_DATABASE_URI'] = DatabaseConstants.DATABASE_URI
db.init_app(app)

############ init fb oauth ##############

app.secret_key = os.environ[SECRET_KEY]
oauth = OAuth()

FACEBOOK_APP_ID = os.environ[FACEBOOK_APP_ID]
FACEBOOK_APP_SECRET = os.environ[FACEBOOK_APP_SECRET]
facebook = oauth.remote_app('facebook',
        base_url='https://graph.facebook.com/',
        request_token_url=None,
        access_token_url='/oauth/access_token',
        authorize_url='https://www.facebook.com/dialog/oauth',
        consumer_key=FACEBOOK_APP_ID,
        consumer_secret=FACEBOOK_APP_SECRET,
        request_token_params={'scope': 'email'}
        )


#----------------------------------------
# controllers
#----------------------------------------

@app.route("/")
def hello():
    return render_template('welcome.html')

@app.route("/login")
def login():
    return 'TODO'

#----------------------------------------
# api 
#----------------------------------------



#----------------------------------------
# launch
#----------------------------------------

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5555))
    app.run(host='0.0.0.0', port=port)



