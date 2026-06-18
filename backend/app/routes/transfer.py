from datetime import datetime

from flask import Blueprint, jsonify, request

from app.data.store import store
from app.services.scheduler import enrich_session


transfer_bp = Blueprint("transfer", __name__)


@transfer_bp.get("")
def list_transfer_requests():
    requests = []
    for req in store.transfer_requests:
        requests.append(enrich_transfer_request(req))
    return jsonify(requests)


@transfer_bp.get("/<int:request_id>")
def get_transfer_request(request_id):
    req = next(
        (item for item in store.transfer_requests if item["id"] == request_id), None
    )
    if not req:
        return jsonify({"message": "Transfer request not found"}), 404
    return jsonify(enrich_transfer_request(req))


@transfer_bp.post("")
def create_transfer_request():
    payload = request.get_json() or {}
    session_id = int(payload.get("session_id", 0))

    session = next(
        (item for item in store.schedule if item["id"] == session_id), None
    )
    if not session:
        return jsonify({"message": "Session not found"}), 404

    if session.get("transferred_to"):
        return jsonify({"message": "该课次已调课，不能再申请调课"}), 400

    pending_request = next(
        (
            item
            for item in store.transfer_requests
            if item["session_id"] == session_id and item["status"] == "pending"
        ),
        None,
    )
    if pending_request:
        return jsonify({"message": "A pending transfer request already exists for this session"}), 400

    now = datetime.now().isoformat()
    transfer_request = {
        "id": store.next_id("transfer_requests"),
        "session_id": session_id,
        "old_date": session["date"],
        "old_time": session["time"],
        "old_room": session["room"],
        "new_date": payload.get("new_date", session["date"]),
        "new_time": payload.get("new_time", session["time"]),
        "new_room": payload.get("new_room", session["room"]),
        "reason": payload.get("reason", ""),
        "applicant": payload.get("applicant", ""),
        "status": "pending",
        "approver": "",
        "approval_comment": "",
        "new_session_id": None,
        "created_at": now,
        "updated_at": now,
    }

    store.transfer_requests.append(transfer_request)
    return jsonify(enrich_transfer_request(transfer_request)), 201


@transfer_bp.put("/<int:request_id>")
def update_transfer_request(request_id):
    req = next(
        (item for item in store.transfer_requests if item["id"] == request_id), None
    )
    if not req:
        return jsonify({"message": "Transfer request not found"}), 404

    if req["status"] != "pending":
        return jsonify({"message": "Only pending requests can be updated"}), 400

    payload = request.get_json() or {}

    if "new_date" in payload:
        req["new_date"] = payload["new_date"]
    if "new_time" in payload:
        req["new_time"] = payload["new_time"]
    if "new_room" in payload:
        req["new_room"] = payload["new_room"]
    if "reason" in payload:
        req["reason"] = payload["reason"]
    if "applicant" in payload:
        req["applicant"] = payload["applicant"]

    req["updated_at"] = datetime.now().isoformat()
    return jsonify(enrich_transfer_request(req))


@transfer_bp.post("/<int:request_id>/approve")
def approve_transfer_request(request_id):
    req = next(
        (item for item in store.transfer_requests if item["id"] == request_id), None
    )
    if not req:
        return jsonify({"message": "Transfer request not found"}), 404

    if req["status"] != "pending":
        return jsonify({"message": "Only pending requests can be approved"}), 400

    payload = request.get_json() or {}
    session = next(
        (item for item in store.schedule if item["id"] == req["session_id"]), None
    )
    if not session:
        return jsonify({"message": "Original session not found"}), 404

    new_session = {
        "id": store.next_id("schedule"),
        "class_id": session["class_id"],
        "course_id": session["course_id"],
        "date": req["new_date"],
        "time": req["new_time"],
        "room": req["new_room"],
        "teacher": session["teacher"],
        "transferred_from": session["id"],
    }
    store.schedule.append(new_session)

    session["transferred_to"] = new_session["id"]

    for att in store.attendance:
        if att["session_id"] == session["id"]:
            att["original_session_id"] = session["id"]
            att["session_id"] = new_session["id"]

    req["status"] = "approved"
    req["approver"] = payload.get("approver", "")
    req["approval_comment"] = payload.get("comment", "")
    req["new_session_id"] = new_session["id"]
    req["updated_at"] = datetime.now().isoformat()

    return jsonify({
        "request": enrich_transfer_request(req),
        "new_session": enrich_session(new_session),
    })


@transfer_bp.post("/<int:request_id>/reject")
def reject_transfer_request(request_id):
    req = next(
        (item for item in store.transfer_requests if item["id"] == request_id), None
    )
    if not req:
        return jsonify({"message": "Transfer request not found"}), 404

    if req["status"] != "pending":
        return jsonify({"message": "Only pending requests can be rejected"}), 400

    payload = request.get_json() or {}
    req["status"] = "rejected"
    req["approver"] = payload.get("approver", "")
    req["approval_comment"] = payload.get("comment", "")
    req["updated_at"] = datetime.now().isoformat()

    return jsonify(enrich_transfer_request(req))


@transfer_bp.delete("/<int:request_id>")
def delete_transfer_request(request_id):
    req = next(
        (item for item in store.transfer_requests if item["id"] == request_id), None
    )
    if not req:
        return jsonify({"message": "Transfer request not found"}), 404

    if req["status"] != "pending":
        return jsonify({"message": "Only pending requests can be deleted"}), 400

    store.transfer_requests.remove(req)
    return jsonify({"message": "Transfer request deleted successfully"})


def enrich_transfer_request(req):
    session = next(
        (item for item in store.schedule if item["id"] == req["session_id"]), None
    )
    new_session = None
    if req.get("new_session_id"):
        new_session = next(
            (item for item in store.schedule if item["id"] == req["new_session_id"]),
            None,
        )
    training_class = None
    if session:
        training_class = next(
            (item for item in store.classes if item["id"] == session["class_id"]), None
        )
    course = None
    if session:
        course = next(
            (item for item in store.courses if item["id"] == session["course_id"]),
            None,
        )

    result = {
        **req,
        "class_name": training_class["name"] if training_class else "未知班级",
        "course_title": course["title"] if course else "未知课程",
        "teacher": session["teacher"] if session else "",
    }

    if new_session:
        result["new_session"] = enrich_session(new_session)

    return result
