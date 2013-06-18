import os
from flask import Flask, request, render_template, send_from_directory, Response, url_for, session, redirect, flash
from flask_oauth import OAuth
import json
import pprint
from datetime import datetime
from wtforms.ext.sqlalchemy.orm import model_form

from forms import NewTripForm, NewEventForm
import model
from model import db
from model import User, Trip, Group, Alias, Event
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
# helpers
#----------------------------------------

def get_current_user():
    if session.get('user_id', False):
        assert session.get('logged_in')
        return User.query.filter_by(id=session['user_id']).first()
    return None

def get_group(group_alias):
    if not group_alias:
        return None
    group_alias = group_alias.lower()
    if group_alias == 'me': # TODO hack... oh well.. also see get_trips
        return None
    alias = Alias.query.filter_by(name=group_alias).first()
    if alias:
        assert alias.group
        return alias.group 
    return None

#----------------------------------------
# controllers
#----------------------------------------

########### user stuff #######################

@app.route("/<group_alias>")  # doesn't override /login, etc controller urls
@app.route("/")
def index(group_alias = None):
    if not session.get('logged_in'):
        return render_template('welcome.html', group_alias=group_alias)
    else:
        user = get_current_user()
        # figure out group stuff
        group = get_group(group_alias)
        if group and group not in user.groups:
            user.groups.append(group)
            db.session.commit()
        # generate forms
        trip = Trip(user.id)
        trip_form = NewTripForm(obj=trip, secret_key=os.environ[SECRET_KEY])
        if group:
            event = Event(user.id, group.id)
        else:
            event = Event(user.id)
        event_form = NewEventForm(obj=event, secret_key=os.environ[SECRET_KEY])
        # see if we need to ask user to add trip
        trip_count = Trip.query.filter_by(user_id=user.id).count()
        show_prompt = (trip_count == 0)
        return render_template('main.html', group_alias=group_alias, group=group, trip_form=trip_form, event_form=event_form, show_prompt=show_prompt)

@app.route("/<group_alias>/login")
@app.route("/login")
def login(group_alias = None):
    return facebook.authorize(callback=url_for('facebook_authorized',
        next=request.args.get('next') or request.referrer or None,
        _external=True, group_alias=group_alias))

@app.route("/<group_alias>/logout")
@app.route("/logout")
def logout(group_alias = None):
    session.pop('oauth_token')
    session.pop('user_id')
    session.pop('user_first_name')
    session.pop('user_last_name')
    session.pop('logged_in')
    if not group_alias:
        return redirect(url_for("index"))
    else:
        return redirect(url_for("index", group_alias=group_alias))

############# group stuff ###########################

@app.route("/leave_group/<group_id>")
def leave_group(group_id):
    if not session.get('logged_in'):
        return format_response('user not logged in', true)
    user = get_current_user()
    group = Group.query.filter_by(id=group_id).first()
    if not group:
        return format_response('No trip with given id', True)
    user.groups.remove(group)
    db.session.commit()
    next_url = request.args.get('next_url')
    if next_url:
        return redirect(next_url)
    return redirect(url_for("index"))

@app.route("/join_group/<group_id>")
def join_group(group_id):
    if not session.get('logged_in'):
        return format_response('user not logged in', true)
    user = get_current_user()
    group = Group.query.filter_by(id=group_id).first()
    if not group:
        return format_response('No trip with given id', True)
    user.groups.append(group)
    db.session.commit()
    next_url = request.args.get('next_url')
    if next_url:
        return redirect(next_url)
    return redirect(url_for("index"))



@app.route('/my_groups')
def my_groups():
    if not session.get('logged_in'):
        return format_response('user not logged in', true)
    user = get_current_user()
    groups = Group.query.order_by(Group.name).all()
    return render_template('my_groups.html', user=user, groups=groups)


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
            return redirect(url_for("index"))
        else:
            return redirect(url_for("index", group_alias=group_alias))
    else:
        if not group_alias:
            return redirect(url_for("index"))
        else:
            return redirect(url_for("index", group_alias=group_alias))

@facebook.tokengetter
def get_facebook_oauth_token():
    return session.get('oauth_token')

#----------------------------------------
# api helpers
#---------------------------------------- 

def format_response(msg=None, error=False):
    if msg is None:
        ret = {}
    elif not error:
        ret = {'message' : msg}
    if error:
        ret = {'error': msg}
    return json.dumps(ret)

