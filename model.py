#----------------------------------
#   THIS IS facebook.py ON TOP OF model.py
# BECAUSE THE STUPID AWS BEANSTALK SERVER FOR SOME WEIRD REASON
# WON'T IMPORT IT AS A SEPARATE MODULE. SCROLL BELOW FOR THE
# CONTENTS OF model.py
#----------------------------------


#!/usr/bin/env python
#
# Copyright 2010 Facebook
#
# Licensed under the Apache License, Version 2.0 (the "License"); you may
# not use this file except in compliance with the License. You may obtain
# a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
# WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
# License for the specific language governing permissions and limitations
# under the License.

"""Python client library for the Facebook Platform.

This client library is designed to support the Graph API and the
official Facebook JavaScript SDK, which is the canonical way to
implement Facebook authentication. Read more about the Graph API at
http://developers.facebook.com/docs/api. You can download the Facebook
JavaScript SDK at http://github.com/facebook/connect-js/.

If your application is using Google AppEngine's webapp framework, your
usage of this module might look like this:

user = facebook.get_user_from_cookie(self.request.cookies, key, secret)
if user:
    graph = facebook.GraphAPI(user["access_token"])
    profile = graph.get_object("me")
    friends = graph.get_connections("me", "friends")

"""

import cgi
import time
import urllib
import urllib2
import httplib
import hashlib
import hmac
import base64
import logging
import socket

# Find a JSON parser
try:
    import simplejson as json
except ImportError:
    try:
        from django.utils import simplejson as json
    except ImportError:
        import json
_parse_json = json.loads

# Find a query string parser
try:
    from urlparse import parse_qs
except ImportError:
    from cgi import parse_qs


