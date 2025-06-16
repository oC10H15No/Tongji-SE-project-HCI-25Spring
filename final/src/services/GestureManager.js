import { MockGestureGenerator } from '../utils/mediaPipeSimulator.js'

/**
 * 手势识别管理器 - 完全重构版
 * 采用main.js中经过验证的手势识别逻辑
 */
export class GestureManager {
  constructor() {
    this.hands = null
    this.camera = null
    this.videoElement = null
    this.isInitialized = false
    this.isRunning = false
    
    // 先进行浏览器支持检查，立即设置isSupported
    this.isSupported = this.checkBrowserSupport()
    
    // 配置 - 采用main.js中的优化配置
    this.config = {
      maxNumHands: 1,  // 单手识别，提高准确性
      modelComplexity: 1,
      minDetectionConfidence: 0.7,  // 提高检测置信度
      minTrackingConfidence: 0.7
    }
    
    // 事件回调
    this.callbacks = {
      onGesture: [],
      onStart: [],
      onStop: [],
      onError: []
    }
    
    // 手势状态 - 采用main.js中的状态管理
    this.lastGesture = null
    this.gestureHistory = []  // 手势历史记录
    this.lastGestureTime = 0  // 上次手势时间
    this.handPositionHistory = []  // 手部位置历史
    
    // 手势识别参数 - 增加间隔时间防止手势过于敏感
    this.GESTURE_COOLDOWN = 1200  // 增加手势冷却时间(ms)，防止过于敏感
    this.SWIPE_COOLDOWN = 2000    // 滑动手势专用冷却时间，防止地图飞太快
    this.SWIPE_THRESHOLD = 0.05   // 降低滑动阈值，更容易触发
    this.HISTORY_LENGTH = 8       // 减少历史记录长度，提高响应速度
    
    // 模拟器
    this.mockGenerator = new MockGestureGenerator()
    
    // 如果支持，则异步初始化
    if (this.isSupported) {
      this.initializeGestureRecognition()
    }
  }

  /**
   * 初始化手势识别
   */
  async initializeGestureRecognition() {
    try {
      console.log('🤚 GestureManager: 开始初始化手势识别')
      
      await this.loadMediaPipe()
      await this.initializeHands()
      await this.initializeCamera()
      
      this.isInitialized = true
      console.log('✅ GestureManager: 手势识别初始化完成')
      
    } catch (error) {
      console.error('❌ GestureManager: 初始化失败:', error)
      this.isSupported = false
      this.emit('onError', { error: error.message })
    }
  }

