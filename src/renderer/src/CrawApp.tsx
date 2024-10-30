// CrawApp.tsx
import React, { useState, useEffect } from 'react'
import { Button, Modal, Table, notification, Tooltip, Space } from 'antd'
import { DeleteOutlined, EyeOutlined, UploadOutlined } from '@ant-design/icons'
import CrawForm from './CrawForm'

interface HistoryRecord {
  id: number
  keyword: string
  time: string
}

interface CrawlData {
  id: number
  data: string
  url: string
  content: string
}

const CrawHistory: React.FC<{
  history: HistoryRecord[]
  onKeywordClick: (id: number, keyword: string) => void
  onDeleteHistory: (id: number) => void
  selectedRowKeys: React.Key[]
  onSelectChange: (selectedKeys: React.Key[]) => void
}> = ({ history, onKeywordClick, onDeleteHistory, selectedRowKeys, onSelectChange }) => {
  const columns = [
    {
      title: 'Từ khoá',
      dataIndex: 'keyword',
      key: 'keyword',
      // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
      render: (text: string, record: HistoryRecord) => (
        <a onClick={() => onKeywordClick(record.id, text)}>{text}</a>
      )
    },
    {
      title: 'Thời gian',
      dataIndex: 'time',
      key: 'time'
    },
    {
      title: 'Thao tác',
      key: 'action',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-function-return-type
      render: (_: any, record: HistoryRecord) => (
        <Button type="danger" icon={<DeleteOutlined />} onClick={() => onDeleteHistory(record.id)}>
          Xóa
        </Button>
      )
    }
  ]

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange
  }

  return (
    <Table
      columns={columns}
      dataSource={history}
      rowKey="id"
      style={{ marginTop: 20 }}
      rowSelection={rowSelection}
    />
  )
}