class GraphAPI(object):
    """A client for the Facebook Graph API.

    See http://developers.facebook.com/docs/api for complete
    documentation for the API.

    The Graph API is made up of the objects in Facebook (e.g., people,
    pages, events, photos) and the connections between them (e.g.,
    friends, photo tags, and event RSVPs). This client provides access
    to those primitive types in a generic way. For example, given an
    OAuth access token, this will fetch the profile of the active user
    and the list of the user's friends:

       graph = facebook.GraphAPI(access_token)
       user = graph.get_object("me")
       friends = graph.get_connections(user["id"], "friends")

    You can see a list of all of the objects and connections supported
    by the API at http://developers.facebook.com/docs/reference/api/.

    You can obtain an access token via OAuth or by using the Facebook
    JavaScript SDK. See
    http://developers.facebook.com/docs/authentication/ for details.

    If you are using the JavaScript SDK, you can use the
    get_user_from_cookie() method below to get the OAuth access token
    for the active user from the cookie saved by the SDK.

    """
    def __init__(self, access_token=None, timeout=None):
        self.access_token = access_token
        self.timeout = timeout

    def get_object(self, id, **args):
        """Fetchs the given object from the graph."""
        return self.request(id, args)

    def get_objects(self, ids, **args):
        """Fetchs all of the given object from the graph.

        We return a map from ID to object. If any of the IDs are
        invalid, we raise an exception.
        """
        args["ids"] = ",".join(ids)
        return self.request("", args)

    def get_connections(self, id, connection_name, **args):
        """Fetchs the connections for given object."""
        return self.request(id + "/" + connection_name, args)

    def put_object(self, parent_object, connection_name, **data):
        """Writes the given object to the graph, connected to the given parent.

        For example,

            graph.put_object("me", "feed", message="Hello, world")

        writes "Hello, world" to the active user's wall. Likewise, this
        will comment on a the first post of the active user's feed:

            feed = graph.get_connections("me", "feed")
            post = feed["data"][0]
            graph.put_object(post["id"], "comments", message="First!")

        See http://developers.facebook.com/docs/api#publishing for all
        of the supported writeable objects.

        Certain write operations require extended permissions. For
        example, publishing to a user's feed requires the
        "publish_actions" permission. See
        http://developers.facebook.com/docs/publishing/ for details
        about publishing permissions.

        """
        assert self.access_token, "Write operations require an access token"
        return self.request(parent_object + "/" + connection_name,
                            post_args=data)

    def put_wall_post(self, message, attachment={}, profile_id="me"):
        """Writes a wall post to the given profile's wall.

        We default to writing to the authenticated user's wall if no
        profile_id is specified.

        attachment adds a structured attachment to the status message
        being posted to the Wall. It should be a dictionary of the form:

            {"name": "Link name"
             "link": "http://www.example.com/",
             "caption": "{*actor*} posted a new review",
             "description": "This is a longer description of the attachment",
             "picture": "http://www.example.com/thumbnail.jpg"}

        """
        return self.put_object(profile_id, "feed", message=message,
                               **attachment)

    def put_comment(self, object_id, message):
        """Writes the given comment on the given post."""
        return self.put_object(object_id, "comments", message=message)

    def put_like(self, object_id):
        """Likes the given post."""
        return self.put_object(object_id, "likes")

    def delete_object(self, id):
        """Deletes the object with the given ID from the graph."""
        self.request(id, post_args={"method": "delete"})

    def delete_request(self, user_id, request_id):
        """Deletes the Request with the given ID for the given user."""
        conn = httplib.HTTPSConnection('graph.facebook.com')

        url = '/%s_%s?%s' % (
            request_id,
            user_id,
            urllib.urlencode({'access_token': self.access_token}),
        )
        conn.request('DELETE', url)
        response = conn.getresponse()
        data = response.read()

        response = _parse_json(data)
        # Raise an error if we got one, but don't not if Facebook just
        # gave us a Bool value
        if (response and isinstance(response, dict) and response.get("error")):
            raise GraphAPIError(response)

        conn.close()

    def put_photo(self, image, message=None, album_id=None, **kwargs):
        """Uploads an image using multipart/form-data.

        image=File like object for the image
        message=Caption for your image
        album_id=None posts to /me/photos which uses or creates and uses
        an album for your application.

        """
        object_id = album_id or "me"
        #it would have been nice to reuse self.request;
        #but multipart is messy in urllib
        post_args = {
            'access_token': self.access_token,
            'source': image,
            'message': message,
        }
        post_args.update(kwargs)
        content_type, body = self._encode_multipart_form(post_args)
        req = urllib2.Request(("https://graph.facebook.com/%s/photos" %
                               object_id),
                              data=body)
        req.add_header('Content-Type', content_type)
        try:
            data = urllib2.urlopen(req).read()
        #For Python 3 use this:
        #except urllib2.HTTPError as e:
        except urllib2.HTTPError, e:
            data = e.read()  # Facebook sends OAuth errors as 400, and urllib2
                             # throws an exception, we want a GraphAPIError
        try:
            response = _parse_json(data)
            # Raise an error if we got one, but don't not if Facebook just
            # gave us a Bool value
            if (response and isinstance(response, dict) and
                    response.get("error")):
                raise GraphAPIError(response)
        except ValueError:
            response = data

        return response

    # based on: http://code.activestate.com/recipes/146306/
    def _encode_multipart_form(self, fields):
        """Encode files as 'multipart/form-data'.

        Fields are a dict of form name-> value. For files, value should
        be a file object. Other file-like objects might work and a fake
        name will be chosen.

        Returns (content_type, body) ready for httplib.HTTP instance.

        """
        BOUNDARY = '----------ThIs_Is_tHe_bouNdaRY_$'
        CRLF = '\r\n'
        L = []
        for (key, value) in fields.items():
            logging.debug("Encoding %s, (%s)%s" % (key, type(value), value))
            if not value:
                continue
            L.append('--' + BOUNDARY)
            if hasattr(value, 'read') and callable(value.read):
                filename = getattr(value, 'name', '%s.jpg' % key)
                L.append(('Content-Disposition: form-data;'
                          'name="%s";'
                          'filename="%s"') % (key, filename))
                L.append('Content-Type: image/jpeg')
                value = value.read()
                logging.debug(type(value))
            else:
                L.append('Content-Disposition: form-data; name="%s"' % key)
            L.append('')
            if isinstance(value, unicode):
                logging.debug("Convert to ascii")
                value = value.encode('ascii')
            L.append(value)
        L.append('--' + BOUNDARY + '--')
        L.append('')
        body = CRLF.join(L)
        content_type = 'multipart/form-data; boundary=%s' % BOUNDARY
        return content_type, body

    def request(self, path, args=None, post_args=None):
        """Fetches the given path in the Graph API.

        We translate args to a valid query string. If post_args is
        given, we send a POST request to the given path with the given
        arguments.

        """
        args = args or {}

        if self.access_token:
            if post_args is not None:
                post_args["access_token"] = self.access_token
            else:
                args["access_token"] = self.access_token
        post_data = None if post_args is None else urllib.urlencode(post_args)
        try:
            file = urllib2.urlopen("https://graph.facebook.com/" + path + "?" +
                                   urllib.urlencode(args),
                                   post_data, timeout=self.timeout)
        except urllib2.HTTPError, e:
            response = _parse_json(e.read())
            raise GraphAPIError(response)
        except TypeError:
            # Timeout support for Python <2.6
            if self.timeout:
                socket.setdefaulttimeout(self.timeout)
            file = urllib2.urlopen("https://graph.facebook.com/" + path + "?" +
                                   urllib.urlencode(args), post_data)
        try:
            fileInfo = file.info()
            if fileInfo.maintype == 'text':
                response = _parse_json(file.read())
            elif fileInfo.maintype == 'image':
                mimetype = fileInfo['content-type']
                response = {
                    "data": file.read(),
                    "mime-type": mimetype,
                    "url": file.url,
                }
            else:
                raise GraphAPIError('Maintype was not text or image')
        finally:
            file.close()
        if response and isinstance(response, dict) and response.get("error"):
            raise GraphAPIError(response["error"]["type"],
                                response["error"]["message"])
        return response

    def fql(self, query, args=None, post_args=None):
        """FQL query.

        Example query: "SELECT affiliations FROM user WHERE uid = me()"

        """
        args = args or {}
        if self.access_token:
            if post_args is not None:
                post_args["access_token"] = self.access_token
            else:
                args["access_token"] = self.access_token
        post_data = None if post_args is None else urllib.urlencode(post_args)

        """Check if query is a dict and
           use the multiquery method
           else use single query
        """
        if not isinstance(query, basestring):
            args["queries"] = query
            fql_method = 'fql.multiquery'
        else:
            args["query"] = query
            fql_method = 'fql.query'

        args["format"] = "json"

        try:
            file = urllib2.urlopen("https://api.facebook.com/method/" +
                                   fql_method + "?" + urllib.urlencode(args),
                                   post_data, timeout=self.timeout)
        except TypeError:
            # Timeout support for Python <2.6
            if self.timeout:
                socket.setdefaulttimeout(self.timeout)
            file = urllib2.urlopen("https://api.facebook.com/method/" +
                                   fql_method + "?" + urllib.urlencode(args),
                                   post_data)

        try:
            content = file.read()
            response = _parse_json(content)
            #Return a list if success, return a dictionary if failed
            if type(response) is dict and "error_code" in response:
                raise GraphAPIError(response)
        except Exception, e:
            raise e
        finally:
            file.close()

        return response

    def extend_access_token(self, app_id, app_secret):
        """
        Extends the expiration time of a valid OAuth access token. See
        <https://developers.facebook.com/roadmap/offline-access-removal/
        #extend_token>

        """
        args = {
            "client_id": app_id,
            "client_secret": app_secret,
            "grant_type": "fb_exchange_token",
            "fb_exchange_token": self.access_token,
        }
        response = urllib.urlopen("https://graph.facebook.com/oauth/"
                                  "access_token?" +
                                  urllib.urlencode(args)).read()
        query_str = parse_qs(response)
        if "access_token" in query_str:
            result = {"access_token": query_str["access_token"][0]}
            if "expires" in query_str:
                result["expires"] = query_str["expires"][0]
            return result
        else:
            response = json.loads(response)
            raise GraphAPIError(response)


