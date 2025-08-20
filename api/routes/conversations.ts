import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabase'
import { authenticateToken } from '../middleware/auth'
import axios from 'axios'

const router = Router()

// 获取用户的对话列表
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: '用户未认证' })
    }

    const { agent_id } = req.query;
    
    let query = supabaseAdmin
      .from('conversations')
      .select(`
        *,
        ai_agents!inner(
          id,
          name,
          avatar_url
        )
      `)
      .eq('user_id', userId);
    
    // 如果提供了agent_id参数，则按agent_id过滤
    if (agent_id) {
      query = query.eq('agent_id', agent_id);
    }
    
    const { data: conversations, error } = await query.order('updated_at', { ascending: false })

    if (error) {
      console.error('获取对话列表失败:', error)
      return res.status(500).json({ error: '获取对话列表失败' })
    }

    res.json({ conversations })
  } catch (error) {
    console.error('获取对话列表错误:', error)
    res.status(500).json({ error: '服务器内部错误' })
  }
})

// 创建新对话
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id
    const { agent_id, title } = req.body

    if (!userId) {
      return res.status(401).json({ error: '用户未认证' })
    }

    if (!agent_id) {
      return res.status(400).json({ error: '缺少AI员工ID' })
    }

    // 验证AI员工是否存在
    const { data: agent, error: agentError } = await supabaseAdmin
      .from('ai_agents')
      .select('id, name')
      .eq('id', agent_id)
      .eq('is_active', true)
      .single()

    if (agentError || !agent) {
      return res.status(404).json({ error: 'AI员工不存在' })
    }

    // 创建对话
    const { data: conversation, error } = await supabaseAdmin
      .from('conversations')
      .insert({
        user_id: userId,
        agent_id,
        title: title || `与${agent.name}的对话`
      })
      .select(`
        *,
        ai_agents!inner(
          id,
          name,
          avatar_url
        )
      `)
      .single()

    if (error) {
      console.error('创建对话失败:', error)
      return res.status(500).json({ error: '创建对话失败' })
    }

    res.status(201).json({ conversation })
  } catch (error) {
    console.error('创建对话错误:', error)
    res.status(500).json({ error: '服务器内部错误' })
  }
})

