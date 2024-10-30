/* eslint-disable prettier/prettier */
import { ipcMain } from 'electron'
import { mainWindow, dbPromise, createTables } from './index'

// ==================== QUẢN LÝ TÀI KHOẢN ====================

// Xử lý sự kiện 'start' để thêm tài khoản
ipcMain.on('start', async (_, data): Promise<void> => {
  const db = await dbPromise
  await createTables()

  await db.run('INSERT INTO accounts (name, email, password, account_type) VALUES (?, ?, ?, ?)', [
    data.name,
    data.email,
    data.password,
    data.account_type
  ])

  mainWindow?.webContents.send('update', {
    action: 'log',
    message: 'Đã lưu tài khoản thành công'
  })
})

// Xử lý sự kiện 'updateAccount' để sửa tài khoản
ipcMain.on('updateAccount', async (_, data): Promise<void> => {
  const db = await dbPromise
  await db.run(
    'UPDATE accounts SET name = ?, email = ?, password = ?, account_type = ? WHERE id = ?',
    [data.name, data.email, data.password, data.account_type, data.id]
  )

  mainWindow?.webContents.send('update', {
    action: 'log',
    message: 'Đã cập nhật tài khoản thành công'
  })
})

// Xử lý sự kiện 'deleteAccount' để xóa tài khoản
ipcMain.on('deleteAccount', async (_, id): Promise<void> => {
  const db = await dbPromise
  await db.run('DELETE FROM accounts WHERE id = ?', [id])

  mainWindow?.webContents.send('update', {
    action: 'log',
    message: 'Đã xóa tài khoản thành công'
  })
})

// Thêm handler cho sự kiện 'getAccounts' để lấy danh sách tài khoản
// eslint-disable-next-line @typescript-eslint/no-explicit-any
ipcMain.handle('getAccounts', async (_, accountType): Promise<any> => {
  const db = await dbPromise
  try {
    const accounts = await db.all('SELECT * FROM accounts WHERE account_type = ?', [accountType])
    return accounts // Trả về danh sách tài khoản
  } catch (error) {
    console.error('Lỗi khi lấy tài khoản:', error)
    return [] // Trả về mảng rỗng nếu có lỗi
  }
})