class GraphAPIError(Exception):
    def __init__(self, result):
        #Exception.__init__(self, message)
        #self.type = type
        self.result = result
        try:
            self.type = result["error_code"]
        except:
            self.type = ""

        # OAuth 2.0 Draft 10
        try:
            self.message = result["error_description"]
        except:
            # OAuth 2.0 Draft 00
            try:
                self.message = result["error"]["message"]
            except:
                # REST server style
                try:
                    self.message = result["error_msg"]
                except:
                    self.message = result

        Exception.__init__(self, self.message)


def get_user_from_cookie(cookies, app_id, app_secret):
    """Parses the cookie set by the official Facebook JavaScript SDK.

    cookies should be a dictionary-like object mapping cookie names to
    cookie values.

    If the user is logged in via Facebook, we return a dictionary with
    the keys "uid" and "access_token". The former is the user's
    Facebook ID, and the latter can be used to make authenticated
    requests to the Graph API. If the user is not logged in, we
    return None.

    Download the official Facebook JavaScript SDK at
    http://github.com/facebook/connect-js/. Read more about Facebook
    authentication at
    http://developers.facebook.com/docs/authentication/.

    """
    cookie = cookies.get("fbsr_" + app_id, "")
    if not cookie:
        return None
    parsed_request = parse_signed_request(cookie, app_secret)
    if not parsed_request:
        return None
    try:
        result = get_access_token_from_code(parsed_request["code"], "",
                                            app_id, app_secret)
    except GraphAPIError:
        return None
    result["uid"] = parsed_request["user_id"]
    return result