// 获取对话详情和消息
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id
    const { id } = req.params

    if (!userId) {
      return res.status(401).json({ error: '用户未认证' })
    }

    // 获取对话信息
    const { data: conversation, error: convError } = await supabaseAdmin
      .from('conversations')
      .select(`
        *,
        ai_agents!inner(
          id,
          name,
          avatar_url,
          description
        )
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (convError || !conversation) {
      console.error('获取对话详情失败:', {
        conversationId: id,
        userId: userId,
        error: convError,
        conversation: conversation
      })
      return res.status(404).json({ error: '对话不存在' })
    }

    // 获取消息列表
    const { data: messages, error: msgError } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true })

    if (msgError) {
      console.error('获取消息列表失败:', msgError)
      return res.status(500).json({ error: '获取消息列表失败' })
    }

    res.json({ conversation, messages })
  } catch (error) {
    console.error('获取对话详情错误:', error)
    res.status(500).json({ error: '服务器内部错误' })
  }
})

// 发送消息
router.post('/:id/messages', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id
    const { id } = req.params
    const { content } = req.body

    if (!userId) {
      return res.status(401).json({ error: '用户未认证' })
    }

    if (!content || content.trim() === '') {
      return res.status(400).json({ error: '消息内容不能为空' })
    }

    // 验证对话是否属于当前用户
    const { data: conversation, error: convError } = await supabaseAdmin
      .from('conversations')
      .select(`
        *,
        ai_agents!inner(
          id,
          name,
          integration_type,
          dify_api_endpoint,
          api_key,
          deepseek_api_key,
          deepseek_model,
          system_prompt,
          temperature,
          max_tokens
        )
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (convError || !conversation) {
      console.error('验证对话所有权失败:', {
        conversationId: id,
        userId: userId,
        error: convError,
        conversation: conversation
      })
      return res.status(404).json({ error: '对话不存在' })
    }

    // 保存用户消息
    const { data: userMessage, error: userMsgError } = await supabaseAdmin
      .from('messages')
      .insert({
        conversation_id: id,
        role: 'user',
        content: content.trim()
      })
      .select()
      .single()

    if (userMsgError) {
      console.error('保存用户消息失败:', userMsgError)
      return res.status(500).json({ error: '保存消息失败' })
    }

    // 根据AI员工类型调用相应的API生成回复
    try {
      let aiResponse: string
      
      if (conversation.ai_agents.integration_type === 'deepseek') {
        aiResponse = await generateDeepSeekResponse(content, conversation.ai_agents)
      } else {
        aiResponse = await generateAIResponse(content, conversation.ai_agents)
      }
      
      // 保存AI回复
      const { data: aiMessage, error: aiMsgError } = await supabaseAdmin
        .from('messages')
        .insert({
          conversation_id: id,
          role: 'assistant',
          content: aiResponse,
          status: 'success' // 标记为成功的API调用
        })
        .select()
        .single()

      if (aiMsgError) {
        console.error('保存AI消息失败:', aiMsgError)
        return res.status(500).json({ error: '保存AI回复失败' })
      }

      // 更新对话的最后活动时间
      await supabaseAdmin
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', id)

      res.json({ 
        userMessage, 
        aiMessage 
      })
    } catch (apiError) {
      console.error('AI回复生成失败:', apiError.message)
      
      // API调用失败时，直接返回错误信息给前端
      return res.status(500).json({ 
        error: 'AI服务暂时不可用，请稍后重试',
        details: apiError.message,
        userMessage // 仍然返回用户消息，表示用户消息已保存
      })
    }
  } catch (error) {
    console.error('发送消息错误:', error)
    res.status(500).json({ error: '服务器内部错误' })
  }
})

