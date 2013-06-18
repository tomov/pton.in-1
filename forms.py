from flask.ext.wtf import Form, validators
from wtforms import TextField, DateField, HiddenField, BooleanField, TextAreaField
from wtforms import ValidationError
import re

def special_match(strg, search=re.compile(r'[^a-zA-Z0-9\-.]').search):
    return not bool(search(strg))

class NewTripForm(Form):
     location_name = TextField([validators.Required()])
     location_lat = HiddenField([validators.Required()])
     location_long = HiddenField([validators.Required()])
     start_date = DateField([validators.Required()], format='%m/%d/%Y')
     end_date = DateField([validators.Required()], format='%m/%d/%Y')
     looking_for_roomies = BooleanField()
     looking_for_housing = BooleanField()
     doing_what = TextField()
     comment = TextAreaField()

class NewEventForm(Form):
     group_id = HiddenField()
     title = TextField([validators.Required()])
     description = TextAreaField()
     url = TextField()
     location_name = TextField([validators.Required()])
     location_lat = HiddenField([validators.Required()])
     location_long = HiddenField([validators.Required()])
     start_date = DateField([validators.Required()], format='%m/%d/%Y')
     end_date = DateField([validators.Required()], format='%m/%d/%Y')

