import os
from flask import Flask, request, render_template, send_from_directory, Response, url_for, session, redirect, flash
from flask_oauth import OAuth
import json
import pprint
from datetime import datetime, timedelta
from wtforms.ext.sqlalchemy.orm import model_form
import urllib2
import urllib
from sqlalchemy import or_

from forms import NewTripForm, NewEventForm, NewMealForm, NewFbgroupForm
import model
from model import db
from model import User, Trip, Group, Alias, Event, Meal, Fbgroup, Rsvp, MealRsvp
from model import create_db
from model import GraphAPI
from constants import *
from util import *

# this is to make it work on beanstalk...
# there you cannot give enviroment parameters custom names, gotta use the default ones
# TODO fix this (right now to work locally you either have to rename them or to use the stupid beanstalk names...)
# for a fast work around to launch locally, copy-paste the exports from export_env_vars in the command line and execute

SECRET_KEY = 'PARAM1'  # SECRET_KEY
FACEBOOK_APP_ID = 'PARAM2'   # FACEBOOK_APP_ID
FACEBOOK_APP_SECRET = 'PARAM3'  # FACEBOOK_APP_SECRET
FACEBOOK_APP_TOKEN = 'PARAM4' # FACEBOOK_APP_TOKEN -- generated custom for each app
# TODO FIXME these are retired
#SENDGRID_USERNAME = 'PARAM4' # SENDGRID_USERNAME
#SENDGRID_PASSWORD = 'PARAM5' # SENDGRID_PASSWORD

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
        request_token_params={'scope': 'email,user_events,user_groups'}
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
        create_db()
        #Event.import_user_facebook_events(user, session['oauth_token'][0])
        #Event.import_friends_facebook_events(user, session['oauth_token'][0])

        # TODO FIXME remove
        #oauth_token = session['oauth_token'][0]
        #graph = GraphAPI(oauth_token)
        #events = graph.get_connections("me", "events", fields='name,description,id,start_time,end_time,location,venue')
        #return json.dumps(events)

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
        meal = Meal(user.id)
        meal_form = NewMealForm(obj=meal, secret_key=os.environ[SECRET_KEY])
        fbgroup = Fbgroup(user.id)
        fbgroup_form = NewFbgroupForm(obj=fbgroup, secret_key=os.environ[SECRET_KEY])
        # see if we need to ask user to add trip
        trip_count = Trip.query.filter_by(user_id=user.id).count()
        show_prompt = (trip_count == 0)
        return render_template('main.html', 
            group_alias=group_alias, group=group, 
            trip_form=trip_form, event_form=event_form, meal_form=meal_form, fbgroup_form=fbgroup_form,
            show_prompt=show_prompt)

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

# according to Facebook (https://developers.facebook.com/docs/opengraph/howtos/publishing-with-app-token/)
# we should only get the app access token (which is different from the user access token)
# once -- it's tied to the app secret, so long as the app secret is the same, this should also be the same
def get_app_access_token():
    data = {
        'client_id': FACEBOOK_APP_ID,
        'client_secret': FACEBOOK_APP_SECRET,
        'grant_type': 'client_credentials'
    }
    url_values = urllib.urlencode(data)
    print url_values  # The order may differ. 
    url = 'https://graph.facebook.com/oauth/access_token'
    full_url = url + '?' + url_values
    print full_url
    response = urllib2.urlopen(full_url)
    return response.read()

def get_pton_info(me):
    pton_info = {}
    PTON_SCHOOL_FBID = '18058830773'
    if 'education' in me.data:
        for school_d in me.data['education']:
            if school_d['school']['id'] == PTON_SCHOOL_FBID:
                pton_info = school_d
    return pton_info

@app.route('/login/authorized')
@facebook.authorized_handler
def facebook_authorized(resp):
    if resp is None:
        return 'Access denied: reason=%s error=%s' % (
                request.args['error_reason'],
                request.args['error_description']
                )
    # get user and token
    session['oauth_token'] = (resp['access_token'], '')
    me = facebook.get('/me')
    u = User.query.filter_by(fbid=me.data['id']).first()
    group_alias = request.args.get('group_alias')

    # see if user is new
    user_is_new = False
    if not u:
        pton_info = get_pton_info(me)
        if True or pton_info: # TODO this is a temporary hack b/c for some reason it doesn't always work... FIXME
            u = User.create_pton_student(me, pton_info)
            user_is_new = True
        else:
            return "Access denied. If you're a Princeton student, \
                connect your Princeton email to Facebook."

    # set session variables
    session['user_id'] = u.id
    session['user_first_name'] = u.first_name
    session['user_last_name'] = u.last_name
    session['logged_in'] = True

    # import user events
    Event.import_user_facebook_events(user, session['oauth_token'][0])

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