def parse_signed_request(signed_request, app_secret):
    """ Return dictionary with signed request data.

    We return a dictionary containing the information in the
    signed_request. This includes a user_id if the user has authorised
    your application, as well as any information requested.

    If the signed_request is malformed or corrupted, False is returned.

    """
    try:
        encoded_sig, payload = map(str, signed_request.split('.', 1))

        sig = base64.urlsafe_b64decode(encoded_sig + "=" *
                                       ((4 - len(encoded_sig) % 4) % 4))
        data = base64.urlsafe_b64decode(payload + "=" *
                                        ((4 - len(payload) % 4) % 4))
    except IndexError:
        # Signed request was malformed.
        return False
    except TypeError:
        # Signed request had a corrupted payload.
        return False

    data = _parse_json(data)
    if data.get('algorithm', '').upper() != 'HMAC-SHA256':
        return False

    # HMAC can only handle ascii (byte) strings
    # http://bugs.python.org/issue5285
    app_secret = app_secret.encode('ascii')
    payload = payload.encode('ascii')

    expected_sig = hmac.new(app_secret,
                            msg=payload,
                            digestmod=hashlib.sha256).digest()
    if sig != expected_sig:
        return False

    return data


def auth_url(app_id, canvas_url, perms=None, **kwargs):
    url = "https://www.facebook.com/dialog/oauth?"
    kvps = {'client_id': app_id, 'redirect_uri': canvas_url}
    if perms:
        kvps['scope'] = ",".join(perms)
    kvps.update(kwargs)
    return url + urllib.urlencode(kvps)

def get_access_token_from_code(code, redirect_uri, app_id, app_secret):
    """Get an access token from the "code" returned from an OAuth dialog.

    Returns a dict containing the user-specific access token and its
    expiration date (if applicable).

    """
    args = {
        "code": code,
        "redirect_uri": redirect_uri,
        "client_id": app_id,
        "client_secret": app_secret,
    }
    # We would use GraphAPI.request() here, except for that the fact
    # that the response is a key-value pair, and not JSON.
    response = urllib.urlopen("https://graph.facebook.com/oauth/access_token" +
                              "?" + urllib.urlencode(args)).read()
    query_str = parse_qs(response)
    if "access_token" in query_str:
        result = {"access_token": query_str["access_token"][0]}
        if "expires" in query_str:
            result["expires"] = query_str["expires"][0]
        return result
    else:
        response = json.loads(response)
        raise GraphAPIError(response)


def get_app_access_token(app_id, app_secret):
    """Get the access_token for the app.

    This token can be used for insights and creating test users.

    app_id = retrieved from the developer page
    app_secret = retrieved from the developer page

    Returns the application access_token.

    """
    # Get an app access token
    args = {'grant_type': 'client_credentials',
            'client_id': app_id,
            'client_secret': app_secret}

    file = urllib2.urlopen("https://graph.facebook.com/oauth/access_token?" +
                           urllib.urlencode(args))

    try:
        result = file.read().split("=")[1]
    finally:
        file.close()

    return result


#-----------------------------------------
#
#  END OF facebook.py
#
#-----------------------------------------



#


#


#


#


#


#


#


#



#



#-----------------------------------------
#
#  START OF model.py 
#
#-----------------------------------------


from flask.ext.sqlalchemy import SQLAlchemy
from datetime import datetime
from sqlalchemy import select
from dateutil import parser
from sqlalchemy.orm import backref
from sqlalchemy import desc
from sqlalchemy.ext.associationproxy import association_proxy
from sqlalchemy import UniqueConstraint

