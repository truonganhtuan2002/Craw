import React, { useState, useEffect } from 'react';
import { Layout, Button, Input, Modal } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined, SearchOutlined } from '@ant-design/icons';
import SiderMenu from './SiderMenu';
import AccountTable from './AccountTable';
import AccountModal from './AccountModal';
import CrawApp from './CrawApp'; // Import CrawApp

const { Header, Content } = Layout;

interface DataType {
  id: number;
  name: string;
  email: string;
  password: string;
  account_type: number;
}

interface UpdateData {
  action: string;
  message: string;
}

const App: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [dataSource, setDataSource] = useState<DataType[]>([]);
  const [searchText, setSearchText] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [newAccount, setNewAccount] = useState<{
    id?: number;
    name: string;
    email: string;
    password: string;
    account_type: number;
  }>({
    name: '',
    email: '',
    password: '',
    account_type: 1,
  });

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingKey, setEditingKey] = useState<number | null>(null);
  const [deletingKey, setDeletingKey] = useState<number | null>(null);
  const [selectedAccountType, setSelectedAccountType] = useState<number>(1);
  const [selectedMenuKey, setSelectedMenuKey] = useState<string>('1');

  useEffect(() => {
    const handleUpdate = (_: unknown, ...args: unknown[]): void => {
      const data = args[0] as UpdateData;
      if (data.action === 'log') {
        console.log(data.message);
        fetchAccounts(selectedAccountType);
      }
    };

    window.electron.ipcRenderer.on('update', handleUpdate);

    const fetchAccounts = async (accountType: number): Promise<void> => {
      try {
        const accounts = (await window.electron.ipcRenderer.invoke(
          'getAccounts',
          accountType
        )) as DataType[];
        setDataSource(accounts);
      } catch (error) {
        console.error('Lỗi khi tải tài khoản:', error);
      }
    };

    fetchAccounts(selectedAccountType);

    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    return () => {
      window.electron.ipcRenderer.removeListener('update', handleUpdate);
    };
  }, [selectedAccountType]);

  const handleEdit = (record: DataType): void => {
    setIsEditing(true);
    setEditingKey(record.id);
    setNewAccount({
      id: record.id,
      name: record.name,
      email: record.email,
      password: record.password,
      account_type: record.account_type,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (): Promise<void> => {
    if (!newAccount.name || !newAccount.email || !newAccount.password) {
      return;
    }

    try {
      if (isEditing && editingKey) {
        await window.electron.ipcRenderer.send('updateAccount', newAccount);
        const updatedData = dataSource.map((item) =>
          item.id === editingKey ? { ...item, ...newAccount } : item
        );
        setDataSource(updatedData);
      } else {
        await window.electron.ipcRenderer.send('start', newAccount);
        const newData: DataType = { id: Date.now(), ...newAccount };
        setDataSource([...dataSource, newData]);
      }
    } catch (error) {
      console.error('Lỗi khi lưu tài khoản:', error);
    }

    setIsModalOpen(false);
    setNewAccount({ name: '', email: '', password: '', account_type: selectedAccountType });
    setIsEditing(false);
    setEditingKey(null);
  };

  const handleDelete = async (key: number): Promise<void> => {
    try {
      await window.electron.ipcRenderer.send('deleteAccount', key);
      const updatedData = dataSource.filter((item) => item.id !== key);
      setDataSource(updatedData);
    } catch (error) {
      console.error('Lỗi khi xóa tài khoản:', error);
    }
    setDeletingKey(null);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>): void =>
    setSearchText(e.target.value);

  const filteredData = dataSource.filter(
    (item) =>
      item.name.toLowerCase().includes(searchText.toLowerCase()) ||
      item.email.toLowerCase().includes(searchText.toLowerCase())
  );

  const confirmDelete = (key: number): void => {
    setDeletingKey(key);
  };

  const handleConfirmDelete = (): void => {
    if (deletingKey) {
      handleDelete(deletingKey);
    }
  };

  const cancelDelete = (): void => {
    setDeletingKey(null);
  };

  const handleMenuSelect = (key: string): void => {
    setSelectedMenuKey(key);
    if (key.startsWith('1')) {
      const accountType = parseInt(key.split('-')[1], 10);
      setSelectedAccountType(accountType);
    }
  };

  const handleSelectChange = (value: number): void => {
    setNewAccount((prev) => ({ ...prev, account_type: value }));
  };

  return (
    <Layout style={{ height: '100vh', display: 'flex', overflow: 'hidden' }}>
      <SiderMenu collapsed={collapsed} onSelect={handleMenuSelect} />
      <Layout style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <Header style={{ padding: 0, backgroundColor: '#fff' }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ margin: '0 16px' }}
          />
        </Header>
        <Content style={{ margin: '16px', overflow: 'auto' }}>
          {selectedMenuKey.startsWith('1') && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <Input
                  placeholder="Tìm kiếm tài khoản"
                  prefix={<SearchOutlined />}
                  onChange={handleSearch}
                  style={{ width: 300 }}
                />
                <Button
                  type="primary"
                  onClick={() => {
                    setIsModalOpen(true);
                    setIsEditing(false);
                    setNewAccount({
                      name: '',
                      email: '',
                      password: '',
                      account_type: selectedAccountType,
                    });
                  }}
                >
                  Thêm Tài Khoản
                </Button>
              </div>
              <AccountTable dataSource={filteredData} onEdit={handleEdit} onDelete={confirmDelete} />
            </>
          )}
          {selectedMenuKey === '2-1' && <CrawApp />} {/* Hiển thị CrawApp khi chọn mục Craw */}
        </Content>
      </Layout>
      <AccountModal
        open={isModalOpen}
        isEditing={isEditing}
        account={newAccount}
        onCancel={() => setIsModalOpen(false)}
        onSave={handleSave}
        onInputChange={(e) => setNewAccount({ ...newAccount, [e.target.name]: e.target.value })}
        onSelectChange={handleSelectChange}
      />
      <Modal
        title="Xác nhận xóa"
        open={!!deletingKey}
        onOk={handleConfirmDelete}
        onCancel={cancelDelete}
      >
        <p>Bạn có chắc chắn muốn xóa tài khoản này không?</p>
      </Modal>
    </Layout>
  );
};

export default App;
