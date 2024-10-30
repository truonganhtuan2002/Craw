import React from 'react'
import { Modal, Input, Form, notification, Select } from 'antd'

interface AccountModalProps {
  open: boolean // Thay thế `visible` bằng `open`
  isEditing: boolean
  account: { name: string; email: string; password: string; account_type: number }
  onCancel: () => void
  onSave: () => void
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSelectChange: (value: number) => void
}

const AccountModal: React.FC<AccountModalProps> = ({
  open, // Thay thế `visible` bằng `open`
  isEditing,
  account,
  onCancel,
  onSave,
  onInputChange,
  onSelectChange
}) => {
  const handleOk = (): void => {
    // Kiểm tra tính hợp lệ của dữ liệu
    if (!account.name || !account.email || !account.password) {
      notification.error({
        message: 'Lỗi',
        description: 'Vui lòng điền đầy đủ thông tin!'
      })
      return
    }
    onSave() // Chỉ gọi onSave nếu dữ liệu hợp lệ
  }

  return (
    <Modal
      title={isEditing ? 'Sửa tài khoản' : 'Thêm tài khoản mới'}
      open={open} // Thay thế `visible` bằng `open`
      onOk={handleOk} // Gọi handleOk thay vì onSave
      onCancel={onCancel}
      okText={isEditing ? 'Lưu' : 'Thêm'}
      cancelText="Hủy"
    >
      <Form layout="vertical">
        <Form.Item label="Họ và tên" required>
          <Input
            name="name"
            value={account.name}
            onChange={onInputChange}
            placeholder="Nhập họ và tên"
          />
        </Form.Item>
        <Form.Item label="Email" required>
          <Input
            name="email"
            value={account.email}
            onChange={onInputChange}
            placeholder="Nhập email"
          />
        </Form.Item>
        <Form.Item label="Mật khẩu" required>
          <Input
            name="password"
            type="password" // Thêm type="password" để bảo vệ mật khẩu
            value={account.password}
            onChange={onInputChange}
            placeholder="Nhập mật khẩu"
          />
        </Form.Item>
        <Form.Item label="Loại tài khoản" required>
          <Select
            value={account.account_type}
            onChange={onSelectChange}
            placeholder="Chọn loại tài khoản"
          >
            <Select.Option value={1}>Facebook</Select.Option>
            <Select.Option value={2}>TikTok</Select.Option>
            <Select.Option value={3}>Youtube</Select.Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default AccountModal