from constants import DatabaseConstants
from sendgrid.sendgrid import send_welcome, send_notif
from util import distance_on_unit_sphere, facebook_url, datetime_to_mysql_datetime

db = SQLAlchemy()

users_groups_table = db.Table('users_groups',
    db.Column('user_id', db.Integer, db.ForeignKey('users.id')),
    db.Column('group_id', db.Integer, db.ForeignKey('groups.id'))
)

users_fbgroups_table = db.Table('users_fbgroups',
    db.Column('user_id', db.Integer, db.ForeignKey('users.id')),
    db.Column('fbgroup_id', db.Integer, db.ForeignKey('fbgroups.id'))
)

users_meals_table = db.Table('users_meals',
    db.Column('user_id', db.Integer, db.ForeignKey('users.id')),
    db.Column('meal_id', db.Integer, db.ForeignKey('meals.id')),
    db.Column('confirmed', db.Boolean),
    db.Column('message', db.String(length = 250))
)

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key = True)
    created = db.Column(db.DateTime)
    modified = db.Column(db.DateTime)
    fbid = db.Column(db.String(length = 50), primary_key = True)
    email = db.Column(db.String(length = 50, collation = 'utf8_general_ci'), unique = True)
    first_name = db.Column(db.String(length = 50, collation = 'utf8_general_ci'))
    last_name = db.Column(db.String(length = 50, collation = 'utf8_general_ci'))
    last_login = db.Column(db.DateTime)
    class_year = db.Column(db.Integer)
    major = db.Column(db.String(length = 50))
    trips = db.relationship('Trip', backref = 'user')
    events_owned = db.relationship('Event', backref = 'user')
    groups_owned = db.relationship('Group', backref = 'user')
    groups = db.relationship('Group', secondary = users_groups_table, backref = 'users')
    meals_suggested = db.relationship('Meal', backref = 'user')
    meals = db.relationship('Meal', secondary = users_meals_table, backref = backref('invitees', lazy='dynamic'))
    fbgroups_owned = db.relationship('Fbgroup', backref = 'user')
    fbgroups = db.relationship('Fbgroup', secondary = users_fbgroups_table, backref = backref('invitees', lazy='dynamic'))

    def __init__(self, fbid, email = None, first_name = None, last_name = None, class_year = None, major = None):
        self.fbid = fbid
        self.email = email
        self.first_name = first_name
        self.last_name = last_name
        self.created = datetime.utcnow()
        self.modified = self.created
        self.major = major
        self.class_year = class_year
        self.last_login = None

    def __repr__(self):
        return '%s %s' % (self.first_name, self.last_name)

    # me is the facebook object
    @classmethod
    def create_pton_student(cls, me, pton_info):
        major = pton_info.get('concentration', None)
        if major: 
            major = major[0].get('name')

        u = User(me.data['id'],
                email=me.data['email'], # may not be Princeton email
                first_name=me.data['first_name'],
                last_name=me.data['last_name'],
                class_year=pton_info.get('year', {}).get('name', None),
                major=major)
        db.session.add(u)
        db.session.commit()
        send_welcome(u.first_name, u.email)
        return u

    def notify_fb_friends(self, oauth_token, trip):
        graph = GraphAPI(oauth_token)
        profile = graph.get_object("me")
        friends = graph.get_connections("me", "friends")

        friend_list = [friend['id'] for friend in friends['data']]
        pton_in_friends = User.query.filter(User.fbid.in_(friend_list)).all()
        for friend in pton_in_friends:
            # i bet this won't scale
            trips = Trip.query.filter_by(user_id=friend.id)
            for friend_trip in trips:
                if friend_trip.start_date < trip.end_date and \
                    friend_trip.end_date > trip.start_date:
                    d = distance_on_unit_sphere(
                            trip.location_lat, trip.location_long,
                            friend_trip.location_lat, friend_trip.location_long)
                    max_dist_in_miles = 50
                    if d <= max_dist_in_miles:
                        send_notif(
                            to_user_firstname=friend.first_name,
                            friend_fullname="%s %s" % (self.first_name, self.last_name),
                            friend_loc=trip.location_name,
                            startdate=trip.start_date,
                            enddate=trip.end_date,
                            to_email=friend.email)

        """
        for fb_friend in friends['data']:
            print 'yay'
            friend = User.query.filter_by(fbid=fb_friend['id']).first()
            if friend:
                # friend has account on pton.in
                send_notif(
                    to_user_firstname=friend.first_name,
                    friend_fullname="%s %s" % (self.first_name, self.last_name),
                    friend_loc=trip.location_name,
                    startdate=trip.start_date,
                    enddate=trip.end_date,
                    to_email=friend.email)
                """

