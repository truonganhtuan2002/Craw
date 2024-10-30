import React from 'react'
import { Table, Button } from 'antd'
import { ColumnsType } from 'antd/es/table' // Import ColumnsType để dùng kiểu cho columns

interface AccountTableProps {
  dataSource: {
    id: number
    name: string
    email: string
    password: string
    account_type: number
  }[]
  onEdit: (record: {
    id: number
    name: string
    email: string
    password: string
    account_type: number
  }) => void
  onDelete: (id: number) => void
}

const AccountTable: React.FC<AccountTableProps> = ({ dataSource, onEdit, onDelete }) => {
  // Định nghĩa kiểu của các cột trong bảng
  const columns: ColumnsType<{
    id: number
    name: string
    email: string
    password: string
    account_type: number
  }> = [
    {
      title: 'Tên',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email'
    },
    {
      title: 'Mật khẩu',
      dataIndex: 'password',
      key: 'password'
    },
    {
      title: 'Loại tài khoản',
      dataIndex: 'account_type',
      key: 'account_type',
      render: (account_type: number): string => {
        switch (account_type) {
          case 1:
            return 'Facebook'
          case 2:
            return 'TikTok'
          case 3:
            return 'Youtube'
          default:
            return 'Khác'
        }
      }
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (
        _: unknown, // Sử dụng `unknown` thay vì `any` để thay thế cho giá trị không sử dụng
        record: { id: number; name: string; email: string; password: string; account_type: number }
      ): React.ReactNode => (
        <span>
          <Button onClick={() => onEdit(record)}>Sửa</Button>
          <Button onClick={() => onDelete(record.id)} danger style={{ marginLeft: 8 }}>
            Xóa
          </Button>
        </span>
      )
    }
  ]

  return <Table columns={columns} dataSource={dataSource} pagination={false} rowKey="id" />
}

export default AccountTable
