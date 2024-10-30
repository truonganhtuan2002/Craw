/* eslint-disable prettier/prettier */
import { ipcMain } from 'electron';
import puppeteer, { Browser } from 'puppeteer';
import { dbPromise } from './index'; // Đảm bảo `dbPromise` được export từ index.ts

// ==================== Đăng bài =================================

// Hàm lấy bài viết theo từ khóa từ database
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
async function fetchPostsByKeyword(keyword: string) {
  const db = await dbPromise;
  try {
    const crawlHistory = await db.get('SELECT id FROM crawl_history WHERE keyword = ?', [keyword]);
    if (!crawlHistory) throw new Error('Không tìm thấy từ khóa trong lịch sử crawl.');

    const posts = await db.all('SELECT data, content FROM crawl_data WHERE crawl_id = ?', [
      crawlHistory.id
    ]);
    return posts;
  } catch (error) {
    console.error('Lỗi khi lấy bài viết theo từ khóa:', (error as Error).message);
    return [];
  }
}

// Hàm đăng bài viết lên forum.hidemium.io với logic thử lại
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
async function postToForum(posts: Array<{ data: string; content: string }>) {
  for (const post of posts) {
    let success = false;
    let attempts = 0;
    const maxAttempts = 3;

    while (!success && attempts < maxAttempts) {
      let browser: Browser | null = null;
      try {
        browser = await puppeteer.launch({ headless: false });
        const page = await browser.newPage();
        attempts += 1;

        await page.setViewport({ width: 1080, height: 1024 });
        await page.goto('https://forum.hidemium.io/', { waitUntil: 'domcontentloaded' });

        // Kiểm tra nút "create-topic", nếu không có thì thực hiện đăng nhập
        const btnCreate = await page.$('button#create-topic');
        if (!btnCreate) {
          await page.waitForSelector('button.login-button', { timeout: 30000 });
          await page.click('button.login-button');

          // Đợi trường nhập tên đăng nhập và mật khẩu
          await page.waitForSelector('input#login-account-name', { timeout: 30000 });
          await page.type('input#login-account-name', 'truonganhtuan2002al@gmail.com');

          await page.waitForSelector('input#login-account-password', { timeout: 30000 });
          await page.type('input#login-account-password', 'Tuanngan1604');

          await page.click('button#login-button');

          // Đợi nút "Tạo chủ đề mới" xuất hiện sau khi đăng nhập
          await page.waitForSelector('button#create-topic', { timeout: 30000 });
        }

        await page.click('button#create-topic');
        await page.waitForSelector('input#reply-title', { timeout: 30000 });
        await page.type('input#reply-title', post.data);
        await page.type('textarea.ember-text-area', post.content);
        await page.click('button.create');

        console.log(`Đã đăng bài: ${post.data}`);
        success = true; // Đăng bài thành công

        // Chờ 3 giây giữa các bài đăng
        await new Promise((resolve) => setTimeout(resolve, 3000));
      } catch (error) {
        console.error(`Lỗi khi đăng bài lên forum (Thử lần ${attempts}/${maxAttempts}):`, (error as Error).message);
      } finally {
        if (browser) await browser.close(); // Đảm bảo đóng trình duyệt
      }
    }

    if (!success) {
      console.error(`Không thể đăng bài sau ${maxAttempts} lần thử: ${post.data}`);
    }
  }
  return true;
}

// Xử lý sự kiện 'postToForumByKeyword' để đăng bài hàng loạt dựa trên từ khóa
ipcMain.handle('postToForumByKeyword', async (_, keyword) => {
  try {
    const posts = await fetchPostsByKeyword(keyword);
    if (posts.length === 0) throw new Error('Không có bài viết nào cho từ khóa này.');

    const result = await postToForum(posts);
    if (result) {
      console.log(`Đã đăng tất cả bài viết cho từ khóa: ${keyword}`);
      return { success: true };
    } else {
      throw new Error('Có lỗi khi đăng bài.');
    }
  } catch (error) {
    console.error('Lỗi khi đăng bài theo từ khóa:', (error as Error).message);
    return { success: false, error: (error as Error).message };
  }
});

// Xử lý sự kiện 'postCrawledKeywords' để đăng bài cho nhiều từ khóa đã chọn
ipcMain.handle('postCrawledKeywords', async (_, selectedKeywords) => {
  try {
    const results = await Promise.all(
      selectedKeywords.map(async (keyword) => {
        const posts = await fetchPostsByKeyword(keyword.keyword); // Lấy bài viết theo từ khóa
        if (posts.length > 0) {
          return await postToForum(posts); // Đăng bài lên diễn đàn
        }
        return false;
      })
    );

    // Kiểm tra kết quả của từng lần đăng bài
    const success = results.every((result) => result === true);
    return { success };
  } catch (error) {
    console.error('Error in postCrawledKeywords handler:', (error as Error).message);
    return { success: false, error: (error as Error).message };
  }
});
// ===================== Kết thúc đăng bài ===========================