class Group(db.Model):
    __tablename__ = 'groups'
    id = db.Column(db.Integer, primary_key = True)
    created = db.Column(db.DateTime)
    modified = db.Column(db.DateTime)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    name = db.Column(db.String(length = 100))
    aliases = db.relationship('Alias', backref='group', 
        lazy='dynamic') # lazy=dynamic allows us to treat it like a query, e.g. group.aliases.first().name
    events = db.relationship('Event', backref='group')

    def __init__(self, name=None, user_id=None):
        self.name = name
        self.user_id = user_id
        self.created = datetime.utcnow()
        self.modified = self.created

    def __repr__(self):
        return '<Group %r>' % (self.name)


class Alias(db.Model):
    __tablename__ = 'aliases'
    id = db.Column(db.Integer, primary_key = True)
    created = db.Column(db.DateTime)
    modified = db.Column(db.DateTime)
    name = db.Column(db.String(length = 100))
    group_id = db.Column(db.Integer, db.ForeignKey('groups.id'))

    def __init__(self, name, group_id):
        self.name = name
        self.group_id = group_id
        self.created = datetime.utcnow()
        self.modified = self.created

    def __repr__(self):
        return '<Alias %r>' % (self.name)


class Trip(db.Model):
    __tablename__ = 'trips'
    id = db.Column(db.Integer, primary_key = True)
    created = db.Column(db.DateTime)
    modified = db.Column(db.DateTime)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    start_date = db.Column(db.DateTime)
    end_date = db.Column(db.DateTime)
    location_name = db.Column(db.String(length = 100, collation = 'utf8_general_ci'))
    location_lat = db.Column(db.Float(precision = 32))
    location_long = db.Column(db.Float(precision = 32))
    looking_for_roomies = db.Column(db.Boolean)
    looking_for_housing = db.Column(db.Boolean)
    doing_what = db.Column(db.String(length = 250, collation = 'utf8_general_ci'))
    comment = db.Column(db.String(length = 1000, collation = 'utf8_general_ci'))

    def __init__(self, user_id, start_date = None, end_date = None, location_name = None, location_lat = None, location_long = None):
        self.user_id = user_id
        self.start_date = start_date
        self.end_date = end_date
        self.location_name = location_name
        self.location_lat = location_lat
        self.location_long = location_long
        self.created = datetime.utcnow()
        self.modified = self.created

    def __repr__(self):
        return '<Trip %r>' % (self.location_name)