const CrawApp: React.FC = () => {
  const [history, setHistory] = useState<HistoryRecord[]>([])
  const [crawledData, setCrawledData] = useState<CrawlData[]>([])
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false)
  const [isDetailModalVisible, setIsDetailModalVisible] = useState<boolean>(false)
  const [selectedData, setSelectedData] = useState<CrawlData | null>(null)
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null)

  // State để quản lý các hàng được chọn
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

  // State để quản lý loading cho nút "Đăng bài"
  const [loadingPost, setLoadingPost] = useState<boolean>(false)

  useEffect(() => {
    const fetchHistory = async (): Promise<void> => {
      try {
        const result = await window.electron.ipcRenderer.invoke('getCrawlHistory')
        setHistory(result as HistoryRecord[]) // Ép kiểu result thành HistoryRecord[]
      } catch (error) {
        console.error('Failed to load crawl history:', error)
      }
    }
  
    fetchHistory()
  }, [])
  

  const handleKeywordClick = async (id: number, keyword: string): Promise<void> => {
    setSelectedKeyword(keyword)
    setIsModalVisible(true)
  
    try {
      const result = await window.electron.ipcRenderer.invoke('getCrawlDataById', id)
      if ((result as CrawlData[]).length > 0) {
        setCrawledData(result as CrawlData[]) // Ép kiểu result thành CrawlData[]
      } else {
        notification.warning({
          message: 'Không có dữ liệu',
          description: `Không có dữ liệu nào được tìm thấy cho từ khoá "${keyword}".`
        })
        setIsModalVisible(false)
      }
    } catch (error) {
      console.error('Error fetching crawl data:', error)
      notification.error({
        message: 'Lỗi',
        description: 'Có lỗi xảy ra trong quá trình lấy dữ liệu.'
      })
      setIsModalVisible(false)
    }
  }
  

  const handleDeleteHistory = async (id: number): Promise<void> => {
    try {
      await window.electron.ipcRenderer.invoke('deleteCrawlHistory', id)
      setHistory(history.filter((record) => record.id !== id))
      notification.success({
        message: 'Xóa thành công',
        description: 'Đã xóa lịch sử crawl'
      })
    } catch (error) {
      console.error('Failed to delete history:', error)
      notification.error({
        message: 'Lỗi',
        description: 'Xóa lịch sử crawl thất bại.'
      })
    }
  }

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  const handleDetailClick = (record: CrawlData) => {
    setSelectedData(record)
    setIsDetailModalVisible(true)
  }

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  const handleSelectChange = (selectedKeys: React.Key[]) => {
    setSelectedRowKeys(selectedKeys)
  }

  const handlePostSelected = async (): Promise<void> => {
    if (selectedRowKeys.length === 0) {
      notification.warning({
        message: 'Chưa chọn từ khoá',
        description: 'Vui lòng chọn ít nhất một từ khoá để đăng bài.'
      })
      return
    }
  
    try {
      setLoadingPost(true)
  
      // Lấy các từ khóa đã chọn từ history
      const selectedKeywords = history.filter((record) => selectedRowKeys.includes(record.id))
  
      // Gửi các từ khóa đã chọn tới main process để xử lý đăng bài
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response: any = await window.electron.ipcRenderer.invoke(
        'postCrawledKeywords',
        selectedKeywords
      )
  
      if (response.success) {
        notification.success({
          message: 'Đăng bài thành công',
          description: 'Các từ khoá đã được đăng bài thành công.'
        })
  
        // Cập nhật lại lịch sử
        const updatedHistory = (await window.electron.ipcRenderer.invoke(
          'getCrawlHistory'
        )) as HistoryRecord[]
        setHistory(updatedHistory)
  
        // Reset các từ khóa đã chọn
        setSelectedRowKeys([])
      } else {
        notification.error({
          message: 'Lỗi',
          description: response.error || 'Đăng bài thất bại.'
        })
      }
    } catch (error) {
      console.error('Error posting selected keywords:', error)
      notification.error({
        message: 'Lỗi',
        description: 'Có lỗi xảy ra trong quá trình đăng bài.'
      })
    } finally {
      setLoadingPost(false)
    }
  }
  

  return (
    <>
      {/* Chuyển selectedKeywords tới CrawForm */}
      <CrawForm
        selectedKeywords={history.filter((record) => selectedRowKeys.includes(record.id))}
      />

      {/* Nút Đăng bài */}
      <Space style={{ marginTop: 20 }}>
        <Button
          type="primary"
          icon={<UploadOutlined />}
          onClick={handlePostSelected}
          disabled={selectedRowKeys.length === 0 || loadingPost}
          loading={loadingPost}
          style={{ backgroundColor: '#722ed1', borderColor: '#722ed1' }}
        >
          Đăng bài
        </Button>
      </Space>

      <CrawHistory
        history={history}
        onKeywordClick={handleKeywordClick}
        onDeleteHistory={handleDeleteHistory}
        selectedRowKeys={selectedRowKeys}
        onSelectChange={handleSelectChange}
      />

      {/* Modal hiển thị danh sách crawl */}
      <Modal
        title={`Dữ liệu đã craw cho từ khoá: ${selectedKeyword || 'Chưa xác định'}`}
        open={isModalVisible} // Thay thế 'visible' bằng 'open'
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={800}
      >
        {crawledData.length > 0 ? (
          <Table
            dataSource={crawledData}
            columns={[
              {
                title: 'Tiêu đề',
                dataIndex: 'data',
                key: 'data',
                width: '20%',
                render: (text: string) => (
                  <span>{text.length > 30 ? `${text.substring(0, 30)}...` : text}</span>
                )
              },
              {
                title: 'URL',
                dataIndex: 'url',
                key: 'url',
                width: '30%',
                render: (text: string) => (
                  <a href={text} target="_blank" rel="noopener noreferrer">
                    {text.length > 30 ? `${text.substring(0, 30)}...` : text}
                  </a>
                )
              },
              {
                title: 'Nội dung',
                dataIndex: 'content',
                key: 'content',
                width: '40%',
                render: (text: string, record: CrawlData) => (
                  <span style={{ display: 'flex', justifyContent: 'space-between' }}>
                    {text.length > 50 ? `${text.substring(0, 50)}...` : text}
                    <Tooltip title="Xem chi tiết">
                      <Button
                        icon={<EyeOutlined />}
                        size="small"
                        onClick={() => handleDetailClick(record)}
                        type="link"
                      />
                    </Tooltip>
                  </span>
                )
              }
            ]}
            rowKey="id"
            pagination={false}
            scroll={{ y: 400 }}
          />
        ) : (
          <p>Không có dữ liệu để hiển thị</p>
        )}
      </Modal>

      {/* Modal hiển thị chi tiết thông tin */}
      <Modal
        title="Thông tin chi tiết"
        open={isDetailModalVisible} // Thay thế 'visible' bằng 'open'
        onCancel={() => setIsDetailModalVisible(false)}
        footer={null}
      >
        {selectedData && (
          <div>
            <p>
              <strong>Tiêu đề:</strong> {selectedData.data}
            </p>
            <p>
              <strong>URL:</strong>{' '}
              <a href={selectedData.url} target="_blank" rel="noopener noreferrer">
                {selectedData.url}
              </a>
            </p>
            <p>
              <strong>Nội dung:</strong> {selectedData.content}
            </p>
          </div>
        )}
      </Modal>
    </>
  )
}

export default CrawApp