def json_response(ret):
    return json.dumps(ret)

def format_response(msg=None, error=False):
    if msg is None:
        ret = {}
    elif not error:
        ret = {'message' : msg, 'status': 'success'}
    if error:
        ret = {'error': msg, 'message': msg, 'status': 'failure'}
    return json.dumps(ret)

def format_response_2(msg=None, error=False):
    ret = {'message': msg}
    if error:
        ret['status'] = 'failure'
    else:
        ret['status'] = 'success'
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
        trip_dict['start_date'] = trip.start_date.strftime(DatetimeConstants.JS_DATE_INITIALIZER_FORMAT)
        trip_dict['end_date'] = trip.end_date.strftime(DatetimeConstants.JS_DATE_INITIALIZER_FORMAT)
        trip_dict['doing_what'] = trip.doing_what
        trip_dict['looking_for_roomies'] = trip.looking_for_roomies
        trip_dict['looking_for_housing'] = trip.looking_for_housing
        trip_dict['comment'] = trip.comment
        trip_dict['user_name'] = trip.user.first_name + ' ' + trip.user.last_name
        trip_dict['user_first_name'] = trip.user.first_name
        trip_dict['user_last_name'] = trip.user.last_name
        trip_dict['user_email'] = trip.user.email
        trip_dict['user_id'] = trip.user.id
        trip_dict['user_fbid'] = trip.user.fbid
        trip_dict['is_mine'] = (trip.user.id == session.get('user_id', None))
        trip_dict['start_date_form'] = trip.start_date.strftime(DatetimeConstants.WTFORMS_DATE_FORMAT)
        trip_dict['end_date_form'] = trip.end_date.strftime(DatetimeConstants.WTFORMS_DATE_FORMAT)
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
    now = str(datetime.now()-timedelta(days=1))
    if group:
        events = Event.query.filter(Event.group_id==group.id, Event.end_date >= now).order_by(Event.start_date).all()
    else:
        if group_alias == 'me':
            # the "me" page -- this is kind of hacky... maybe find a better way? also see get_group
            events = Event.query.filter(Event.user_id==session.get('user_id'), Event.end_date >= now).order_by(Event.start_date).all()
        else:
            events = Event.query.filter(Event.end_date >= now).order_by(Event.start_date).all()

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
        event_dict['start_time_short'] = event.start_date.strftime('%H:%M')
        event_dict['end_time_short'] = event.end_date.strftime('%H:%M')
        event_dict['start_date'] = event.start_date.strftime(DatetimeConstants.JS_DATE_INITIALIZER_FORMAT)
        event_dict['end_date'] = event.end_date.strftime(DatetimeConstants.JS_DATE_INITIALIZER_FORMAT)
        event_dict['user_name'] = event.user.first_name + ' ' + event.user.last_name
        event_dict['user_first_name'] = event.user.first_name
        event_dict['user_last_name'] = event.user.last_name
        event_dict['user_email'] = event.user.email
        event_dict['user_fbid'] = event.user.fbid
        event_dict['group_id'] = event.group_id
        event_dict['is_mine'] = (event.user.id == session.get('user_id', None))
        event_dict['start_date_form'] = event.start_date.strftime(DatetimeConstants.WTFORMS_DATETIME_FORMAT)   # FIXME
        event_dict['end_date_form'] = event.end_date.strftime(DatetimeConstants.WTFORMS_DATETIME_FORMAT)
        rsvp = Rsvp.query.filter_by(user_id=session.get('user_id'), event_id=event.id).first()
        if rsvp:
            rsvp_status = rsvp.status
        else:
            rsvp_status = 'no'
        event_dict['rsvp_status'] = rsvp_status
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