  /**
   * 检查浏览器支持
   */
  checkBrowserSupport() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error('❌ GestureManager: 浏览器不支持摄像头访问')
      return false
    }

    // 放宽安全上下文检查
    const isSecureContext = window.isSecureContext || 
                           location.protocol === 'https:' || 
                           location.hostname === 'localhost' ||
                           location.hostname === '127.0.0.1'
    
    if (!isSecureContext) {
      console.warn('⚠️ GestureManager: 建议使用 HTTPS 环境')
    }

    return true
  }

  /**
   * 加载MediaPipe库
   */
  async loadMediaPipe() {
    try {
      if (typeof window.Hands === 'undefined') {
        console.log('📦 GestureManager: 加载MediaPipe库...')
        
        // 尝试加载真实的MediaPipe
        await this.loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js')
        await this.loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js')
        
      }
    } catch (error) {
      console.warn('⚠️ GestureManager: MediaPipe加载失败，使用模拟器')
      await this.loadMediaPipeSimulator()
    }
  }

  /**
   * 动态加载脚本
   */
  loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = src
      script.onload = resolve
      script.onerror = reject
      document.head.appendChild(script)
    })
  }

  /**
   * 加载MediaPipe模拟器
   */
  async loadMediaPipeSimulator() {
    // 创建模拟的全局对象
    window.Hands = class {
      constructor(config) {
        this.config = config || {}
        this.onResults = null
      }
      
      setOptions(options) {
        Object.assign(this.config, options)
      }
      
      send(data) {
        if (this.onResults) {
          // 使用模拟器生成结果
          setTimeout(() => {
            this.onResults({ multiHandLandmarks: [] })
          }, 100)
        }
      }
    }
    
    window.Camera = class {
      constructor(videoElement, config) {
        this.videoElement = videoElement
        this.config = config || {}
        this.stream = null
      }
      
      async start() {
        try {
          const constraints = {
            video: {
              width: { ideal: 640 },
              height: { ideal: 480 },
              facingMode: 'user'
            }
          }
          
          this.stream = await navigator.mediaDevices.getUserMedia(constraints)
          this.videoElement.srcObject = this.stream
          await this.videoElement.play()
          
          // 开始帧处理
          if (this.config.onFrame) {
            this.frameLoop = setInterval(() => {
              this.config.onFrame()
            }, 33) // ~30fps
          }
          
          console.log('📹 GestureManager: 摄像头启动成功')
          return this.stream
        } catch (error) {
          console.error('❌ GestureManager: 摄像头启动失败:', error)
          throw error
        }
      }
      
      stop() {
        if (this.frameLoop) {
          clearInterval(this.frameLoop)
          this.frameLoop = null
        }
        
        if (this.stream) {
          this.stream.getTracks().forEach(track => track.stop())
          this.stream = null
        }
      }
    }
  }

  /**
   * 初始化Hands模型
   */
  async initializeHands() {
    this.hands = new window.Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    })

    this.hands.setOptions(this.config)
    this.hands.onResults((results) => this.processResults(results))
    
    console.log('✅ GestureManager: Hands模型初始化完成')
  }

  /**
   * 初始化摄像头
   */
  async initializeCamera() {
    if (!this.videoElement) {
      this.videoElement = document.createElement('video')
      this.videoElement.width = 640
      this.videoElement.height = 480
      this.videoElement.autoplay = true
      this.videoElement.playsInline = true
      this.videoElement.style.display = 'none'
      document.body.appendChild(this.videoElement)
    }

    this.camera = new window.Camera(this.videoElement, {
      onFrame: async () => {
        if (this.hands && this.isRunning) {
          await this.hands.send({ image: this.videoElement })
        }
      }
    })

    console.log('📹 GestureManager: 摄像头管理器初始化完成')
  }

  /**
   * 启动手势识别
   */
  async start() {
    if (this.isRunning) {
      console.log('⚠️ GestureManager: 手势识别已在运行')
      return
    }

    if (!this.isSupported) {
      throw new Error('手势识别不受支持')
    }

    try {
      console.log('🎯 GestureManager: 启动手势识别')
      
      // 启动摄像头
      await this.camera.start()
      
      this.isRunning = true
      this.emit('onStart', { message: '手势识别已启动' })
      
    } catch (error) {
      console.error('❌ GestureManager: 启动失败:', error)
      this.handleStartError(error)
      throw error
    }
  }

  /**
   * 停止手势识别
   */
  stop() {
    if (!this.isRunning) return

    try {
      if (this.camera) {
        this.camera.stop()
      }
      
      this.isRunning = false
      this.lastGesture = null
      this.gestureHistory = []
      
      console.log('✅ GestureManager: 手势识别已停止')
      this.emit('onStop', { message: '手势识别已停止' })
      
    } catch (error) {
      console.error('❌ GestureManager: 停止时出错:', error)
    }
  }

  /**
   * 处理启动错误
   */
  handleStartError(error) {
    let errorMessage = '摄像头访问失败'
    
    switch (error.name) {
      case 'NotAllowedError':
        errorMessage = '摄像头权限被拒绝，请允许访问摄像头后重试'
        break
      case 'NotFoundError':
        errorMessage = '未找到摄像头设备，请确保摄像头已连接'
        break
      case 'NotReadableError':
        errorMessage = '摄像头被其他应用占用'
        break
      case 'SecurityError':
        errorMessage = '安全错误：请确保在 HTTPS 环境下使用'
        break
    }
    
    this.emit('onError', { error: error.name, message: errorMessage })
  }

  /**
   * 处理识别结果 - 采用main.js中经过验证的逻辑
   */
  processResults(results) {
    if (!results || !results.multiHandLandmarks) return

    try {
      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0]
        
        // 记录手部中心位置用于滑动检测
        const handCenter = this.getHandCenter(landmarks)
        this.recordHandPosition(handCenter)
        
        // 优先检测静态手势（避免与滑动冲突）
        const staticGesture = this.recognizeStaticGesture(landmarks)
        if (staticGesture) {
          this.executeGestureCommand(staticGesture)
          // 检测到静态手势后清空位置历史，避免误判滑动
          this.handPositionHistory = []
          return
        }
        
        // 只有在没有静态手势时才检测滑动
        const swipeGesture = this.detectSwipeGesture()
        if (swipeGesture) {
          this.executeGestureCommand(swipeGesture)
        }
      } else {
        // 没有检测到手势时清空位置历史
        this.handPositionHistory = []
      }

    } catch (error) {
      console.error('❌ GestureManager: 处理识别结果时出错:', error)
    }
  }

  /**
   * 计算手部中心点 - 使用手腕和中指根部的中点
   */
  getHandCenter(landmarks) {
    const wrist = landmarks[0]
    const middleMcp = landmarks[9]
    return {
      x: (wrist.x + middleMcp.x) / 2,
      y: (wrist.y + middleMcp.y) / 2
    }
  }

  /**
   * 记录手部位置历史
   */
  recordHandPosition(position) {
    const now = Date.now()
    
    // 过滤掉太频繁的记录，提高性能
    if (this.handPositionHistory.length > 0) {
      const lastRecord = this.handPositionHistory[this.handPositionHistory.length - 1]
      if (now - lastRecord.timestamp < 50) { // 至少间隔50ms
        return
      }
    }
    
    this.handPositionHistory.push({
      ...position,
      timestamp: now
    })
    
    // 保持历史记录在合理长度
    if (this.handPositionHistory.length > this.HISTORY_LENGTH) {
      this.handPositionHistory.shift()
    }
    
    // 清理过旧的记录（超过1秒）
    const cutoffTime = now - 1000
    this.handPositionHistory = this.handPositionHistory.filter(record => record.timestamp > cutoffTime)
  }

  /**
   * 识别静态手势 - 采用main.js中的精确算法
   */
  recognizeStaticGesture(landmarks) {
    const now = Date.now()
    if (now - this.lastGestureTime < this.GESTURE_COOLDOWN) {
      return null // 冷却期内不识别手势
    }
    
    // 获取关键点
    const thumbTip = landmarks[4]
    const thumbIp = landmarks[3]
    const indexTip = landmarks[8]
    const indexMcp = landmarks[5]
    const middleTip = landmarks[12]
    const middleMcp = landmarks[9]
    const ringTip = landmarks[16]
    const ringMcp = landmarks[13]
    const pinkyTip = landmarks[20]
    const pinkyMcp = landmarks[17]
    
    // 计算手指是否伸直
    const isThumbUp = thumbTip.y < thumbIp.y
    const isIndexUp = indexTip.y < indexMcp.y
    const isMiddleUp = middleTip.y < middleMcp.y
    const isRingUp = ringTip.y < ringMcp.y
    const isPinkyUp = pinkyTip.y < pinkyMcp.y
    
    // 五指张开 - 放大
    if (isThumbUp && isIndexUp && isMiddleUp && isRingUp && isPinkyUp) {
      return 'zoom_in'
    }
    
    // OK手势 (拇指+食指形成圆圈) - 缩小
    const thumbIndexDistance = Math.sqrt(
      Math.pow(thumbTip.x - indexTip.x, 2) + 
      Math.pow(thumbTip.y - indexTip.y, 2)
    )
    if (thumbIndexDistance < 0.05 && isMiddleUp && isRingUp && isPinkyUp) {
      return 'zoom_out'
    }
    
    return null
  }

  /**
   * 检测滑动手势 - 增加更严格的检测条件，防止误触发
   */
  detectSwipeGesture() {
    if (this.handPositionHistory.length < 5) { // 增加最小历史记录要求
      return null
    }
    
    const recent = this.handPositionHistory.slice(-6) // 使用更多历史点确保准确性
    const first = recent[0]
    const last = recent[recent.length - 1]
    
    const deltaX = last.x - first.x
    const deltaY = last.y - first.y
    const deltaTime = last.timestamp - first.timestamp
    
    // 更严格的时间要求，确保是真正的滑动动作
    if (deltaTime < 300 || deltaTime > 1000) {
      return null
    }
    
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    if (distance < this.SWIPE_THRESHOLD * 1.5) { // 提高距离阈值
      return null
    }
    
    // 检查滑动速度，太慢的不算滑动
    const speed = distance / (deltaTime / 1000) // 像素/秒
    if (speed < 0.08) { // 提高最小滑动速度要求
      return null
    }
    
    // 确保滑动轨迹的一致性
    const midPoint = recent[Math.floor(recent.length / 2)]
    const firstHalfDeltaX = midPoint.x - first.x
    const firstHalfDeltaY = midPoint.y - first.y
    const secondHalfDeltaX = last.x - midPoint.x
    const secondHalfDeltaY = last.y - midPoint.y
    
    // 检查方向一致性
    const horizontalConsistent = (firstHalfDeltaX * secondHalfDeltaX) > 0
    const verticalConsistent = (firstHalfDeltaY * secondHalfDeltaY) > 0
    
    const absX = Math.abs(deltaX)
    const absY = Math.abs(deltaY)
    
    if (absX > absY * 0.8) { // 水平滑动
      if (horizontalConsistent && absX > 0.04) {
        return deltaX > 0 ? 'swipe_right' : 'swipe_left'
      }
    } else if (absY > absX * 0.8) { // 垂直滑动
      if (verticalConsistent && absY > 0.04) {
        return deltaY > 0 ? 'swipe_down' : 'swipe_up'
      }
    }
    
    return null
  }

  /**
   * 执行手势命令 - 采用main.js中的执行逻辑
   */
  executeGestureCommand(gesture) {
    const now = Date.now()
    
    // 对滑动手势使用更长的冷却时间，防止地图飞太快
    const cooldown = gesture.includes('swipe') ? this.SWIPE_COOLDOWN : this.GESTURE_COOLDOWN
    
    if (now - this.lastGestureTime < cooldown) {
      console.log(`⏭️ GestureManager: 跳过手势 ${gesture} (冷却中，间隔: ${cooldown}ms)`)
      return
    }
    
    this.lastGestureTime = now
    
    console.log(`🤚 GestureManager: 检测到手势: ${gesture}`)
    
    // 创建手势事件数据
    const gestureData = {
      name: gesture,
      gesture: gesture,
      confidence: 0.8,
      intensity: 1,
      description: this.getGestureDescription(gesture),
      timestamp: Date.now()
    }
    
    // 触发手势事件
    this.emit('onGesture', gestureData)
    
    // 滑动后立即清空历史，避免连续触发
    if (gesture.includes('swipe')) {
      this.handPositionHistory = []
    }
    
    // 重置最后手势
    setTimeout(() => {
      if (this.lastGesture === gesture) {
        this.lastGesture = null
      }
    }, 1000)
  }

  /**
   * 获取手势描述 - 更新为符合main.js逻辑的描述
   */
  getGestureDescription(gestureType) {
    const descriptions = {
      zoom_in: '五指张开 - 放大地图',
      zoom_out: 'OK手势 - 缩小地图', 
      swipe_up: '向上滑动 - 地图向北移动',
      swipe_down: '向下滑动 - 地图向南移动',
      swipe_left: '向左滑动 - 地图向西移动',
      swipe_right: '向右滑动 - 地图向东移动',
      fist: '拳头 - 停止操作',
      point: '指向 - 选择位置',
      peace: 'V手势 - 切换地图样式',
      rock: '摇滚手势 - 切换3D模式',
      voice_on: '三指手势 - 打开语音识别'
    }
    return descriptions[gestureType] || '未知手势'
  }

  /**
   * 模拟手势
   */
  simulateGesture(gestureType) {
    const gesture = {
      type: gestureType,
      confidence: 0.9,
      description: this.getGestureDescription(gestureType)
    }
    this.handleDetectedGesture(gesture)
  }

  /**
   * 获取支持的手势列表 - 更新为符合main.js逻辑
   */
  getSupportedGestures() {
    return [
      { name: 'zoom_in', description: '五指张开 - 放大地图' },
      { name: 'zoom_out', description: 'OK手势 - 缩小地图' },
      { name: 'swipe_up', description: '向上滑动 - 地图向北移动' },
      { name: 'swipe_down', description: '向下滑动 - 地图向南移动' },
      { name: 'swipe_left', description: '向左滑动 - 地图向西移动' },
      { name: 'swipe_right', description: '向右滑动 - 地图向东移动' }
    ]
  }

  /**
   * 事件管理
   */
  on(eventName, callback) {
    if (this.callbacks[eventName]) {
      this.callbacks[eventName].push(callback)
    }
  }

  off(eventName, callback) {
    if (this.callbacks[eventName]) {
      this.callbacks[eventName] = this.callbacks[eventName].filter(cb => cb !== callback)
    }
  }

  emit(eventName, data) {
    if (this.callbacks[eventName]) {
      this.callbacks[eventName].forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`❌ GestureManager: 事件回调错误 (${eventName}):`, error)
        }
      })
    }
  }

  /**
   * 获取当前状态
   */
  getStatus() {
    return {
      isSupported: this.isSupported,
      isInitialized: this.isInitialized,
      isRunning: this.isRunning,
      lastGesture: this.lastGesture,
      supportedGestures: this.getSupportedGestures()
    }
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig }
    
    if (this.hands) {
      this.hands.setOptions(this.config)
    }
    
    console.log('🔧 GestureManager: 配置已更新:', this.config)
  }
}

export default GestureManager