#----------------------------------------
# api 
#----------------------------------------

######################### trips ###########################

@app.route("/<group_alias>/get_trips", methods=['GET'])
@app.route("/get_trips", methods=['GET'])
def get_trips(group_alias = None):
    if not session.get('logged_in'):
        return format_response('User not logged in', True)

    group = get_group(group_alias)
    if group:
        trips = Trip.query.filter(Trip.user.has(User.groups.any(Group.id==group.id)))
    else:
        if group_alias == 'me':
            # the "me" page -- this is kind of hacky... maybe find a better way? also see get_group
            trips = Trip.query.filter_by(user_id=session.get('user_id'))
        else:
            trips = Trip.query.all()

    result_dict = []
    for trip in trips:
        trip_dict = dict()
        trip_dict['id'] = trip.id
        trip_dict['location_lat'] = trip.location_lat
        trip_dict['location_long'] = trip.location_long
        trip_dict['location_name'] = trip.location_name
        trip_dict['start_date_short'] = trip.start_date.strftime('%b %d')
        trip_dict['end_date_short'] = trip.end_date.strftime('%b %d')
        trip_dict['start_date'] = trip.start_date.strftime('%Y-%m-%d')
        trip_dict['end_date'] = trip.end_date.strftime('%Y-%m-%d')
        trip_dict['doing_what'] = trip.doing_what
        trip_dict['looking_for_roomies'] = trip.looking_for_roomies
        trip_dict['looking_for_housing'] = trip.looking_for_housing
        trip_dict['comment'] = trip.comment
        trip_dict['user_name'] = trip.user.first_name + ' ' + trip.user.last_name
        trip_dict['user_first_name'] = trip.user.first_name
        trip_dict['user_last_name'] = trip.user.last_name
        trip_dict['user_email'] = trip.user.email
        trip_dict['user_fbid'] = trip.user.fbid
        trip_dict['is_mine'] = (trip.user.id == session.get('user_id', None))
        trip_dict['start_date_form'] = trip.start_date.strftime('%m/%d/%Y')
        trip_dict['end_date_form'] = trip.end_date.strftime('%m/%d/%Y')
        result_dict.append(trip_dict)

    dump = json.dumps(result_dict)
    return dump

@app.route("/add_trip", methods=['POST'])
def add_trip():
    if not session.get('logged_in'):
        return format_response('User not logged in', True)

    trip = Trip(session.get('user_id'))
    form = NewTripForm(obj=trip, secret_key=os.environ[SECRET_KEY])
    if form.validate_on_submit():
        form.populate_obj(trip)
        db.session.add(trip)
        db.session.commit()
        return format_response('SUCCESS!');

    return format_response('Could not add trip for some reason...', True) 

@app.route("/edit_trip/<trip_id>", methods=['POST'])
def edit_trip(trip_id):
    if not session.get('logged_in'):
        return format_response('User not logged in', True)
    trip = Trip.query.filter_by(id=trip_id).first()
    if not trip:
        return format_response('No trip with given id', True)
    if trip.user.id != session.get('user_id'):
        return format_response('Trip does not belong to logged in user', True)

    form = NewTripForm(obj=trip, secret_key=os.environ[SECRET_KEY])
    if form.validate_on_submit():
        form.populate_obj(trip)
        db.session.commit()
        return format_response('SUCCESS!');
    return format_response('Could not edit trip for some reason...', True)

@app.route("/delete_trip/<trip_id>", methods = ['GET'])
def delete_trip(trip_id):
    if not session.get('logged_in'):
        return format_response('User not logged in', True)
    trip = Trip.query.filter_by(id=trip_id).first()
    if not trip:
        return format_response('No trip with given id', True)
    if trip.user.id != session.get('user_id'):
        return format_response('Trip does not belong to logged in user', True)

    db.session.delete(trip)
    db.session.commit()
    return format_response('SUCCESS!')

@app.route("/change_dates/<trip_id>", methods = ['GET'])
def change_dates(trip_id):
    if not session.get('logged_in'):
        return format_response('User not logged in', True)
    trip = Trip.query.filter_by(id=trip_id).first()
    if not trip:
        return format_response('No trip with given id', True)
    if trip.user.id != session.get('user_id'):
        return format_response('Trip does not belong to logged in user', True)

    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    trip.start_date = datetime.fromtimestamp(float(start_date))
    trip.end_date = datetime.fromtimestamp(float(end_date))
    db.session.commit()
    return format_response('SUCCESS!')