@app.route("/set_event_rsvp/<event_id>/<rsvp_status>", methods = ['GET'])
def set_event_rsvp(event_id, rsvp_status):
    if not session.get('logged_in'):
        return format_response('User not logged in', True)
    user = get_current_user()
    event = Event.query.filter_by(id=event_id).first()
    if not event:
        return format_response('No event with given id', True)

    rsvp = Rsvp.query.filter_by(user_id=session.get('user_id'), event_id=event.id).first()
    if rsvp:
        rsvp.status = rsvp_status
    else:
        rsvp = Rsvp(user, event)
        rsvp.status = rsvp_status
        db.session.add(rsvp)
    db.session.commit()
    return format_response('SUCCESS!')


###################### meals ###################################

@app.route("/<group_alias>/get_meals", methods=['GET'])
@app.route("/get_meals", methods=['GET'])
def get_meals(group_alias = None):
    if not session.get('logged_in'):
        return format_response('User not logged in', True)

    group = get_group(group_alias)
    user = get_current_user()
    now = str(datetime.now()-timedelta(days=1))
    if group_alias == 'me':
        # the "me" page -- this is kind of hacky... maybe find a better way? also see get_group
        meals = Meal.query.filter(Meal.user_id==user.id, Meal.when >= now).order_by(Meal.when).all()
    else:
        meals = Meal.query.filter(Meal.when >= now, 
            or_(user.id == Meal.user_id, Meal.invitees.any(User.id==user.id))).order_by(Meal.when).all()

    result_dict = []
    for meal in meals:
        meal_dict = dict()
        meal_dict['id'] = meal.id
        meal_dict['message'] = meal.message
        meal_dict['location_lat'] = meal.location_lat
        meal_dict['location_long'] = meal.location_long
        meal_dict['location_name'] = meal.location_name
        meal_dict['when_short'] = meal.when.strftime('%b %d') # TODO FIXME format include hour!!!
        meal_dict['when'] = meal.when.strftime(DatetimeConstants.JS_DATE_INITIALIZER_FORMAT)  # FIXME same...
        meal_dict['when_form'] = meal.when.strftime(DatetimeConstants.WTFORMS_DATETIME_FORMAT) # FIXME same
        meal_dict['user_name'] = meal.user.first_name + ' ' + meal.user.last_name
        meal_dict['user_first_name'] = meal.user.first_name
        meal_dict['user_last_name'] = meal.user.last_name
        meal_dict['user_email'] = meal.user.email
        meal_dict['user_fbid'] = meal.user.fbid
        meal_dict['is_mine'] = (meal.user.id == session.get('user_id', None))
        if meal_dict['is_mine']:
            meal_dict['invitees_yes'] = []
            meal_dict['invitees_no'] = []
            meal_dict['invitees_waiting'] = []
            rsvps = MealRsvp.query.filter_by(meal_id=meal.id).all()
            for rsvp in rsvps:
                invitee_name = rsvp.user.first_name + ' ' + rsvp.user.last_name
                if rsvp.confirmed == 1:
                    meal_dict['invitees_yes'].append(invitee_name)
                elif rsvp.confirmed == 0:
                    meal_dict['invitees_no'].append(invitee_name)
                else:
                    meal_dict['invitees_waiting'].append(invitee_name)
        meal_dict['invitees'] = []
        for invitee in meal.invitees:
            meal_dict['invitees'].append(invitee.first_name + ' ' + invitee.last_name)
        rsvp = MealRsvp.query.filter_by(user_id=session.get('user_id'), meal_id=meal.id).first()
        if rsvp:
            rsvp_confirmed = rsvp.confirmed
            rsvp_message = rsvp.message
        else:
            rsvp_confirmed = None
            rsvp_message = ''
        meal_dict['rsvp_confirmed'] = rsvp_confirmed
        meal_dict['rsvp_message'] = rsvp_message

        result_dict.append(meal_dict)

    dump = json.dumps(result_dict)
    return dump


@app.route("/add_meal", methods=['POST'])
def add_meal():
    if not session.get('logged_in'):
        return format_response('User not logged in', True)

    meal = Meal(session.get('user_id'))
    form = NewMealForm(obj=meal, secret_key=os.environ[SECRET_KEY])
    if form.validate_on_submit():
        form.populate_obj(meal)
        db.session.add(meal)
        db.session.commit()
        return format_response('SUCCESS!');

    return format_response('Could not add meal for some reason...', True) 

