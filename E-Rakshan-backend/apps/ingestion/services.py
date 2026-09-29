from math import *
RELIABILITY={"weather_station":.95,"field_officer":.90,"satellite":.88,"cctv":.75,"citizen":.60,"default":.50}
def confidence_for_incident(obj, reliability=None):
    reliability=reliability if reliability is not None else RELIABILITY.get(obj.source,.50)
    recency=1.0
    verification={"unverified":.35,"verified":.90,"responding":.90,"resolved":1.0}.get(obj.status,.35)
    authority=1.0 if obj.authority_confirmed else 0.0
    return round(reliability*(.75+.25*recency)*(.55+.45*verification)*(.70+.30*authority),4)

def normalize_record(record):
    return {
        "source":record.get("source","unknown"),
        "observed_at":record.get("observed_at"),
        "location":record.get("location"),
        "type":record.get("type"),
        "severity":record.get("severity",0),
        "metadata":record.get("metadata",{}),
    }
