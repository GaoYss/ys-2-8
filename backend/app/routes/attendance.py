from flask import Blueprint, jsonify, request

from app.data.store import store


attendance_bp = Blueprint("attendance", __name__)


@attendance_bp.get("")
def list_attendance():
    result = []
    for att in store.attendance:
        enriched = enrich_attendance(att)
        result.append(enriched)
    return jsonify(result)


@attendance_bp.post("")
def record_attendance():
    payload = request.get_json() or {}
    existing = next(
        (
            item
            for item in store.attendance
            if item["session_id"] == int(payload.get("session_id", 0))
            and item["student_id"] == int(payload.get("student_id", 0))
        ),
        None,
    )

    if existing:
        existing["status"] = payload.get("status", existing["status"])
        return jsonify(enrich_attendance(existing))

    record = {
        "id": store.next_id("attendance"),
        "session_id": int(payload.get("session_id", 0)),
        "student_id": int(payload.get("student_id", 0)),
        "status": payload.get("status", "present"),
    }
    store.attendance.append(record)
    return jsonify(enrich_attendance(record)), 201


def enrich_attendance(att):
    session = next(
        (item for item in store.schedule if item["id"] == att["session_id"]), None
    )
    result = {**att}
    if session:
        if session.get("transferred_from"):
            original_session = next(
                (
                    item
                    for item in store.schedule
                    if item["id"] == session["transferred_from"]
                ),
                None,
            )
            if original_session:
                result["original_session"] = {
                    "id": original_session["id"],
                    "date": original_session["date"],
                    "time": original_session["time"],
                    "room": original_session["room"],
                }
    return result