@app.route("/edit_meal/<meal_id>", methods=['POST'])
def edit_meal(meal_id):
    if not session.get('logged_in'):
        return format_response('User not logged in', True)
    meal = Meal.query.filter_by(id=meal_id).first()
    if not meal:
        return format_response('No meal with given id', True)
    if meal.user.id != session.get('user_id'):
        return format_response('Meal does not belong to logged in user', True)

    form = NewMealForm(obj=meal, secret_key=os.environ[SECRET_KEY])
    if form.validate_on_submit():
        form.populate_obj(meal)
        db.session.commit()
        return format_response('SUCCESS!');
    return format_response('Could not edit meal for some reason...', True)

@app.route("/delete_meal/<meal_id>", methods = ['GET'])
def delete_meal(meal_id):
    if not session.get('logged_in'):
        return format_response('User not logged in', True)
    meal = Meal.query.filter_by(id=meal_id).first()
    if not meal:
        return format_response('No meal with given id', True)
    if meal.user.id != session.get('user_id'):
        return format_response('Meal does not belong to logged in user', True)

    db.session.delete(meal)
    db.session.commit()
    return format_response('SUCCESS!')

@app.route("/set_meal_rsvp/<meal_id>/<confirmed>/<message>", methods = ['GET'])
def set_meal_rsvp(meal_id, confirmed, message):
    if not session.get('logged_in'):
        return format_response('User not logged in', True)
    user = get_current_user()
    meal = Meal.query.filter_by(id=meal_id).first()
    if not meal:
        return format_response('No meal with given id', True)

    print 'SET MEAL RSVP'
    print meal_id
    print confirmed
    print message
    rsvp = MealRsvp.query.filter_by(user_id=session.get('user_id'), meal_id=meal.id).first()
    if rsvp:
        rsvp.confirmed = confirmed
        rsvp.message = message
    else:
        rsvp = MealRsvp(user, meal)
        rsvp.confirmed = confirmed
        rsvp.message = message
        db.session.add(rsvp)
    db.session.commit()
    return json.dumps({'meal_id': meal_id})

##################### fb groups #############################

@app.route("/add_fbgroup", methods=['POST'])
def add_fbgroup():
    if not session.get('logged_in'):
        return format_response('User not logged in', True)

    then = str(datetime.now()-timedelta(days=30))
    fbgroups_count = Fbgroup.query.filter(Fbgroup.user_id==session.get('user_id'), Fbgroup.created >= then).count()
    if fbgroups_count >= LimitConstants.MAX_FBGROUPS_PER_USER_PER_MONTH:
        error_msg = 'You cannot create more than ' + str(LimitConstants.MAX_FBGROUPS_PER_USER_PER_MONTH) + ' Facebook groups per month (this limit is imposed from Facebook, not us). Try again in a few days.'
        # TODO ad-hoc error messages and ad-hoc protocol in general...
        return format_response_2(error_msg, True)

    fbgroup = Fbgroup(session.get('user_id'))
    form = NewFbgroupForm(obj=fbgroup, secret_key=os.environ[SECRET_KEY])
    if form.validate_on_submit():
        form.populate_obj(fbgroup)
        # TODO remove the print statements
        print fbgroup.name
        print fbgroup.description
        print fbgroup.privacy
        print len(fbgroup.invitees.all())
        if len(fbgroup.invitees.all()) > LimitConstants.MAX_USERS_PER_FBGROUP:
            error_msg = 'You cannot create a Facebook group with more than ' + str(LimitConstants.MAX_USERS_PER_FBGROUP) + ' members. Try zooming in more or selecting fewer users.'
            # TODO ad-hoc error messages and ad-hoc protocol in general...
            return format_response_2(error_msg, True)
        # add fbgroup on fb
        oauth_token = os.environ[FACEBOOK_APP_TOKEN]
        print oauth_token
        graph = GraphAPI(oauth_token)
        user = get_current_user()
        result = graph.put_object(FACEBOOK_APP_ID, 'groups',
            name=fbgroup.name,
            description=fbgroup.description,
            privacy=fbgroup.privacy,
            admin=user.fbid
        )
        print result
        if result:
            fbgroup.fbid = result['id']
            for invitee in fbgroup.invitees:
                print invitee
                print invitee.fbid
                graph.put_object(fbgroup.fbid, 'members' + '/' + invitee.fbid)
            db.session.add(fbgroup)
            db.session.commit()
            # TODO ad-hoc error messages and ad-hoc protocol in general...
            return json_response({'fbid': fbgroup.fbid, 'status': 'success'})

    return format_response('SERVER ERROR: Could not add fb group for some reason...', True) 

#----------------------------------------
# launch
#----------------------------------------

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)

