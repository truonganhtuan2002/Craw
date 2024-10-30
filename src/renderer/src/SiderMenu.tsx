import React from 'react'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {
  UserOutlined,
  SearchOutlined,
  ContainerOutlined,
  SwapOutlined,
  LoadingOutlined,
  FacebookOutlined,
  TikTokOutlined,
  YoutubeOutlined,
  SnippetsOutlined,
  RedditOutlined,
  FileWordOutlined,
  GlobalOutlined,
  BorderVerticleOutlined
} from '@ant-design/icons'
import { Menu, Layout } from 'antd'

const { Sider } = Layout

interface SiderMenuProps {
  collapsed: boolean
  onSelect: (key: string) => void // Thêm prop để xử lý chọn menu
}

const SiderMenu: React.FC<SiderMenuProps> = ({ collapsed, onSelect }) => {
  const menuItems = [
    {
      key: '1',
      icon: <UserOutlined />,
      label: 'Quản lý tài khoản',
      children: [
        { key: '1-1', icon: <FacebookOutlined />, label: 'Facebook' },
        { key: '1-2', icon: <TikTokOutlined />, label: 'TikTok' },
        { key: '1-3', icon: <YoutubeOutlined />, label: 'Youtube' }
      ]
    },
    {
      key: '2',
      icon: <SearchOutlined />,
      label: 'Quản lý từ khoá',
      children: [{ key: '2-1', icon: <SnippetsOutlined />, label: 'Craw' }]
    },
    {
      key: '3',
      icon: <ContainerOutlined />,
      label: 'Quản lý content',
      children: [
        { key: '3-1', icon: <RedditOutlined />, label: 'Reddit' },
        { key: '3-2', icon: <FileWordOutlined />, label: 'Blackhatword' }
      ]
    },
    {
      key: '4',
      icon: <SwapOutlined />,
      label: 'Quản lý convert',
      children: [
        { key: '4-1', icon: <GlobalOutlined />, label: 'English' },
        { key: '4-2', icon: <BorderVerticleOutlined />, label: 'Vietnamese' }
      ]
    },
    {
      key: '5',
      icon: <LoadingOutlined />,
      label: 'Automation',
      children: [
        { key: '5-1', icon: <FacebookOutlined />, label: 'Facebook' },
        { key: '5-2', icon: <TikTokOutlined />, label: 'TikTok' },
        { key: '5-3', icon: <YoutubeOutlined />, label: 'Youtube' }
      ]
    }
  ]

  return (
    <Sider trigger={null} collapsible collapsed={collapsed}>
      <div className="demo-logo-vertical" />
      <Menu
        theme="dark"
        mode="inline"
        defaultSelectedKeys={['1']}
        onSelect={({ key }) => onSelect(key)} // Gọi hàm xử lý chọn menu
        items={menuItems}
      />
    </Sider>
  )
}

export default SiderMenu
