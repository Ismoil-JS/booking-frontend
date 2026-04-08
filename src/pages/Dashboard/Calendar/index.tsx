import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Card, Button, Form, Input, Table, Modal, message, Popconfirm, Tag, Tooltip } from 'antd';
import { Plus, Pencil, Trash2, Calendar } from 'lucide-react';
import {
  useTutorSlotsQuery,
  useCreateTutorSlotMutation,
  useUpdateTutorSlotMutation,
  useDeleteTutorSlotMutation,
  type SlotApi,
  type TutorSlotInput,
} from '@/entities/Tutor/api';

/** Today in local YYYY-MM-DD (no past dates for slot creation). */
function todayYYYYMMDD(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function tomorrowYYYYMMDD(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

/** Current time in HH:mm for min attribute when date is today. */
function currentTimeHHMM(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** True if slot start (date + startTime) is in the past. */
function isSlotStartInPast(dateStr: string, startTime: string): boolean {
  if (!dateStr || !startTime) return false;
  const [hours, minutes] = startTime.split(':').map(Number);
  const start = new Date(dateStr);
  start.setHours(hours, minutes ?? 0, 0, 0);
  return start.getTime() < Date.now();
}

function slotDateYMD(slot: SlotApi): string {
  const d = slot.date ?? '';
  return d.includes('T') ? d.slice(0, 10) : d;
}

/** Returns HH:mm for 30 minutes after the given HH:mm (or H:mm). Wraps past midnight to 00:xx same notation. */
function add30MinutesToHHMM(time: string): string {
  const parts = time.split(':').map((p) => parseInt(p.trim(), 10));
  const h = Number.isFinite(parts[0]) ? parts[0] : 0;
  const m = Number.isFinite(parts[1]) ? parts[1] : 0;
  let totalMinutes = h * 60 + m + 30;
  totalMinutes %= 24 * 60;
  if (totalMinutes < 0) totalMinutes += 24 * 60;
  const nh = Math.floor(totalMinutes / 60);
  const nm = totalMinutes % 60;
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
}

function isAntdFormValidationError(e: unknown): boolean {
  return (
    typeof e === 'object' &&
    e !== null &&
    'errorFields' in e &&
    Array.isArray((e as { errorFields: unknown }).errorFields)
  );
}

function slotSaveErrorMessage(e: unknown): string {
  if (axios.isAxiosError(e)) {
    const status = e.response?.status;
    if (status === 409) {
      return 'You already have a slot at this date and time. Change the date or time and try again.';
    }
    const data = e.response?.data as { message?: string | string[] } | undefined;
    const raw = data?.message;
    const serverMsg = Array.isArray(raw) ? raw[0] : raw;
    if (
      serverMsg &&
      typeof serverMsg === 'string' &&
      serverMsg.trim().length > 0 &&
      !/^Request failed with status code \d+/i.test(serverMsg.trim())
    ) {
      return serverMsg;
    }
    return 'Could not save this slot. Please try again.';
  }
  if (e instanceof Error && e.message) return e.message;
  return 'Could not save this slot. Please try again.';
}

const defaultSlotFormValues = {
  date: tomorrowYYYYMMDD(),
  startTime: '09:00',
};

export default function DashboardCalendar() {
  const { data: slots = [], isLoading } = useTutorSlotsQuery();
  const createMutation = useCreateTutorSlotMutation();
  const updateMutation = useUpdateTutorSlotMutation();
  const deleteMutation = useDeleteTutorSlotMutation();

  const [form] = Form.useForm<{ date: string; startTime: string }>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<SlotApi | null>(null);

  const watchedDate = Form.useWatch('date', form);
  const watchedStartTime = Form.useWatch('startTime', form);
  const derivedEndTime = watchedStartTime ? add30MinutesToHHMM(watchedStartTime) : '';
  const isToday = watchedDate === todayYYYYMMDD();
  const minStartTime = isToday ? currentTimeHHMM() : undefined;

  const isEditing = !!editingSlot;

  const latestEditingSlot = useMemo(
    () => (editingSlot ? slots.find((s) => s.id === editingSlot.id) : undefined),
    [editingSlot, slots]
  );
  const editingBlockedByBooking = isEditing && latestEditingSlot?.booked === true;

  /** If a learner books while the edit modal is open, close it — tutors must not change booked slots. */
  useEffect(() => {
    if (!modalOpen || !editingSlot) return;
    const latest = slots.find((s) => s.id === editingSlot.id);
    if (latest?.booked === true) {
      message.warning('This slot has been booked. You can’t change it anymore.');
      setModalOpen(false);
      setEditingSlot(null);
      form.resetFields();
    }
  }, [modalOpen, editingSlot?.id, slots, form]);

  const handleAdd = () => {
    setEditingSlot(null);
    form.setFieldsValue(defaultSlotFormValues);
    setModalOpen(true);
  };

  const handleEdit = (slot: SlotApi) => {
    if (slot.booked === true) {
      message.info('This slot has a booking and can’t be edited.');
      return;
    }
    setEditingSlot(slot);
    form.setFieldsValue({
      date: slotDateYMD(slot),
      startTime: slot.startTime,
    });
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingSlot(null);
    form.resetFields();
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields(['date', 'startTime']);
      if (isSlotStartInPast(values.date, values.startTime)) {
        form.setFields([{ name: 'startTime', errors: ['Slot start time cannot be in the past'] }]);
        return;
      }
      const payload: TutorSlotInput = {
        date: values.date,
        startTime: values.startTime,
        endTime: add30MinutesToHHMM(values.startTime),
      };
      if (editingSlot) {
        const latest = slots.find((s) => s.id === editingSlot.id);
        if (latest?.booked === true) {
          message.error('This slot has a booking and can’t be updated.');
          handleModalClose();
          return;
        }
        await updateMutation.mutateAsync({ id: editingSlot.id, payload });
        message.success('Slot updated');
      } else {
        await createMutation.mutateAsync(payload);
        message.success('Slot added');
      }
      handleModalClose();
    } catch (e: unknown) {
      if (isAntdFormValidationError(e)) return;
      message.error(slotSaveErrorMessage(e));
    }
  };

  const handleDelete = async (id: number) => {
    const slot = slots.find((s) => s.id === id);
    if (slot?.booked === true) {
      message.error('This slot has a booking and can’t be removed.');
      return;
    }
    try {
      await deleteMutation.mutateAsync(id);
      message.success('Slot removed');
    } catch {
      message.error('Failed to remove slot');
    }
  };

  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (d: string, record: SlotApi) => {
        const ymd = slotDateYMD(record);
        return ymd ? new Date(ymd + 'Z').toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) : d;
      },
    },
    {
      title: 'Start',
      dataIndex: 'startTime',
      key: 'startTime',
    },
    {
      title: 'End',
      dataIndex: 'endTime',
      key: 'endTime',
    },
    {
      title: 'Status',
      key: 'booked',
      width: 130,
      render: (_: unknown, record: SlotApi) => {
        if (record.booked === true) {
          return <Tag color="orange">Booked</Tag>;
        }
        return <span className="text-gray-600">Open</span>;
      },
    },
    {
      title: '',
      key: 'actions',
      width: 120,
      render: (_: unknown, record: SlotApi) => {
        const isBooked = record.booked === true;
        return (
          <div className="flex gap-2">
            <Tooltip title={isBooked ? 'Cannot edit a slot that has a booking' : undefined}>
              <Button
                type="text"
                size="small"
                icon={<Pencil className="w-4 h-4" />}
                onClick={() => handleEdit(record)}
                disabled={isBooked}
                className="text-gray-600"
              />
            </Tooltip>
            <Tooltip title={isBooked ? 'Cannot remove a slot that has a booking' : undefined}>
              <Popconfirm
                title="Remove this slot?"
                description="Students will no longer see this time."
                onConfirm={() => handleDelete(record.id)}
                okText="Remove"
                cancelText="Cancel"
                okButtonProps={{ danger: true }}
                disabled={isBooked}
              >
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<Trash2 className="w-4 h-4" />}
                  disabled={isBooked}
                />
              </Popconfirm>
            </Tooltip>
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Calendar</h1>

      <Card className="rounded-2xl shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <p className="text-gray-600">
            Manage your available time slots. Each slot is 30 minutes; students can book these times on your profile.
            Status shows Booked when a learner has reserved that time; otherwise Open. Booked slots can’t be edited or removed here.
          </p>
          <Button
            type="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={handleAdd}
            className="rounded-xl bg-blue-600 shrink-0"
          >
            Add slot
          </Button>
        </div>

        {slots.length === 0 && !isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Calendar className="w-12 h-12 mb-3 text-gray-300" />
            <p>No slots yet. Add one so students can book lessons.</p>
            <Button type="primary" onClick={handleAdd} className="mt-3 rounded-xl bg-blue-600">
              Add slot
            </Button>
          </div>
        ) : (
          <Table
            dataSource={slots}
            columns={columns}
            rowKey="id"
            loading={isLoading}
            pagination={false}
            className="rounded-xl overflow-hidden"
          />
        )}
      </Card>

      <Modal
        title={isEditing ? 'Edit slot' : 'Add slot'}
        open={modalOpen}
        onCancel={handleModalClose}
        onOk={handleSubmit}
        okText={isEditing ? 'Save' : 'Add'}
        okButtonProps={{ disabled: editingBlockedByBooking }}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        destroyOnClose
        className="rounded-2xl"
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item
            name="date"
            label="Date"
            rules={[{ required: true, message: 'Select date' }]}
          >
            <Input
              type="date"
              className="rounded-xl"
              min={todayYYYYMMDD()}
              disabled={editingBlockedByBooking}
            />
          </Form.Item>
          <Form.Item
            name="startTime"
            label="Start time"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Input
              type="time"
              className="rounded-xl"
              min={minStartTime}
              step={60}
              disabled={editingBlockedByBooking}
            />
          </Form.Item>
          <Form.Item
            label="End time"
            extra="Fixed at 30 minutes after start. You can only change the start time."
          >
            <Input
              type="time"
              readOnly
              disabled
              value={derivedEndTime}
              placeholder="—"
              className="rounded-xl bg-gray-50 text-gray-700 cursor-not-allowed"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
