// CrawForm.tsx
import React, { useState } from 'react'
import { Button, Input, Form, Space, notification, InputNumber } from 'antd'
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
  EditOutlined,
} from '@ant-design/icons'

interface HistoryRecord {
  id: number
  keyword: string
  time: string
}

interface CrawFormProps {
  selectedKeywords: HistoryRecord[] // Thêm prop selectedKeywords
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const CrawForm: React.FC<CrawFormProps> = ({ selectedKeywords }) => {
  const [keyword, setKeyword] = useState<string>('')
  const [quantity, setQuantity] = useState<number>(1)
  const [isCrawling, setIsCrawling] = useState<boolean>(false)
  const [isPaused, setIsPaused] = useState<boolean>(false)
  const [loading, setLoading] = useState<{
    start: boolean
    pause: boolean
    stop: boolean
    update: boolean
    post: boolean
  }>({
    start: false,
    pause: false,
    stop: false,
    update: false,
    post: false
  })

  const handleStartCrawling = async (): Promise<void> => {
    if (!keyword || quantity <= 0) {
      notification.error({
        message: 'Lỗi',
        description: 'Vui lòng điền đầy đủ thông tin và số lượng hợp lệ!'
      })
      return
    }

    try {
      setLoading({ ...loading, start: true })
      setIsCrawling(true)
      setIsPaused(false)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response: any = await window.electron.ipcRenderer.invoke('startCrawl', {
        keyword,
        quantity
      })

      if (response.success) {
        notification.success({
          message: 'Thành công',
          description: `Bắt đầu crawl cho từ khóa: "${keyword}" với số lượng: ${quantity}`
        })
      } else {
        notification.error({
          message: 'Lỗi',
          description: response.error
        })
        setIsCrawling(false)
      }
    } catch (error) {
      console.error('Error during crawling:', error)
      notification.error({
        message: 'Lỗi',
        description: 'Crawl thất bại, vui lòng thử lại.'
      })
      setIsCrawling(false)
    } finally {
      setLoading({ ...loading, start: false })
    }
  }

  const handlePauseCrawling = async (): Promise<void> => {
    try {
      setLoading({ ...loading, pause: true })

      if (isPaused) {
        await window.electron.ipcRenderer.invoke('resumeCrawl')
        notification.success({
          message: 'Tiếp tục',
          description: 'Crawl đã được tiếp tục.'
        })
      } else {
        await window.electron.ipcRenderer.invoke('pauseCrawl')
        notification.warning({
          message: 'Tạm dừng',
          description: 'Crawl đã được tạm dừng.'
        })
      }

      setIsPaused(!isPaused)
    } catch (error) {
      console.error('Error pausing/resuming crawl:', error)
      notification.error({
        message: 'Lỗi',
        description: 'Không thể tạm dừng/tiếp tục crawl.'
      })
    } finally {
      setLoading({ ...loading, pause: false })
    }
  }

  const handleStopCrawling = async (): Promise<void> => {
    try {
      setLoading({ ...loading, stop: true })
      await window.electron.ipcRenderer.invoke('stopCrawl')
      setIsCrawling(false)
      setIsPaused(false)
      setKeyword('')
      setQuantity(1)
      notification.info({
        message: 'Dừng crawl',
        description: 'Crawl đã được dừng.'
      })
    } catch (error) {
      console.error('Error stopping crawl:', error)
      notification.error({
        message: 'Lỗi',
        description: 'Không thể dừng crawl.'
      })
    } finally {
      setLoading({ ...loading, stop: false })
    }
  }

  const handleUpdate = async (): Promise<void> => {
    // Placeholder for update functionality
    try {
      setLoading({ ...loading, update: true })
      // Implement your update logic here, e.g., updating crawl settings
      notification.success({
        message: 'Cập nhật thành công',
        description: 'Các thiết lập crawl đã được cập nhật.'
      })
    } catch (error) {
      console.error('Error updating settings:', error)
      notification.error({
        message: 'Lỗi',
        description: 'Không thể cập nhật các thiết lập.'
      })
    } finally {
      setLoading({ ...loading, update: false })
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  

  return (
    <Form layout="vertical">
      <Form.Item label="Từ khoá" rules={[{ required: true, message: 'Vui lòng nhập từ khoá!' }]}>
        <Input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Nhập từ khoá cần craw"
        />
      </Form.Item>
      <Form.Item
        label="Số lượng bài viết"
        rules={[{ required: true, message: 'Vui lòng nhập số lượng hợp lệ!' }]}
      >
        <InputNumber
          value={quantity}
          onChange={(value) => setQuantity(value ?? 1)} // Nếu value là undefined, set về 1
          placeholder="Nhập số lượng bài viết cần craw"
          min={1} // Không cho phép giá trị nhỏ hơn 1
          style={{ width: '100%' }}
        />
      </Form.Item>
      <Space>
        <Button
          type="primary"
          icon={<PlayCircleOutlined />}
          onClick={handleStartCrawling}
          disabled={isCrawling || loading.start}
          loading={loading.start}
          style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
        >
          Bắt đầu Craw
        </Button>
        <Button
          type="default"
          icon={<PauseCircleOutlined />}
          onClick={handlePauseCrawling}
          disabled={!isCrawling || loading.pause}
          loading={loading.pause}
          style={{ backgroundColor: '#faad14', borderColor: '#faad14', color: '#fff' }}
        >
          {isPaused ? 'Tiếp tục' : 'Tạm dừng'}
        </Button>
        <Button
          type="danger"
          icon={<StopOutlined />}
          onClick={handleStopCrawling}
          disabled={!isCrawling || loading.stop}
          loading={loading.stop}
          style={{ backgroundColor: '#f5222d', borderColor: '#f5222d' }}
        >
          Dừng
        </Button>

        {/* Button Cập nhật */}
        <Button
          type="danger"
          icon={<EditOutlined />}
          onClick={handleUpdate}
          disabled={!isCrawling || loading.update}
          loading={loading.update}
          style={{ backgroundColor: '#1890ff', borderColor: '#1890ff', color: '#fff' }}
        >
          Cập nhật
        </Button>
      </Space>
    </Form>
  )
}

export default CrawForm
