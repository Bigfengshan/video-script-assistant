import { Router } from 'express'

const router = Router()

// 健康检查端点
router.get('/', async (req, res) => {
  try {
    // 简单的健康检查，返回服务状态
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      message: '服务运行正常'
    })
  } catch (error) {
    console.error('健康检查失败:', error)
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      message: '服务异常'
    })
  }
})

export default router