class Event(db.Model):
    __tablename__ = 'events'
    id = db.Column(db.Integer, primary_key = True)
    created = db.Column(db.DateTime)
    modified = db.Column(db.DateTime)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    group_id = db.Column(db.Integer, db.ForeignKey('groups.id'))
    title = db.Column(db.String(length = 100, collation = 'utf8_general_ci'))
    description = db.Column(db.String(length = 1000, collation = 'utf8_general_ci'))
    url = db.Column(db.String(length = 1000))
    start_date = db.Column(db.DateTime)
    end_date = db.Column(db.DateTime)
    location_name = db.Column(db.String(length = 100))
    location_lat = db.Column(db.Float(precision = 32))
    location_long = db.Column(db.Float(precision = 32))

    def __init__(self, user_id, group_id = None, title = None, description = None, url = None, start_date = None, end_date = None, location_name = None, location_lat = None, location_long = None):
        self.user_id = user_id
        self.group_id = group_id
        self.title = title
        self.description = description
        self.url = url
        self.start_date = start_date
        self.end_date = end_date
        self.location_name = location_name
        self.location_lat = location_lat
        self.location_long = location_long
        self.created = datetime.utcnow()
        self.modified = self.created

    def __repr__(self):
        return '<Event %r>' % (self.title)

    @staticmethod
    def from_facebook_event(user, fb_event):
        event = Event(user.id)
        event.title = fb_event.get('name')
        event.description = fb_event.get('description')
        event.url = facebook_url('events', fb_event['id'])
        if 'start_time' in fb_event:
            event.start_date = datetime_to_mysql_datetime(parser.parse(fb_event.get('start_time')))
        if 'end_time' in fb_event:
            event.end_date = datetime_to_mysql_datetime(parser.parse(fb_event.get('end_time')))
        else:
            event.end_date = event.start_date
        event.location_name = fb_event.get('location')
        if 'venue' in fb_event:
            # if possible, get lat/long from event
            print 'GOT FROM VENUE!!!!!'
            event.location_lat = fb_event['venue'].get('latitude')
            event.location_long = fb_event['venue'].get('longitude')
        if not event.location_lat or not event.location_long:
            # if not, find which trip the user is on during the event and use that information
            trip = Trip.query.filter(Trip.user_id == user.id, Trip.start_date <= event.start_date, Trip.end_date >= event.start_date).first()
            print 'GOT FROM TRIP'
            print 'start --> ' + event.start_date
            print 'end --> ' + event.end_date
            if trip:
                print trip
                event.location_lat = trip.location_lat
                event.location_long = trip.location_long
                if not event.location_name:
                    event.location_name = trip.location_name
            else:
                print '...........NO TRIP :(('
        return event

    @staticmethod
    def import_user_facebook_events(user, oauth_token):
        graph = GraphAPI(oauth_token)
        fb_events = graph.get_connections(user.fbid, "events", 
            fields="name,description,id,start_time,end_time,location,venue")

        for fb_event in fb_events['data']:
            print '----'
            print fb_event
            event = Event.from_facebook_event(user, fb_event)
            if not Event.query.filter_by(url=event.url).first(): # make sure we don't duplicate events
                db.session.add(event)
                db.session.commit()

    @staticmethod
    def import_friends_facebook_events(user, oauth_token):
        graph = GraphAPI(oauth_token)
        fb_friends = graph.get_connections("me", "friends")
        for fb_friend in fb_friends['data']:
            friend_fbid = fb_friend['id']
            print fb_friend['id']
            friend = User.query.filter_by(fbid = friend_fbid).first()
            if friend:
                print 'HE\'S ONE OF US!!!'
                Event.import_user_facebook_events(friend, oauth_token)



class Meal(db.Model):
    __tablename__ = 'meals'
    id = db.Column(db.Integer, primary_key = True)
    created = db.Column(db.DateTime)
    modified = db.Column(db.DateTime)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    when = db.Column(db.DateTime)
    message = db.Column(db.String(length = 1000, collation = 'utf8_general_ci'))
    location_name = db.Column(db.String(length = 100))
    location_lat = db.Column(db.Float(precision = 32))
    location_long = db.Column(db.Float(precision = 32))
    location_is_exact = db.Column(db.Boolean)

    def __init__(self, user_id, when = None, message = None, location_name = None, location_lat = None, location_long = None, location_is_exact = None):
        self.user_id = user_id
        self.when = when
        self.message = message
        self.location_name = location_name
        self.location_lat = location_lat
        self.location_long = location_long
        self.location_is_exact = location_is_exact
        self.created = datetime.utcnow()
        self.modified = self.created

    def __repr__(self):
        return '<Meal %r>' % (self.message)


class Fbgroup(db.Model):
    __tablename__ = 'fbgroups'
    id = db.Column(db.Integer, primary_key = True)
    created = db.Column(db.DateTime)
    modified = db.Column(db.DateTime)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    name = db.Column(db.String(length = 100, collation = 'utf8_general_ci'))
    description = db.Column(db.String(length = 1000, collation = 'utf8_general_ci'))
    privacy = db.Column(db.String(length = 50))
    fbid = db.Column(db.String(length = 50))

    def __init__(self, user_id, name = None, description = None, privacy = None, fbid = None):
        self.user_id = user_id
        self.name = name
        self.description = description
        self.privacy = privacy
        self.fbid = fbid
        self.created = datetime.utcnow()
        self.modified = self.created

    def __repr__(self):
        return '<Fbgroup %r>' % (self.name)

# call this somewhere in application.py/home, run and open home page
# then check if db is created and then remove it
# TODO (mom) I know, it's super ghetto, but that's the easiest way for now
def create_db():
    db.create_all()