// 调用Dify API生成AI回复
async function generateAIResponse(userMessage: string, agent: any): Promise<string> {
  console.log(`开始为AI员工 ${agent.name} 生成回复`)
  console.log(`API端点: ${agent.dify_api_endpoint}`)
  console.log(`API密钥: ${agent.api_key ? `已配置 (长度: ${agent.api_key.length}, 前缀: ${agent.api_key.substring(0, 10)}...)` : '未配置'}`)
  console.log(`用户消息: ${userMessage}`)
  
  // 检查agent是否有必要的API配置
  if (!agent.dify_api_endpoint || !agent.api_key) {
    console.error(`AI员工 ${agent.name} 缺少Dify API配置`)
    throw new Error(`AI员工 ${agent.name} 的API配置不完整，请联系管理员`)
  }

  const apiEndpoint = `${agent.dify_api_endpoint}/chat-messages`
  console.log(`完整API端点: ${apiEndpoint}`)
  
  // 重试机制：最多重试3次
  const maxRetries = 3
  let lastError: any
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`正在调用Dify API... (尝试 ${attempt + 1}/${maxRetries + 1})`)
      
      // 创建axios实例，优化网络配置
      const axiosInstance = axios.create({
        timeout: 120000, // 120秒超时
        headers: {
          'Authorization': `Bearer ${agent.api_key}`,
          'Content-Type': 'application/json',
          'User-Agent': 'AI-Assistant/1.0'
        },
        // 重试配置
        validateStatus: (status) => status < 500, // 只有5xx错误才重试
        maxRedirects: 5
      })
      
      const response = await axiosInstance.post(
        apiEndpoint,
        {
          inputs: {},
          query: userMessage,
          response_mode: 'blocking',
          conversation_id: '',
          user: 'user-' + Date.now()
        }
      )

      console.log('Dify API响应状态:', response.status)
      console.log('Dify API响应数据:', response.data)
      
      // 处理blocking响应
      if (response.data && response.data.answer) {
        console.log('收到AI回复:', response.data.answer)
        return response.data.answer
      } else {
        console.warn('API响应格式异常:', response.data)
        throw new Error('API返回的响应格式不正确')
      }
      
    } catch (error) {
      lastError = error
      console.error(`调用Dify API失败 (尝试 ${attempt + 1}/${maxRetries + 1}):`, error.message)
      console.error('错误类型:', error.constructor.name)
      console.error('错误代码:', error.code)
      
      // 详细的网络错误分析
      let errorType = '未知错误'
      let shouldRetry = false
      
      if (error.code === 'ECONNRESET' || error.message.includes('socket hang up')) {
        errorType = '网络连接被重置'
        shouldRetry = true
      } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
        errorType = '连接超时'
        shouldRetry = true
      } else if (error.code === 'ENOTFOUND' || error.code === 'EAI_AGAIN') {
        errorType = 'DNS解析失败'
        shouldRetry = true
      } else if (error.code === 'ECONNREFUSED') {
        errorType = '连接被拒绝'
        shouldRetry = false
      } else if (error.response) {
        errorType = `HTTP错误 ${error.response.status}`
        shouldRetry = error.response.status >= 500
        console.error('API响应状态:', error.response.status)
        console.error('API响应头:', error.response.headers)
        console.error('API响应数据:', error.response.data)
      } else if (error.request) {
        errorType = '请求已发送但未收到响应'
        shouldRetry = true
        console.error('请求配置:', error.config)
      }
      
      console.error(`错误类型: ${errorType}, 是否重试: ${shouldRetry}`)
      
      // 如果是最后一次尝试或不应该重试，则抛出错误
      if (attempt === maxRetries || !shouldRetry) {
        break
      }
      
      // 等待一段时间后重试（指数退避，更长等待时间）
      const waitTimes = [2000, 5000, 10000] // 2s, 5s, 10s
      const waitTime = waitTimes[attempt] || 10000
      console.log(`网络连接不稳定，等待 ${waitTime/1000}秒 后重试...`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
  }
  
  // 所有重试都失败了，抛出最后的错误
  const errorMessage = getDetailedErrorMessage(lastError)
  console.error('所有重试都失败，最终错误:', errorMessage)
  throw new Error(errorMessage)
}

// 获取详细的错误信息
function getDetailedErrorMessage(error: any): string {
  if (error.code === 'ECONNRESET' || error.message.includes('socket hang up')) {
    return 'Dify API调用失败: 网络连接不稳定，已尝试多次重试但仍然失败。请检查网络连接状态，或稍后再试。如果问题持续存在，请联系技术支持。'
  } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
    return 'Dify API调用失败: 连接超时，API服务器响应时间过长。网络可能较慢或服务器负载较高，请稍后重试。'
  } else if (error.code === 'ENOTFOUND' || error.code === 'EAI_AGAIN') {
    return 'Dify API调用失败: 无法解析API服务器地址，请检查网络设置和DNS配置。'
  } else if (error.code === 'ECONNREFUSED') {
    return 'Dify API调用失败: API服务器拒绝连接，服务器可能暂时不可用，请稍后重试。'
  } else if (error.response) {
    return `Dify API调用失败: HTTP ${error.response.status} - ${error.response.statusText || '服务器错误'}。请稍后重试或联系技术支持。`
  } else {
    return `Dify API调用失败: ${error.message}。如果问题持续存在，请联系技术支持。`
  }
}

