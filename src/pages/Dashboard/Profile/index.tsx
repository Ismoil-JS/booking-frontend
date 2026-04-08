import { useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Card,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Button,
  message,
  Select,
  Space,
  Avatar,
} from 'antd';
import { Plus, Trash2, User, FileText } from 'lucide-react';
import { selectUser } from '@/store/authSlice';
import { useAuth } from '@/contexts/AuthContext';
import {
  useUploadTutorFilesMutation,
  useUpdateTutorProfileMutation,
  useTutorCategoriesQuery,
  type WorkExperienceInput,
} from '@/entities/Tutor/api';
import { useUpdateMyProfileMutation } from '@/entities/Auth/api';
import { assetUrl } from '@/shared/lib/assetUrl';

export default function DashboardProfile() {
  const user = useSelector(selectUser);
  const { refreshUser } = useAuth();
  const isTutor = user?.userType === 'TUTOR';
  const [form] = Form.useForm();
  const [learnerPhoneForm] = Form.useForm();
  const [isEditingLearnerPhone, setIsEditingLearnerPhone] = useState(false);
  const profileImageInputRef = useRef<HTMLInputElement>(null);
  const certificateInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useUploadTutorFilesMutation();
  const updateMutation = useUpdateTutorProfileMutation();
  const updateMyProfileMutation = useUpdateMyProfileMutation();
  const { data: categories = [] } = useTutorCategoriesQuery();

  if (!user) return null;

  const onLearnerFinish = async (values: { phone?: string }) => {
    try {
      await updateMyProfileMutation.mutateAsync({
        phone: values.phone?.trim() || undefined,
      });
      message.success('Phone number updated');
      await refreshUser();
      setIsEditingLearnerPhone(false);
    } catch {
      message.error('Failed to update phone number');
    }
  };

  if (!isTutor) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile</h1>
        <Card className="rounded-2xl shadow-sm">
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Name">{user.fullName}</Descriptions.Item>
            <Descriptions.Item label="Email">{user.email}</Descriptions.Item>
            <Descriptions.Item label="Phone">
              {isEditingLearnerPhone ? (
                <Form form={learnerPhoneForm} layout="vertical" onFinish={onLearnerFinish}>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <Form.Item name="phone" className="mb-0 flex-1">
                      <Input placeholder="+1234567890" className="rounded-xl" />
                    </Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      className="rounded-xl bg-blue-600"
                      loading={updateMyProfileMutation.isPending}
                    >
                      Save
                    </Button>
                    <Button
                      className="rounded-xl"
                      onClick={() => setIsEditingLearnerPhone(false)}
                      disabled={updateMyProfileMutation.isPending}
                    >
                      Cancel
                    </Button>
                  </div>
                </Form>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="text-gray-700">
                    {user.phone || <span className="text-gray-400 italic">Signed in with Google</span>}
                  </div>
                  <Button
                    type="primary"
                    className="rounded-xl bg-blue-600 w-fit"
                    onClick={() => {
                      learnerPhoneForm.setFieldsValue({ phone: user.phone ?? '' });
                      setIsEditingLearnerPhone(true);
                    }}
                  >
                    {user.phone ? 'Update' : 'Add'}
                  </Button>
                </div>
              )}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      </div>
    );
  }

  const t = user.tutor;
  const profileImageUrl = assetUrl(t?.profileImage ?? null);

  const handleProfileImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadMutation.mutateAsync({ profileImage: file });
      message.success('Profile image updated');
      await refreshUser();
    } catch {
      message.error('Failed to upload profile image');
    }
    e.target.value = '';
  };

  const handleCertificateChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadMutation.mutateAsync({ certificate: file });
      message.success('Certificate uploaded');
      await refreshUser();
    } catch {
      message.error('Failed to upload certificate');
    }
    e.target.value = '';
  };

  const onFinish = async (values: {
    about: string;
    bio: string;
    costPer30Min: number;
    phone?: string;
    categoryId?: number | null;
    workExperiences: WorkExperienceInput[];
  }) => {
    const workExperiences = (values.workExperiences ?? []).filter(
      (w) => (w.companyName?.trim() ?? '') !== '' && (w.role?.trim() ?? '') !== '' && w.yearsWorked != null
    );
    try {
      await updateMutation.mutateAsync({
        about: values.about ?? '',
        bio: values.bio ?? '',
        costPer30Min: values.costPer30Min ?? 25,
        profileImage: t?.profileImage ?? null,
        certificate: t?.certificate ?? null,
        categoryId: values.categoryId ?? null,
        rating: t?.rating ?? null,
        phone: values.phone?.trim() || undefined,
        workExperiences,
      });
      message.success('Profile updated');
      await refreshUser();
    } catch {
      message.error('Failed to update profile');
    }
  };

  const initialValues = {
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    about: t?.about ?? '',
    bio: t?.bio ?? '',
    costPer30Min: t?.costPer30Min ?? 25,
    categoryId: t?.category?.id ?? undefined,
    workExperiences:
      t?.workExperiences?.map((w) => ({
        companyName: w.companyName,
        role: w.role,
        yearsWorked: w.yearsWorked,
      })) ?? [{ companyName: '', role: '', yearsWorked: 0 }],
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile</h1>

      <Card title="Account" className="rounded-2xl shadow-sm max-w-2xl mb-6">
        <Descriptions column={1} size="small">
          <Descriptions.Item label="Name">{user.fullName}</Descriptions.Item>
          <Descriptions.Item label="Email">{user.email}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Edit your tutor profile" className="rounded-2xl shadow-sm max-w-2xl">
        <div className="mb-6 flex flex-wrap gap-8">
          <div className="flex flex-col items-center gap-2">
            <Avatar
              size={80}
              src={profileImageUrl ?? undefined}
              icon={!profileImageUrl ? <User className="w-8 h-8" /> : undefined}
              className="rounded-xl"
            />
            <input
              ref={profileImageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleProfileImageChange}
            />
            <Button
              type="default"
              size="small"
              onClick={() => profileImageInputRef.current?.click()}
              loading={uploadMutation.isPending}
              className="rounded-xl"
            >
              Upload photo
            </Button>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-gray-700">Certificate</span>
            {t?.certificate ? (
              <a
                href={assetUrl(t.certificate) ?? '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 text-sm flex items-center gap-1"
              >
                <FileText className="w-4 h-4" />
                Current file
              </a>
            ) : (
              <span className="text-gray-500 text-sm">No file uploaded</span>
            )}
            <input
              ref={certificateInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              className="hidden"
              onChange={handleCertificateChange}
            />
            <Button
              type="default"
              size="small"
              onClick={() => certificateInputRef.current?.click()}
              loading={uploadMutation.isPending}
              className="rounded-xl"
            >
              Upload certificate
            </Button>
          </div>
        </div>

        <Form
          form={form}
          layout="vertical"
          initialValues={initialValues}
          onFinish={onFinish}
        >
          <Form.Item name="phone" label="Phone number">
            <Input placeholder="+1234567890" className="rounded-xl" />
          </Form.Item>
          <Form.Item name="about" label="About">
            <Input.TextArea rows={3} className="rounded-xl" placeholder="Experience and background" />
          </Form.Item>
          <Form.Item name="bio" label="Short bio">
            <Input.TextArea rows={2} className="rounded-xl" placeholder="Brief bio for your card" />
          </Form.Item>
          <Form.Item name="costPer30Min" label="Cost per 30 min (USD)" rules={[{ required: true }]}>
            <InputNumber min={5} max={200} className="w-full rounded-xl" />
          </Form.Item>
          <Form.Item name="categoryId" label="Category">
            <Select
              allowClear
              placeholder="Select category"
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
              className="rounded-xl"
            />
          </Form.Item>

          <Form.Item label="Work experience">
            <Form.List name="workExperiences">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...rest }) => (
                    <Space key={key} align="baseline" className="flex flex-wrap gap-2 mb-2">
                      <Form.Item
                        {...rest}
                        name={[name, 'companyName']}
                        className="mb-0"
                      >
                        <Input placeholder="Company" className="rounded-xl min-w-[120px]" />
                      </Form.Item>
                      <Form.Item
                        {...rest}
                        name={[name, 'role']}
                        className="mb-0"
                      >
                        <Input placeholder="Role" className="rounded-xl min-w-[120px]" />
                      </Form.Item>
                      <Form.Item
                        {...rest}
                        name={[name, 'yearsWorked']}
                        className="mb-0"
                      >
                        <InputNumber min={0} max={50} placeholder="Years" className="rounded-xl w-20" />
                      </Form.Item>
                      <Button
                        type="text"
                        danger
                        icon={<Trash2 className="w-4 h-4" />}
                        onClick={() => remove(name)}
                        className="shrink-0"
                      />
                    </Space>
                  ))}
                  <Form.Item className="mb-0">
                    <Button type="dashed" onClick={() => add({ companyName: '', role: '', yearsWorked: 0 })} block className="rounded-xl">
                      <Plus className="w-4 h-4 inline mr-1" /> Add experience
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              className="rounded-xl bg-blue-600"
              loading={updateMutation.isPending}
            >
              Save changes
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
