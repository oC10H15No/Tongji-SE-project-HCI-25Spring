/**
 * 语音识别管理器
 * 基于浏览器Web Speech API实现语音识别功能
 */
export class VoiceManager {
  constructor() {
    this.recognition = null
    this.isListening = false
    this.isSupported = false
    this.callbacks = {
      onResult: [],
      onStart: [],
      onEnd: [],
      onError: []
    }
    
    // 语音识别配置
    this.config = {
      lang: 'zh-CN',
      continuous: false,
      interimResults: true,
      maxAlternatives: 1
    }
    
    this.initializeRecognition()
  }

  /**
   * 初始化语音识别
   */
  initializeRecognition() {
    // 检查浏览器支持
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('⚠️ VoiceManager: 浏览器不支持语音识别')
      this.isSupported = false
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    this.recognition = new SpeechRecognition()
    this.isSupported = true

    // 配置语音识别参数
    this.recognition.continuous = this.config.continuous
    this.recognition.interimResults = this.config.interimResults
    this.recognition.lang = this.config.lang
    this.recognition.maxAlternatives = this.config.maxAlternatives

    // 绑定事件处理器
    this.recognition.onstart = this.handleStart.bind(this)
    this.recognition.onresult = this.handleResult.bind(this)
    this.recognition.onerror = this.handleError.bind(this)
    this.recognition.onend = this.handleEnd.bind(this)
    this.recognition.onspeechstart = this.handleSpeechStart.bind(this)
    this.recognition.onnomatch = this.handleNoMatch.bind(this)

    console.log('✅ VoiceManager: 语音识别初始化完成')
  }

  /**
   * 开始语音识别
   */
  async start() {
    if (!this.isSupported) {
      throw new Error('浏览器不支持语音识别功能')
    }

    if (this.isListening) {
      console.log('ℹ️ VoiceManager: 语音识别已在运行中')
      return
    }

    try {
      // 请求麦克风权限
      await navigator.mediaDevices.getUserMedia({ audio: true })
      
      this.recognition.start()
      console.log('🎤 VoiceManager: 开始语音识别')
      
    } catch (error) {
      console.error('❌ VoiceManager: 启动语音识别失败:', error)
      throw new Error(`启动语音识别失败: ${error.message}`)
    }
  }

  /**
   * 停止语音识别
   */
  stop() {
    if (!this.isListening || !this.recognition) {
      return
    }

    try {
      this.recognition.stop()
      console.log('🛑 VoiceManager: 停止语音识别')
    } catch (error) {
      console.error('❌ VoiceManager: 停止语音识别失败:', error)
    }
  }

  /**
   * 处理识别开始事件
   */
  handleStart() {
    this.isListening = true
    console.log('🎤 VoiceManager: 语音识别已开始')
    this.emit('onStart')
  }

  /**
   * 处理识别结果事件
   */
  handleResult(event) {
    console.log('📝 VoiceManager: 收到语音识别结果:', event)
    
    let finalTranscript = ''
    let interimTranscript = ''
    
    // 处理识别结果
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript
      const confidence = event.results[i][0].confidence
      
      console.log(`结果 ${i}: "${transcript}" (置信度: ${confidence || 'N/A'})`)
      
      if (event.results[i].isFinal) {
        finalTranscript += transcript
      } else {
        interimTranscript += transcript
      }
    }
    
    // 发送结果给监听器
    this.emit('onResult', {
      finalTranscript: finalTranscript.trim(),
      interimTranscript: interimTranscript.trim(),
      isFinal: !!finalTranscript,
      confidence: event.results[event.results.length - 1]?.[0]?.confidence || 0
    })
  }

  /**
   * 处理识别错误事件
   */
  handleError(event) {
    console.error('❌ VoiceManager: 语音识别错误:', event.error)
    
    let errorMessage = '语音识别发生错误'
    
    switch (event.error) {
      case 'no-speech':
        errorMessage = '未检测到语音输入，请重试'
        break
      case 'audio-capture':
        errorMessage = '无法访问麦克风，请检查设备设置'
        break
      case 'not-allowed':
        errorMessage = '麦克风权限被拒绝，请允许使用麦克风'
        break
      case 'network':
        errorMessage = '网络错误，请检查网络连接'
        break
      case 'service-not-allowed':
        errorMessage = '语音识别服务不可用'
        break
      default:
        errorMessage = `语音识别错误: ${event.error}`
    }
    
    this.emit('onError', { error: event.error, message: errorMessage })
  }

  /**
   * 处理识别结束事件
   */
  handleEnd() {
    this.isListening = false
    console.log('🔚 VoiceManager: 语音识别已结束')
    this.emit('onEnd')
  }

  /**
   * 处理语音开始事件
   */
  handleSpeechStart() {
    console.log('🗣️ VoiceManager: 检测到语音输入')
  }

  /**
   * 处理无匹配结果事件
   */
  handleNoMatch() {
    console.log('❓ VoiceManager: 未能识别语音内容')
    this.emit('onResult', {
      finalTranscript: '',
      interimTranscript: '',
      isFinal: true,
      confidence: 0,
      noMatch: true
    })
  }

  /**
   * 添加事件监听器
   */
  on(event, callback) {
    if (this.callbacks[event]) {
      this.callbacks[event].push(callback)
    }
  }

  /**
   * 移除事件监听器
   */
  off(event, callback) {
    if (this.callbacks[event]) {
      this.callbacks[event] = this.callbacks[event].filter(cb => cb !== callback)
    }
  }

  /**
   * 触发事件
   */
  emit(event, data = null) {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`❌ VoiceManager: 事件回调执行失败 (${event}):`, error)
        }
      })
    }
  }

  /**
   * 检查是否支持语音识别
   */
  isRecognitionSupported() {
    return this.isSupported
  }

  /**
   * 获取当前状态
   */
  getStatus() {
    return {
      isSupported: this.isSupported,
      isListening: this.isListening,
      config: { ...this.config }
    }
  }

  /**
   * 重新初始化
   */
  reinitialize() {
    this.stop()
    setTimeout(() => {
      this.initializeRecognition()
    }, 100)
  }

  /**
   * 销毁语音管理器
   */
  destroy() {
    this.stop()
    this.callbacks = {
      onResult: [],
      onStart: [],
      onEnd: [],
      onError: []
    }
    this.recognition = null
    console.log('🧹 VoiceManager: 已销毁')
  }
}