// 调用DeepSeek API生成AI回复
async function generateDeepSeekResponse(userMessage: string, agent: any): Promise<string> {
  console.log(`开始为DeepSeek AI员工 ${agent.name} 生成回复`)
  console.log(`DeepSeek API密钥: ${agent.deepseek_api_key ? `已配置 (长度: ${agent.deepseek_api_key.length})` : '未配置'}`)
  console.log(`模型: ${agent.deepseek_model || 'deepseek-chat'}`)
  console.log(`用户消息: ${userMessage}`)
  
  // 检查agent是否有必要的DeepSeek API配置
  if (!agent.deepseek_api_key) {
    console.error(`DeepSeek AI员工 ${agent.name} 缺少API密钥配置`)
    throw new Error(`DeepSeek AI员工 ${agent.name} 的API密钥未配置，请联系管理员`)
  }

  const apiEndpoint = 'https://api.deepseek.com/v1/chat/completions'
  console.log(`DeepSeek API端点: ${apiEndpoint}`)
  
  // 重试机制：最多重试3次
  const maxRetries = 3
  let lastError: any
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`正在调用DeepSeek API... (尝试 ${attempt + 1}/${maxRetries + 1})`)
      
      // 构建消息数组
      const messages = []
      
      // 添加系统提示词（如果有）
      if (agent.system_prompt) {
        messages.push({
          role: 'system',
          content: agent.system_prompt
        })
      }
      
      // 添加用户消息
      messages.push({
        role: 'user',
        content: userMessage
      })
      
      // 创建axios实例，优化网络配置
      const axiosInstance = axios.create({
        timeout: 120000, // 120秒超时
        headers: {
          'Authorization': `Bearer ${agent.deepseek_api_key}`,
          'Content-Type': 'application/json',
          'User-Agent': 'AI-Assistant/1.0'
        },
        validateStatus: (status) => status < 500, // 只有5xx错误才重试
        maxRedirects: 5
      })
      
      const requestBody = {
        model: agent.deepseek_model || 'deepseek-chat',
        messages: messages,
        temperature: agent.temperature || 0.7,
        max_tokens: agent.max_tokens || 2048,
        stream: false
      }
      
      console.log('DeepSeek API请求体:', JSON.stringify(requestBody, null, 2))
      
      const response = await axiosInstance.post(apiEndpoint, requestBody)

      console.log('DeepSeek API响应状态:', response.status)
      console.log('DeepSeek API响应数据:', response.data)
      
      // 处理响应
      if (response.data && response.data.choices && response.data.choices.length > 0) {
        const aiResponse = response.data.choices[0].message.content
        console.log('收到DeepSeek AI回复:', aiResponse)
        return aiResponse
      } else {
        console.warn('DeepSeek API响应格式异常:', response.data)
        throw new Error('DeepSeek API返回的响应格式不正确')
      }
      
    } catch (error) {
      lastError = error
      console.error(`调用DeepSeek API失败 (尝试 ${attempt + 1}/${maxRetries + 1}):`, error.message)
      console.error('错误类型:', error.constructor.name)
      console.error('错误代码:', error.code)
      
      // 详细的网络错误分析
      let errorType = '未知错误'
      let shouldRetry = false
      
      if (error.code === 'ECONNRESET' || error.message.includes('socket hang up')) {
        errorType = '网络连接被重置'
        shouldRetry = true
      } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
        errorType = '连接超时'
        shouldRetry = true
      } else if (error.code === 'ENOTFOUND' || error.code === 'EAI_AGAIN') {
        errorType = 'DNS解析失败'
        shouldRetry = true
      } else if (error.code === 'ECONNREFUSED') {
        errorType = '连接被拒绝'
        shouldRetry = false
      } else if (error.response) {
        errorType = `HTTP错误 ${error.response.status}`
        shouldRetry = error.response.status >= 500
        console.error('DeepSeek API响应状态:', error.response.status)
        console.error('DeepSeek API响应头:', error.response.headers)
        console.error('DeepSeek API响应数据:', error.response.data)
      } else if (error.request) {
        errorType = '请求已发送但未收到响应'
        shouldRetry = true
        console.error('请求配置:', error.config)
      }
      
      console.error(`错误类型: ${errorType}, 是否重试: ${shouldRetry}`)
      
      // 如果是最后一次尝试或不应该重试，则抛出错误
      if (attempt === maxRetries || !shouldRetry) {
        break
      }
      
      // 等待一段时间后重试（指数退避）
      const waitTimes = [2000, 5000, 10000] // 2s, 5s, 10s
      const waitTime = waitTimes[attempt] || 10000
      console.log(`网络连接不稳定，等待 ${waitTime/1000}秒 后重试...`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
  }
  
  // 所有重试都失败了，抛出最后的错误
  const errorMessage = getDeepSeekErrorMessage(lastError)
  console.error('所有重试都失败，最终错误:', errorMessage)
  throw new Error(errorMessage)
}

