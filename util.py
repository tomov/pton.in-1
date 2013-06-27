import time
import math

def split_name(name):
    names = name.encode('utf-8').split(" ")
    if len(names) == 0:
        return "", ""
    if len(names) == 1:
        return names[0], ""
    return names[0], names[len(names) - 1]

def datetime_to_timestamp(date):
    return time.mktime(date.timetuple())

def datetime_to_mysql_datetime(date):
    return date.strftime('%Y-%m-%d %H:%M:%S')

def distance_on_unit_sphere(lat1, long1, lat2, long2):
    # Convert latitude and longitude to 
    # spherical coordinates in radians.
    degrees_to_radians = math.pi/180.0

    # phi = 90 - latitude
    phi1 = (90.0 - lat1)*degrees_to_radians
    phi2 = (90.0 - lat2)*degrees_to_radians

    # theta = longitude
    theta1 = long1*degrees_to_radians
    theta2 = long2*degrees_to_radians

    # Compute spherical distance from spherical coordinates.

    # For two locations in spherical coordinates 
    # (1, theta, phi) and (1, theta, phi)
    # cosine( arc length ) = 
    #    sin phi sin phi' cos(theta-theta') + cos phi cos phi'
    # distance = rho * arc length

    cos = (math.sin(phi1)*math.sin(phi2)*math.cos(theta1 - theta2) +
            math.cos(phi1)*math.cos(phi2))
    arc = math.acos( cos )

    # Remember to multiply arc by the radius of the earth 
    # in your favorite set of units to get length.
    earth_radius_miles = 3963.1676
    return arc * earth_radius_miles

def facebook_url(obj_type, obj_fbid):
    return 'https://www.facebook.com/' + obj_type + '/' + obj_fbid