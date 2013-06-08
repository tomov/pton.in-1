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

@app.route("/<group_alias>")  # doesn't override /login, etc controller urls
@app.route("/")
def hello(group_alias = None):
    return render_template('welcome.html')

@app.route("/<group_alias>/login")
@app.route("/login")
def login(group_alias = None):
    return facebook.authorize(callback=url_for('facebook_authorized',
        next=request.args.get('next') or request.referrer or None,
        _external=True, group_alias=group_alias))

@app.route("/<group_alias>/logout")
@app.route("/logout")
def logout(group_alias = None):
    return 'TODO'


#----------------------------------------
# facebook oauth stuff
#----------------------------------------

@app.route('/login/authorized')
@facebook.authorized_handler
def facebook_authorized(resp):
    if resp is None:
        return 'Access denied: reason=%s error=%s' % (
                request.args['error_reason'],
                request.args['error_description']
                )
    session['oauth_token'] = (resp['access_token'], '')
    me = facebook.get('/me')
    u = User.query.filter_by(fbid=me.data['id']).first()
    group_alias = request.args.get('group_alias')

    user_is_new = False
    if not u:
        pton_info = get_pton_info(me)
        if True or pton_info: # TODO this is a temporary hack b/c for some reason it doesn't always work... FIXME
            u = User.create_pton_student(me, pton_info)
            user_is_new = True
        else:
            return "Access denied. If you're a Princeton student, \
                connect your Princeton email to Facebook."

    session['user_id'] = u.id
    session['user_first_name'] = u.first_name
    session['user_last_name'] = u.last_name
    session['logged_in'] = True

    if user_is_new:
        # here we show the prompt
        if not group_alias:
            return redirect("/")
        else:
            return redirect(url_for(group_alias))
    else:
        if not group_alias:
            return redirect("/")
        else:
            return redirect(url_for(group_alias))

@facebook.tokengetter
def get_facebook_oauth_token():
    return session.get('oauth_token')

#----------------------------------------
# api 
#----------------------------------------



#----------------------------------------
# launch
#----------------------------------------

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)