// 获取DeepSeek详细的错误信息
function getDeepSeekErrorMessage(error: any): string {
  if (error.code === 'ECONNRESET' || error.message.includes('socket hang up')) {
    return 'DeepSeek API调用失败: 网络连接不稳定，已尝试多次重试但仍然失败。请检查网络连接状态，或稍后再试。如果问题持续存在，请联系技术支持。'
  } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
    return 'DeepSeek API调用失败: 连接超时，API服务器响应时间过长。网络可能较慢或服务器负载较高，请稍后重试。'
  } else if (error.code === 'ENOTFOUND' || error.code === 'EAI_AGAIN') {
    return 'DeepSeek API调用失败: 无法解析API服务器地址，请检查网络设置和DNS配置。'
  } else if (error.code === 'ECONNREFUSED') {
    return 'DeepSeek API调用失败: API服务器拒绝连接，服务器可能暂时不可用，请稍后重试。'
  } else if (error.response) {
    if (error.response.status === 401) {
      return 'DeepSeek API调用失败: API密钥无效或已过期，请检查API密钥配置。'
    } else if (error.response.status === 429) {
      return 'DeepSeek API调用失败: 请求频率过高，请稍后重试。'
    } else if (error.response.status === 400) {
      return 'DeepSeek API调用失败: 请求参数错误，请检查配置。'
    }
    return `DeepSeek API调用失败: HTTP ${error.response.status} - ${error.response.statusText || '服务器错误'}。请稍后重试或联系技术支持。`
  } else {
    return `DeepSeek API调用失败: ${error.message}。如果问题持续存在，请联系技术支持。`
  }
}

// 删除对话
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id
    const { id } = req.params

    if (!userId) {
      return res.status(401).json({ error: '用户未认证' })
    }

    if (!id) {
      return res.status(400).json({ error: '缺少对话ID' })
    }

    // 验证对话是否存在且属于当前用户
    const { data: conversation, error: convError } = await supabaseAdmin
      .from('conversations')
      .select('id, user_id, title')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (convError || !conversation) {
      console.error('验证对话所有权失败:', {
        conversationId: id,
        userId: userId,
        error: convError
      })
      return res.status(404).json({ error: '对话不存在或无权限删除' })
    }

    console.log(`开始删除对话: ${conversation.title} (ID: ${id})，用户: ${userId}`)

    // 开始事务：先删除相关消息，再删除对话
    // 1. 删除对话相关的所有消息
    const { error: messagesError } = await supabaseAdmin
      .from('messages')
      .delete()
      .eq('conversation_id', id)

    if (messagesError) {
      console.error('删除对话消息失败:', messagesError)
      return res.status(500).json({ error: '删除对话消息失败' })
    }

    console.log(`已删除对话 ${id} 的所有消息`)

    // 2. 删除对话记录
    const { error: conversationError } = await supabaseAdmin
      .from('conversations')
      .delete()
      .eq('id', id)
      .eq('user_id', userId) // 再次确认用户权限

    if (conversationError) {
      console.error('删除对话记录失败:', conversationError)
      return res.status(500).json({ error: '删除对话记录失败' })
    }

    console.log(`成功删除对话: ${conversation.title} (ID: ${id})`)

    res.json({ 
      message: '对话删除成功',
      deletedConversation: {
        id: conversation.id,
        title: conversation.title
      }
    })
  } catch (error) {
    console.error('删除对话错误:', error)
    res.status(500).json({ error: '服务器内部错误' })
  }
})

export default router