@app.route("/change_latlong/<trip_id>", methods = ['GET'])
def change_latlong(trip_id):
    if not session.get('logged_in'):
        return format_response('User not logged in', True)
    trip = Trip.query.filter_by(id=trip_id).first()
    if not trip:
        return format_response('No trip with given id', True)
    if trip.user.id != session.get('user_id'):
        return format_response('Trip does not belong to logged in user', True)

    location_lat = request.args.get('location_lat')
    location_long = request.args.get('location_long')
    trip.location_lat = location_lat
    trip.location_long = location_long
    db.session.commit()
    return format_response('SUCCESS!')

###################### events ###################################

@app.route("/<group_alias>/get_events", methods=['GET'])
@app.route("/get_events", methods=['GET'])
def get_events(group_alias = None):
    if not session.get('logged_in'):
        return format_response('User not logged in', True)

    group = get_group(group_alias)
    if group:
        events = Event.query.filter_by(group_id=group.id)
    else:
        if group_alias == 'me':
            # the "me" page -- this is kind of hacky... maybe find a better way? also see get_group
            events = Event.query.filter_by(user_id=session.get('user_id'))
        else:
            events = Event.query.all()

    result_dict = []
    for event in events:
        event_dict = dict()
        event_dict['id'] = event.id
        event_dict['title'] = event.title
        event_dict['description'] = event.description
        event_dict['url'] = event.url
        event_dict['location_lat'] = event.location_lat
        event_dict['location_long'] = event.location_long
        event_dict['location_name'] = event.location_name
        event_dict['start_date_short'] = event.start_date.strftime('%b %d')
        event_dict['end_date_short'] = event.end_date.strftime('%b %d')
        event_dict['start_date'] = event.start_date.strftime('%Y-%m-%d')
        event_dict['end_date'] = event.end_date.strftime('%Y-%m-%d')
        event_dict['user_name'] = event.user.first_name + ' ' + event.user.last_name
        event_dict['user_first_name'] = event.user.first_name
        event_dict['user_last_name'] = event.user.last_name
        event_dict['user_email'] = event.user.email
        event_dict['user_fbid'] = event.user.fbid
        event_dict['group_id'] = event.group_id
        event_dict['is_mine'] = (event.user.id == session.get('user_id', None))
        event_dict['start_date_form'] = event.start_date.strftime('%m/%d/%Y')
        event_dict['end_date_form'] = event.end_date.strftime('%m/%d/%Y')
        result_dict.append(event_dict)

    dump = json.dumps(result_dict)
    return dump


@app.route("/add_event", methods=['POST'])
def add_event():
    if not session.get('logged_in'):
        return format_response('User not logged in', True)

    event = Event(session.get('user_id'))
    form = NewEventForm(obj=event, secret_key=os.environ[SECRET_KEY])
    if form.validate_on_submit():
        form.populate_obj(event)
        db.session.add(event)
        db.session.commit()
        return format_response('SUCCESS!');

    return format_response('Could not add event for some reason...', True) 

@app.route("/edit_event/<event_id>", methods=['POST'])
def edit_event(event_id):
    if not session.get('logged_in'):
        return format_response('User not logged in', True)
    event = Event.query.filter_by(id=event_id).first()
    if not event:
        return format_response('No event with given id', True)
    if event.user.id != session.get('user_id'):
        return format_response('Event does not belong to logged in user', True)

    form = NewEventForm(obj=event, secret_key=os.environ[SECRET_KEY])
    if form.validate_on_submit():
        form.populate_obj(event)
        db.session.commit()
        return format_response('SUCCESS!');
    return format_response('Could not edit event for some reason...', True)

@app.route("/delete_event/<event_id>", methods = ['GET'])
def delete_event(event_id):
    if not session.get('logged_in'):
        return format_response('User not logged in', True)
    event = Event.query.filter_by(id=event_id).first()
    if not event:
        return format_response('No event with given id', True)
    if event.user.id != session.get('user_id'):
        return format_response('Event does not belong to logged in user', True)

    db.session.delete(event)
    db.session.commit()
    return format_response('SUCCESS!')


#----------------------------------------
# launch
#----------------------------------------

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)

