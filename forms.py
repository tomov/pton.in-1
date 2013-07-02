from flask.ext.wtf import Form, validators
from wtforms import TextField, DateField, HiddenField, BooleanField, TextAreaField, IntegerField, DateTimeField
from wtforms.widgets import HiddenInput
from wtforms import ValidationError
from wtforms.ext.sqlalchemy.fields import QuerySelectMultipleField
import re

from model import User
from constants import DatetimeConstants

def special_match(strg, search=re.compile(r'[^a-zA-Z0-9\-.]').search):
    return not bool(search(strg))

class NewTripForm(Form):
     location_name = TextField([validators.Required()])
     location_lat = HiddenField([validators.Required()])
     location_long = HiddenField([validators.Required()])
     start_date = DateField([validators.Required()], format=DatetimeConstants.WTFORMS_DATE_FORMAT)
     end_date = DateField([validators.Required()], format=DatetimeConstants.WTFORMS_DATE_FORMAT)
     looking_for_roomies = BooleanField()
     looking_for_housing = BooleanField()
     doing_what = TextField()
     comment = TextAreaField()

class NewEventForm(Form):
     group_id = IntegerField(widget=HiddenInput())
     title = TextField([validators.Required()])
     description = TextAreaField()
     url = TextField()
     location_name = TextField([validators.Required()])
     location_lat = HiddenField([validators.Required()])
     location_long = HiddenField([validators.Required()])
     start_date = DateTimeField([validators.Required()], format=DatetimeConstants.WTFORMS_DATETIME_FORMAT)
     end_date = DateTimeField([validators.Required()], format=DatetimeConstants.WTFORMS_DATETIME_FORMAT)

def all_users():
     return User.query.order_by(User.first_name, User.last_name)

class NewMealForm(Form):
     invitees = QuerySelectMultipleField([validators.Required()], query_factory=all_users)
     when = DateTimeField([validators.Required()], format=DatetimeConstants.WTFORMS_DATETIME_FORMAT)
     message = TextAreaField([validators.Required()])
     location_name = TextField([validators.Required()])
     location_lat = HiddenField([validators.Required()])
     location_long = HiddenField([validators.Required()])

