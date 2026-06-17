import { useState } from "react";
import {
  Check,
  X,
  Edit2,
  Trash2,
  Plus,
  Clock,
  MapPin,
  Calendar,
  RefreshCw,
} from "lucide-react";
import { SectionHeader } from "../../components/SectionHeader";

const TIME_SLOTS = ["09:00-11:00", "14:00-16:00", "19:00-21:00"];

const statusConfig = {
  pending: { label: "待审批", color: "var(--accent-warning)" },
  approved: { label: "已通过", color: "var(--accent-success)" },
  rejected: { label: "已拒绝", color: "var(--accent-danger)" },
};

export function TransferManager({
  schedule,
  transferRequests,
  onCreate,
  onUpdate,
  onApprove,
  onReject,
  onDelete,
  onRefresh,
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingRequest, setEditingRequest] = useState(null);
  const [formData, setFormData] = useState({
    session_id: "",
    new_date: "",
    new_time: "",
    new_room: "",
    reason: "",
    applicant: "",
  });
  const [approvalForm, setApprovalForm] = useState({
    requestId: null,
    action: "",
    approver: "",
    comment: "",
  });

  function handleSubmit(e) {
    e.preventDefault();
    if (editingRequest) {
      onUpdate(editingRequest.id, formData);
    } else {
      onCreate(formData);
    }
    resetForm();
  }

  function resetForm() {
    setFormData({
      session_id: "",
      new_date: "",
      new_time: "",
      new_room: "",
      reason: "",
      applicant: "",
    });
    setShowForm(false);
    setEditingRequest(null);
  }

  function handleEdit(req) {
    setEditingRequest(req);
    setFormData({
      session_id: req.session_id,
      new_date: req.new_date,
      new_time: req.new_time,
      new_room: req.new_room,
      reason: req.reason,
      applicant: req.applicant,
    });
    setShowForm(true);
  }

  function handleApprovalSubmit(e) {
    e.preventDefault();
    if (approvalForm.action === "approve") {
      onApprove(approvalForm.requestId, {
        approver: approvalForm.approver,
        comment: approvalForm.comment,
      });
    } else {
      onReject(approvalForm.requestId, {
        approver: approvalForm.approver,
        comment: approvalForm.comment,
      });
    }
    setApprovalForm({ requestId: null, action: "", approver: "", comment: "" });
  }

  function openApprovalModal(requestId, action) {
    setApprovalForm({
      requestId,
      action,
      approver: "",
      comment: "",
    });
  }

  return (
    <div className="feature-panel">
      <SectionHeader title="调课申请管理">
        <button
          className="secondary-action"
          onClick={onRefresh}
          type="button"
          title="刷新"
        >
          <RefreshCw size={16} />
          刷新
        </button>
        <button
          className="primary-action"
          onClick={() => setShowForm(true)}
          type="button"
        >
          <Plus size={16} />
          新建调课申请
        </button>
      </SectionHeader>

      {showForm && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editingRequest ? "编辑调课申请" : "新建调课申请"}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>选择课次 *</label>
                <select
                  value={formData.session_id}
                  onChange={(e) =>
                    setFormData({ ...formData, session_id: e.target.value })
                  }
                  disabled={!!editingRequest}
                  required
                >
                  <option value="">请选择课次</option>
                  {schedule.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.class_name} - {s.course_title} ({s.date} {s.time})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>
                    <Calendar size={14} /> 新日期 *
                  </label>
                  <input
                    type="date"
                    value={formData.new_date}
                    onChange={(e) =>
                      setFormData({ ...formData, new_date: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label>
                    <Clock size={14} /> 新时段 *
                  </label>
                  <select
                    value={formData.new_time}
                    onChange={(e) =>
                      setFormData({ ...formData, new_time: e.target.value })
                    }
                    required
                  >
                    <option value="">请选择时段</option>
                    {TIME_SLOTS.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>
                  <MapPin size={14} /> 新教室 *
                </label>
                <input
                  type="text"
                  value={formData.new_room}
                  onChange={(e) =>
                    setFormData({ ...formData, new_room: e.target.value })
                  }
                  placeholder="如：A-201"
                  required
                />
              </div>

              <div className="form-group">
                <label>调课原因</label>
                <textarea
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData({ ...formData, reason: e.target.value })
                  }
                  placeholder="请说明调课原因"
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label>申请人</label>
                <input
                  type="text"
                  value={formData.applicant}
                  onChange={(e) =>
                    setFormData({ ...formData, applicant: e.target.value })
                  }
                  placeholder="请输入申请人姓名"
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="secondary-action"
                  onClick={resetForm}
                >
                  取消
                </button>
                <button type="submit" className="primary-action">
                  {editingRequest ? "更新" : "提交"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {approvalForm.requestId && (
        <div
          className="modal-overlay"
          onClick={() =>
            setApprovalForm({
              requestId: null,
              action: "",
              approver: "",
              comment: "",
            })
          }
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>
              {approvalForm.action === "approve" ? "通过调课申请" : "拒绝调课申请"}
            </h3>
            <form onSubmit={handleApprovalSubmit}>
              <div className="form-group">
                <label>审批人 *</label>
                <input
                  type="text"
                  value={approvalForm.approver}
                  onChange={(e) =>
                    setApprovalForm({ ...approvalForm, approver: e.target.value })
                  }
                  placeholder="请输入审批人姓名"
                  required
                />
              </div>
              <div className="form-group">
                <label>审批意见</label>
                <textarea
                  value={approvalForm.comment}
                  onChange={(e) =>
                    setApprovalForm({ ...approvalForm, comment: e.target.value })
                  }
                  placeholder="请输入审批意见（可选）"
                  rows={3}
                />
              </div>
              <div className="form-actions">
                <button
                  type="button"
                  className="secondary-action"
                  onClick={() =>
                    setApprovalForm({
                      requestId: null,
                      action: "",
                      approver: "",
                      comment: "",
                    })
                  }
                >
                  取消
                </button>
                <button
                  type="submit"
                  className={
                    approvalForm.action === "approve"
                      ? "primary-action"
                      : "danger-action"
                  }
                >
                  {approvalForm.action === "approve" ? "通过" : "拒绝"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {transferRequests.length === 0 ? (
        <div className="empty-state">
          <p>暂无调课申请记录</p>
        </div>
      ) : (
        <div className="transfer-list">
          {transferRequests.map((req) => (
            <div key={req.id} className="transfer-card">
              <div className="transfer-header">
                <div>
                  <h4>
                    {req.class_name} - {req.course_title}
                  </h4>
                  <p className="teacher">任课教师：{req.teacher}</p>
                </div>
                <span
                  className="status-badge"
                  style={{ backgroundColor: statusConfig[req.status].color }}
                >
                  {statusConfig[req.status].label}
                </span>
              </div>

              <div className="transfer-details">
                <div className="transfer-section">
                  <h5>原安排</h5>
                  <p>
                    <Calendar size={14} /> {req.old_date}
                  </p>
                  <p>
                    <Clock size={14} /> {req.old_time}
                  </p>
                  <p>
                    <MapPin size={14} /> {req.old_room}
                  </p>
                </div>

                <div className="transfer-arrow">
                  <RefreshCw size={24} />
                </div>

                <div className="transfer-section">
                  <h5>新安排</h5>
                  <p>
                    <Calendar size={14} /> {req.new_date}
                  </p>
                  <p>
                    <Clock size={14} /> {req.new_time}
                  </p>
                  <p>
                    <MapPin size={14} /> {req.new_room}
                  </p>
                </div>
              </div>

              {req.reason && (
                <div className="transfer-reason">
                  <strong>调课原因：</strong>
                  {req.reason}
                </div>
              )}

              {req.applicant && (
                <div className="transfer-meta">
                  <span>申请人：{req.applicant}</span>
                  <span>申请时间：{new Date(req.created_at).toLocaleString()}</span>
                </div>
              )}

              {req.status !== "pending" && (
                <div className="transfer-approval">
                  <p>
                    <strong>审批人：</strong>
                    {req.approver}
                  </p>
                  {req.approval_comment && (
                    <p>
                      <strong>审批意见：</strong>
                      {req.approval_comment}
                    </p>
                  )}
                  <p>
                    <strong>审批时间：</strong>
                    {new Date(req.updated_at).toLocaleString()}
                  </p>
                </div>
              )}

              {req.new_session && (
                <div className="transfer-new-session">
                  <strong>新课次已生成：</strong>
                  #{req.new_session.id} - {req.new_session.date}{" "}
                  {req.new_session.time} {req.new_session.room}
                </div>
              )}

              {req.status === "pending" && (
                <div className="transfer-actions">
                  <button
                    className="secondary-action"
                    onClick={() => handleEdit(req)}
                    type="button"
                  >
                    <Edit2 size={14} />
                    编辑
                  </button>
                  <button
                    className="primary-action"
                    onClick={() => openApprovalModal(req.id, "approve")}
                    type="button"
                  >
                    <Check size={14} />
                    通过
                  </button>
                  <button
                    className="danger-action"
                    onClick={() => openApprovalModal(req.id, "reject")}
                    type="button"
                  >
                    <X size={14} />
                    拒绝
                  </button>
                  <button
                    className="danger-action"
                    onClick={() => onDelete(req.id)}
                    type="button"
                  >
                    <Trash2 size={14} />
                    删除
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
