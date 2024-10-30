/* eslint-disable prettier/prettier */
import { ipcMain } from 'electron'
import * as puppeteer from 'puppeteer'  // Sử dụng cú pháp import đúng
import { mainWindow, dbPromise } from './index'

// ==================== CRAWL REDDIT ====================

let browser: puppeteer.Browser | null = null; // Khai báo biến `browser` tại đây
let isPaused = false; // Khai báo biến `isPaused` tại đây

// Hàm để retry việc tải trang không giới hạn số lần thử
async function retryPageLoad(page: puppeteer.Page, url: string): Promise<void> {
  let attempts = 0
  // eslint-disable-next-line no-constant-condition
  while (true) {
    attempts++
    try {
      console.log(`Attempt ${attempts}: Navigating to ${url}`)
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })
      const pageContent = await page.content()

      // Kiểm tra nếu trang hiện ra lỗi "no healthy upstream"
      if (pageContent.includes('no healthy upstream')) {
        console.error(`"no healthy upstream" error detected on attempt ${attempts}`)
        throw new Error('No healthy upstream error')
      }

      console.log(`Page loaded successfully on attempt ${attempts}`)
      return // Thoát khi trang tải thành công và không có lỗi
    } catch (error) {
      console.error(`Error loading page (${url}), attempt ${attempts}: ${(error as Error).message}`)
      if (attempts >= 10) {
        throw new Error('Failed to load page after maximum retries.')
      }
      await new Promise((resolve) => setTimeout(resolve, 5000))
    }
  }
}

// Hàm crawl bài viết từ Reddit với việc mở tab để lấy nội dung từ thẻ `div.text-neutral-content`
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function crawlRedditByKeyword(keyword: string, maxTabs = 3): Promise<any[]> {
  try {
    browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    const page = await browser.newPage()
    const searchUrl = `https://www.reddit.com/search/?q=${encodeURIComponent(keyword)}`

    await retryPageLoad(page, searchUrl)

    await page.waitForSelector('faceplate-tracker[data-testid="search-post"]', { timeout: 20000 })

    const posts = await page.evaluate(() => {
      const postElements = document.querySelectorAll('faceplate-tracker[data-testid="search-post"]')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const results: any[] = []

      postElements.forEach((post) => {
        const ariaLabelledBy = post.getAttribute('aria-labelledby')
        const titleElement = ariaLabelledBy ? document.getElementById(ariaLabelledBy) : null
        const linkElement = titleElement ? titleElement.closest('a') : null

        if (titleElement && linkElement) {
          results.push({
            title: (titleElement as HTMLElement).innerText,
            url: linkElement.href
          })
        }
      })

      return results
    })

    if (posts.length === 0) {
      throw new Error('No posts found.')
    }

    const tabs: puppeteer.Page[] = []
    for (let i = 0; i < maxTabs; i++) {
      tabs.push(await browser.newPage())
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const validPosts: any[] = []

    for (let i = 0; i < posts.length; i++) {
      const tab = tabs[i % maxTabs]

      try {
        await retryPageLoad(tab, posts[i].url)
        const content = await tab.evaluate(() => {
          const contentDiv = document.querySelector('div.text-neutral-content')
          return contentDiv ? (contentDiv as HTMLElement).innerText.trim() : null
        })

        if (content) {
          posts[i].content = content
          validPosts.push(posts[i])
        }
      } catch (error) {
        console.error(`Error processing post ${posts[i].url}: ${(error as Error).message}`)
      }
    }

    await page.close()
    await browser.close()
    return validPosts
  } catch (error) {
    if (browser) await browser.close()
    throw new Error('Crawling failed: ' + (error as Error).message)
  }
}

// Xử lý sự kiện 'startCrawl' để thực hiện crawling bằng Puppeteer
ipcMain.handle('startCrawl', async (_, { keyword }) => {
  try {
    const db = await dbPromise
    const time = new Date().toISOString()
    const crawlHistoryResult = await db.run(
      'INSERT INTO crawl_history (keyword, time) VALUES (?, ?)',
      [keyword, time]
    )
    const crawlId = crawlHistoryResult.lastID

    const posts = await crawlRedditByKeyword(keyword)
    for (const post of posts) {
      await db.run('INSERT INTO crawl_data (crawl_id, data, url, content) VALUES (?, ?, ?, ?)', [
        crawlId,
        post.title,
        post.url,
        post.content
      ])
    }

    mainWindow?.webContents.send('updateHistory', { success: true, posts })
    return { success: true, posts }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
})

// Tạm dừng quá trình crawl
ipcMain.handle('pauseCrawl', async () => {
  if (browser) {
    await browser
      .pages()
      .then((pages) => pages.forEach((page) => page.evaluate(() => window.stop())))
    isPaused = true
  }
})

// Tiếp tục quá trình crawl
ipcMain.handle('resumeCrawl', async () => {
  if (browser && isPaused) {
    await browser.pages().then((pages) => pages.forEach((page) => page.reload()))
    isPaused = false
  }
})

// Dừng quá trình crawl và đóng trình duyệt
ipcMain.handle('stopCrawl', async () => {
  if (browser) {
    await browser.close()
    browser = null
    isPaused = false
  }
})

// Lấy lịch sử crawl từ DB
// eslint-disable-next-line @typescript-eslint/no-explicit-any
ipcMain.handle('getCrawlHistory', async (): Promise<any> => {
  const db = await dbPromise
  try {
    const history = await db.all('SELECT * FROM crawl_history')
    return history
  } catch (error) {
    return []
  }
})

// Xóa lịch sử crawl từ DB
ipcMain.handle('deleteCrawlHistory', async (_, id): Promise<void> => {
  const db = await dbPromise
  await db.run('DELETE FROM crawl_history WHERE id = ?', [id])

  mainWindow?.webContents.send('update', {
    action: 'log',
    message: 'Đã xóa lịch sử crawl thành công'
  })
})

ipcMain.handle('getCrawlDataById', async (_, crawlId) => {
  try {
    const db = await dbPromise
    const crawlData = await db.all('SELECT * FROM crawl_data WHERE crawl_id = ?', [crawlId])
    return crawlData
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu crawl:', error)
    return []
  }
})

// Thêm handler cho sự kiện 'updateCrawlHistory' để cập nhật lịch sử crawl
ipcMain.handle(
  'updateCrawlHistory',
  async (_, data): Promise<{ success: boolean; error?: string }> => {
    const db = await dbPromise
    try {
      const { id, keyword, time } = data

      if (!id || !keyword || !time) {
        throw new Error('Missing required fields: id, keyword, time')
      }

      const result = await db.run('UPDATE crawl_history SET keyword = ?, time = ? WHERE id = ?', [
        keyword,
        time,
        id
      ])

      if (result.changes === 0) {
        return { success: false, error: 'Không tìm thấy lịch sử crawl với ID này.' }
      }

      mainWindow?.webContents.send('update', {
        action: 'log',
        message: `Đã cập nhật lịch sử crawl ID ${id} thành công.`
      })

      mainWindow?.webContents.send('updateHistory', { success: true })

      return { success: true }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('Error updating crawl history:', error)
      return { success: false, error: error.message }
    }
  }
)

// ==================== KẾT THÚC CRAWL REDDIT ====================
