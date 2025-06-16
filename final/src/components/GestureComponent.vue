<template>
  <div class="gesture-control">


    <!-- 主控制按钮 -->
    <div class="gesture-main-control">
      <button
        :class="['gesture-btn', { 
          'active': isRunning, 
          'disabled': !isSupported || isProcessing 
        }]"
        @click="toggleGestureRecognition"
        :disabled="!isSupported || isProcessing"
      >
        <div class="gesture-btn-content">
          <div class="gesture-icon">
            <span v-if="!isRunning">🤚</span>
            <span v-else class="pulse">✋</span>
          </div>
          <div class="gesture-text">
            <div class="gesture-status">
              {{ getStatusText() }}
            </div>
            <div class="gesture-hint">
              {{ getHintText() }}
            </div>
          </div>
        </div>
      </button>
    </div>

    <!-- 摄像头预览区域 -->
    <div v-if="isRunning" class="camera-preview">
      <div class="preview-container">
        <video 
          ref="videoElement" 
          autoplay 
          muted 
          playsinline
          class="camera-video"
        ></video>
        <canvas 
          ref="canvasElement" 
          class="gesture-canvas"
        ></canvas>
        <div class="camera-overlay">
          <div class="detection-zone">
            <span class="zone-label">手势识别区域</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 当前手势显示 -->
    <div v-if="currentGesture" class="current-gesture">
      <div class="gesture-display">
        <div class="gesture-info">
          <span class="gesture-emoji">{{ getGestureEmoji(currentGesture.name) }}</span>
          <div class="gesture-details">
            <div class="gesture-name">{{ getGestureName(currentGesture.name) }}</div>
            <div class="gesture-description">{{ getGestureDescription(currentGesture.name) }}</div>
            <div class="gesture-confidence">
              置信度: {{ (currentGesture.confidence * 100).toFixed(0) }}%
            </div>
          </div>
        </div>
        <div class="gesture-timer">
          <div class="timer-bar" :style="{ width: gestureProgress + '%' }"></div>
        </div>
      </div>
    </div>

    <!-- 手势反馈 -->
    <div v-if="lastResult" class="gesture-feedback">
      <div :class="['feedback-message', lastResult.success ? 'success' : 'error']">
        <span class="feedback-icon">
          {{ lastResult.success ? '✅' : '❌' }}
        </span>
        <span class="feedback-text">{{ lastResult.message }}</span>
      </div>
      <div v-if="lastResult.continuous" class="continuous-indicator">
        <span class="continuous-icon">🔄</span>
        <span class="continuous-text">
          连续手势 {{ lastResult.multiplier?.toFixed(1) }}x
        </span>
      </div>
      <div v-if="!lastResult.success && lastResult.suggestions" class="suggestions">
        <div class="suggestions-title">💡 手势建议：</div>
        <div class="suggestions-list">
          <div 
            v-for="(suggestion, index) in lastResult.suggestions.slice(0, 3)" 
            :key="index"
            class="suggestion-item"
          >
            {{ suggestion }}
          </div>
        </div>
      </div>
    </div>


    <!-- 错误显示 -->
    <div v-if="error" class="gesture-error">
      <div class="error-message">
        <span class="error-icon">⚠️</span>
        <span class="error-text">{{ error }}</span>
      </div>
      
      <!-- Chrome摄像头权限指导 -->
      <div v-if="error.includes('摄像头')" class="camera-help">
        <div class="help-title">📸 Chrome摄像头权限设置</div>
        <div class="help-steps">
          <div class="help-step">1. 点击地址栏左侧的 🔒 或 📷 图标</div>
          <div class="help-step">2. 将"摄像头"设置为"允许"</div>
          <div class="help-step">3. 刷新页面重试</div>
        </div>
        <div class="help-note">
          💡 或者在Chrome设置 → 隐私和安全 → 网站设置 → 摄像头中允许此网站访问
        </div>
      </div>
      
      <!-- HTTPS提醒 -->
      <div v-if="error.includes('HTTPS') || error.includes('安全')" class="https-help">
        <div class="help-title">🔐 安全连接要求</div>
        <div class="help-info">
          摄像头功能需要HTTPS连接或本地环境。当前环境：{{ location.protocol }}//{{ location.hostname }}
        </div>
        <div class="help-suggestion">
          建议使用 localhost 或部署到 HTTPS 网站
        </div>
      </div>
      
      <button class="retry-btn" @click="retryGestureSetup">
        🔄 重试手势识别
      </button>
    </div>

  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { GestureManager } from '../services/GestureManager.js'
import { GestureCommandProcessor } from '../services/GestureCommandProcessor.js'

export default {
  name: 'GestureComponent',
  props: {
    mapManager: {
      type: Object,
      default: null
    }
  },
  emits: ['gesture-result', 'gesture-error'],
  setup(props, { emit }) {
    // 核心状态
    const gestureManager = ref(null)
    const commandProcessor = ref(null)
    const isSupported = ref(false)
    const isRunning = ref(false)
    const isProcessing = ref(false)
    const error = ref('')

    // 手势识别结果
    const currentGesture = ref(null)
    const lastResult = ref(null)
    const gestureProgress = ref(0)

    // UI状态
    const showSettings = ref(false)
    const showHelp = ref(false)

    // 设置项
    const sensitivity = ref(0.8)
    const gestureDelay = ref(1000)
    const showLandmarks = ref(false)

    // 视频元素
    const videoElement = ref(null)
    const canvasElement = ref(null)
    
    // 当前环境信息
    const location = window.location

    // 快捷手势
    const shortcuts = ref([
      { emoji: '✊', text: '停止', gesture: 'fist' },
      { emoji: '🖐️', text: '放大地图', gesture: 'zoom_in' },
      { emoji: '👌', text: '缩小地图', gesture: 'zoom_out' },
      { emoji: '👆', text: '选择位置', gesture: 'point' },
      { emoji: '✌️', text: '切换样式', gesture: 'peace' },
      { emoji: '🤟', text: '3D模式', gesture: 'rock' },
      { emoji: '🎤', text: '语音识别', gesture: 'voice_on' },
      { emoji: '👈', text: '向左移动', gesture: 'swipe_left' },
      { emoji: '👉', text: '向右移动', gesture: 'swipe_right' },
      { emoji: '👆', text: '向上移动', gesture: 'swipe_up' },
      { emoji: '👇', text: '向下移动', gesture: 'swipe_down' }
    ])

    /**
     * 初始化手势服务
     */
    const initializeGestureServices = async () => {
      try {
        console.log('🔧 GestureComponent: 开始初始化手势服务...')
        
        // 初始化手势管理器
        gestureManager.value = new GestureManager()
        
        // 立即检查支持状态（现在在构造函数中已设置）
        isSupported.value = gestureManager.value.isSupported
        console.log('📊 GestureComponent: 手势识别支持状态:', isSupported.value)

        if (!isSupported.value) {
          error.value = '您的浏览器不支持手势识别功能或无法访问摄像头'
          console.warn('⚠️ GestureComponent: 手势识别不受支持')
          return
        }

        // 初始化命令处理器
        if (props.mapManager) {
          commandProcessor.value = new GestureCommandProcessor(props.mapManager)
          console.log('✅ GestureComponent: 命令处理器已初始化')
        }

        // 绑定事件监听器
        setupGestureEventListeners()

        console.log('✅ GestureComponent: 手势服务初始化完成')
        
      } catch (err) {
        console.error('❌ GestureComponent: 手势服务初始化失败:', err)
        error.value = `手势服务初始化失败: ${err.message}`
      }
    }

    /**
     * 设置手势事件监听器
     */
    const setupGestureEventListeners = () => {
      if (!gestureManager.value) return

      // 手势识别开始
      gestureManager.value.on('onStart', () => {
        isRunning.value = true
        error.value = ''
        console.log('🎥 GestureComponent: 手势识别已开始')
        setupVideoStream()
      })

      // 手势识别结果
      gestureManager.value.on('onGesture', async (gesture) => {
        console.log('🤚 GestureComponent: 检测到手势:', gesture)
        
        currentGesture.value = gesture
        startGestureProgress()
        
        // 处理手势命令
        await processGestureCommand(gesture)
      })

      // 手势识别停止
      gestureManager.value.on('onStop', () => {
        isRunning.value = false
        isProcessing.value = false
        currentGesture.value = null
        console.log('🛑 GestureComponent: 手势识别已停止')
        cleanupVideoStream()
      })

      // 手势识别错误
      gestureManager.value.on('onError', (errorData) => {
        isRunning.value = false
        isProcessing.value = false
        error.value = errorData.error || '手势识别发生错误'
        console.error('❌ GestureComponent: 手势识别错误:', errorData)
        emit('gesture-error', errorData)
      })
    }

    /**
     * 设置视频流
     */
    const setupVideoStream = async () => {
      if (!videoElement.value) {
        await nextTick()
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 640, height: 480 }
        })
        
        if (videoElement.value) {
          videoElement.value.srcObject = stream
        }
      } catch (err) {
        console.error('❌ GestureComponent: 摄像头设置失败:', err)
        error.value = '无法访问摄像头'
      }
    }

    /**
     * 清理视频流
     */
    const cleanupVideoStream = () => {
      if (videoElement.value && videoElement.value.srcObject) {
        const stream = videoElement.value.srcObject
        stream.getTracks().forEach(track => track.stop())
        videoElement.value.srcObject = null
      }
    }

    /**
     * 开始手势进度动画
     */
    const startGestureProgress = () => {
      gestureProgress.value = 0
      const interval = setInterval(() => {
        gestureProgress.value += 10
        if (gestureProgress.value >= 100) {
          clearInterval(interval)
          setTimeout(() => {
            gestureProgress.value = 0
          }, 500)
        }
      }, gestureDelay.value / 10)
    }

    /**
     * 处理手势命令
     */
    const processGestureCommand = async (gesture) => {
      if (!commandProcessor.value || !gesture) {
        return
      }

      try {
        isProcessing.value = true
        console.log('🔄 GestureComponent: 处理手势命令:', gesture.name)

        const result = await commandProcessor.value.processGesture(gesture)
        
        lastResult.value = result
        
        // 自动清除结果显示
        setTimeout(() => {
          lastResult.value = null
        }, 4000)

        // 发送结果给父组件
        emit('gesture-result', { gesture, result })

        console.log('✅ GestureComponent: 手势命令处理完成:', result)
      } catch (err) {
        console.error('❌ GestureComponent: 手势命令处理失败:', err)
        lastResult.value = {
          success: false,
          message: `手势命令处理失败: ${err.message}`
        }
      } finally {
        isProcessing.value = false
      }
    }

    /**
     * 切换手势识别状态
     */
    const toggleGestureRecognition = async () => {
      if (!gestureManager.value || !isSupported.value) return

      try {
        if (isRunning.value) {
          // 停止手势识别
          gestureManager.value.stop()
        } else {
          // 开始手势识别
          await gestureManager.value.start()
        }
      } catch (err) {
        console.error('❌ GestureComponent: 切换手势识别失败:', err)
        error.value = err.message
      }
    }

    /**
     * 启动手势识别 (供外部调用)
     */
    const startGesture = async () => {
      if (!gestureManager.value || !isSupported.value || isRunning.value) return

      try {
        console.log('🤚 GestureComponent: 外部启动手势识别')
        await gestureManager.value.start()
      } catch (err) {
        console.error('❌ GestureComponent: 启动手势识别失败:', err)
        error.value = err.message
      }
    }

    /**
     * 停止手势识别 (供外部调用)
     */
    const stopGesture = () => {
      if (!gestureManager.value || !isRunning.value) return

      try {
        console.log('🛑 GestureComponent: 外部停止手势识别')
        gestureManager.value.stop()
      } catch (err) {
        console.error('❌ GestureComponent: 停止手势识别失败:', err)
      }
    }

    /**
     * 模拟手势
     */
    const simulateGesture = async (gestureName) => {
      if (!commandProcessor.value || isProcessing.value) return

      try {
        const simulatedGesture = {
          name: gestureName,
          confidence: 1.0,
          timestamp: Date.now()
        }
        
        currentGesture.value = simulatedGesture
        await processGestureCommand(simulatedGesture)
        
        setTimeout(() => {
          currentGesture.value = null
        }, 2000)
      } catch (err) {
        console.error('❌ GestureComponent: 模拟手势失败:', err)
      }
    }

    /**
     * 重试手势设置
     */
    const retryGestureSetup = () => {
      error.value = ''
      initializeGestureServices()
    }

    /**
     * 更新敏感度
     */
    const updateSensitivity = () => {
      if (gestureManager.value) {
        gestureManager.value.config.minDetectionConfidence = sensitivity.value
        gestureManager.value.config.minTrackingConfidence = sensitivity.value
      }
    }

    /**
     * 更新手势延迟
     */
    const updateGestureDelay = () => {
      console.log('⚙️ GestureComponent: 手势延迟更新为:', gestureDelay.value + 'ms')
    }

    /**
     * 更新显示关键点设置
     */
    const updateShowLandmarks = () => {
      console.log('⚙️ GestureComponent: 关键点显示:', showLandmarks.value)
    }

    /**
     * 获取状态文本
     */
    const getStatusText = () => {
      if (!isSupported.value) return '不支持手势识别'
      if (isProcessing.value) return '处理中...'
      if (isRunning.value) return '手势识别中...'
      return '点击开始手势识别'
    }

    /**
     * 获取提示文本
     */
    const getHintText = () => {
      if (!isSupported.value) return '请使用支持摄像头的设备'
      if (isRunning.value) return '将手放在摄像头前做手势'
      return '支持握拳、指向、滑动等手势'
    }

    /**
     * 获取手势表情符号
     */
    const getGestureEmoji = (gestureName) => {
      const emojiMap = {
        'fist': '✊',
        'open_palm': '✋',
        'point': '👆',
        'ok': '👌',
        'victory': '✌️',
        'swipe_left': '👈',
        'swipe_right': '👉',
        'swipe_up': '👆',
        'swipe_down': '👇',
        'zoom_in': '🔍',
        'zoom_out': '🔍'
      }
      return emojiMap[gestureName] || '🤚'
    }

    /**
     * 获取手势名称
     */
    const getGestureName = (gestureName) => {
      const nameMap = {
        'fist': '握拳',
        'open_palm': '张开手掌',
        'point': '指向',
        'ok': 'OK手势',
        'victory': 'V手势',
        'swipe_left': '向左滑动',
        'swipe_right': '向右滑动',
        'swipe_up': '向上滑动',
        'swipe_down': '向下滑动',
        'zoom_in': '放大手势',
        'zoom_out': '缩小手势'
      }
      return nameMap[gestureName] || gestureName
    }

    /**
     * 获取手势描述
     */
    const getGestureDescription = (gestureName) => {
      if (commandProcessor.value) {
        return commandProcessor.value.getGestureDescription(gestureName)
      }
      return '执行地图操作'
    }

    // 监听mapManager变化
    watch(() => props.mapManager, (newMapManager) => {
      if (newMapManager && !commandProcessor.value) {
        commandProcessor.value = new GestureCommandProcessor(newMapManager)
        console.log('✅ GestureComponent: CommandProcessor已更新')
      }
    }, { immediate: true })

    // 组件生命周期
    onMounted(() => {
      initializeGestureServices()
    })

    onUnmounted(() => {
      if (gestureManager.value) {
        gestureManager.value.destroy()
      }
      if (commandProcessor.value) {
        commandProcessor.value.destroy()
      }
      cleanupVideoStream()
    })

    return {
      // 状态
      isSupported,
      isRunning,
      isProcessing,
      error,
      
      // 手势结果
      currentGesture,
      lastResult,
      gestureProgress,
      
      // UI状态
      showSettings,
      showHelp,
      shortcuts,
      
      // 设置项
      sensitivity,
      gestureDelay,
      showLandmarks,
      
      // 视频元素
      videoElement,
      canvasElement,
      
      // 环境信息
      location,
      
      // 方法
      toggleGestureRecognition,
      startGesture,
      stopGesture,
      simulateGesture,
      retryGestureSetup,
      updateSensitivity,
      updateGestureDelay,
      updateShowLandmarks,
      getStatusText,
      getHintText,
      getGestureEmoji,
      getGestureName,
      getGestureDescription
    }
  }
}
</script>

<style scoped>
.gesture-control {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 系统状态概览 */
.system-status {
  background: #e7f3ff;
  border-radius: 8px;
  padding: 12px;
  border: 1px solid #b3d9ff;
}

.status-title {
  font-size: 14px;
  font-weight: 600;
  color: #0066cc;
  margin-bottom: 8px;
}

.status-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
}

.status-item.active {
  border-color: #6c5ce7;
  background: #f8f9fa;
}

.status-icon {
  font-size: 18px;
  color: #6c5ce7;
}

.status-text {
  font-size: 14px;
  color: #333;
  flex: 1;
}

.status-indicator {
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
  display: inline-block;
}

.status-indicator.ready {
  background: #d4edda;
  color: #155724;
}

.status-indicator.error {
  background: #f8d7da;
  color: #721c24;
}

.status-indicator.waiting {
  background: #fff3cd;
  color: #856404;
}

/* 主控制按钮 */
.gesture-main-control {
  display: flex;
  justify-content: center;
}

.gesture-btn {
  width: 100%;
  padding: 16px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.gesture-btn:hover:not(.disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.gesture-btn.active {
  background: linear-gradient(135deg, #00b894 0%, #55efc4 100%);
  animation: pulse 2s infinite;
}

.gesture-btn.disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.gesture-btn-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.gesture-icon {
  font-size: 24px;
  min-width: 32px;
}

.gesture-text {
  text-align: left;
  flex: 1;
  background: transparent;
}

.gesture-status {
  font-weight: 600;
  font-size: 16px;
  margin-bottom: 4px;
  background: transparent;
}

.gesture-hint {
  font-size: 12px;
  opacity: 0.9;
  background: transparent;
}

/* 摄像头预览 */
.camera-preview {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 12px;
  border: 2px solid #e9ecef;
}

.preview-container {
  position: relative;
  width: 100%;
  height: 200px;
  border-radius: 8px;
  overflow: hidden;
  background: #000;
}

.camera-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.gesture-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.camera-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.detection-zone {
  border: 2px dashed rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.5);
}

.zone-label {
  color: white;
  font-size: 12px;
  font-weight: 500;
}

/* 当前手势显示 */
.current-gesture {
  background: #e8f4f8;
  border-radius: 8px;
  padding: 12px;
  border-left: 4px solid #17a2b8;
}

.gesture-display {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.gesture-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.gesture-emoji {
  font-size: 24px;
}

.gesture-details {
  flex: 1;
}

.gesture-name {
  font-weight: 600;
  font-size: 14px;
  color: #333;
}

.gesture-description {
  font-size: 12px;
  color: #666;
  margin: 2px 0;
}

.gesture-confidence {
  font-size: 11px;
  color: #17a2b8;
}

.gesture-timer {
  height: 3px;
  background: #dee2e6;
  border-radius: 2px;
  overflow: hidden;
}

.timer-bar {
  height: 100%;
  background: linear-gradient(90deg, #17a2b8, #20c997);
  transition: width 0.1s ease;
}

/* 手势反馈 */
.gesture-feedback {
  background: white;
  border-radius: 8px;
  padding: 12px;
  border: 1px solid #eee;
}

.feedback-message {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.feedback-message.success {
  color: #28a745;
}

.feedback-message.error {
  color: #dc3545;
}

.continuous-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #17a2b8;
  margin-bottom: 8px;
}

.continuous-icon {
  animation: spin 1s linear infinite;
}

.suggestions {
  border-top: 1px solid #eee;
  padding-top: 8px;
  margin-top: 8px;
}

.suggestions-title {
  font-size: 12px;
  font-weight: 600;
  color: #666;
  margin-bottom: 6px;
}

.suggestions-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.suggestion-item {
  font-size: 12px;
  color: #0066cc;
  background: #e7f3ff;
  padding: 4px 8px;
  border-radius: 4px;
}

/* 快捷手势 */
.gesture-shortcuts {
  background: white;
  border-radius: 8px;
  padding: 12px;
  border: 1px solid #eee;
}

.shortcuts-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.shortcuts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;
}

.shortcut-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 11px;
}

.shortcut-btn:hover:not(:disabled) {
  background: #f8f9fa;
  border-color: #6c5ce7;
  transform: translateY(-1px);
}

.shortcut-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.shortcut-emoji {
  font-size: 16px;
}

.shortcut-text {
  font-weight: 500;
}

/* 设置面板 */
.gesture-settings {
  background: white;
  border-radius: 8px;
  border: 1px solid #eee;
  overflow: hidden;
}

.settings-toggle {
  width: 100%;
  padding: 12px;
  border: none;
  background: #f8f9fa;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  text-align: left;
  transition: background 0.2s ease;
}

.settings-toggle:hover {
  background: #e9ecef;
}

.settings-content {
  padding: 16px;
  background: white;
}

.setting-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.setting-item:last-child {
  margin-bottom: 0;
}

.setting-item label {
  font-size: 13px;
  font-weight: 500;
  color: #333;
  min-width: 80px;
}

.setting-item input[type="range"] {
  flex: 1;
}

.setting-item input[type="checkbox"] {
  margin: 0;
}

.setting-value {
  font-size: 12px;
  color: #666;
  min-width: 40px;
  text-align: right;
}

/* 错误显示 */
.gesture-error {
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 8px;
  padding: 12px;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #856404;
  margin-bottom: 8px;
}

.retry-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  background: #ffc107;
  color: #856404;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  transition: background 0.2s ease;
}

.retry-btn:hover {
  background: #e0a800;
}

/* 摄像头权限帮助 */
.camera-help {
  margin-top: 12px;
  padding: 12px;
  background: #e7f3ff;
  border: 1px solid #b3d9ff;
  border-radius: 6px;
}

.help-title {
  font-size: 14px;
  font-weight: 600;
  color: #0066cc;
  margin-bottom: 8px;
}

.help-steps {
  margin-bottom: 8px;
}

.help-step {
  font-size: 12px;
  color: #333;
  margin-bottom: 4px;
  padding-left: 8px;
}

.help-note {
  font-size: 11px;
  color: #666;
  font-style: italic;
  background: #f0f8ff;
  padding: 6px 8px;
  border-radius: 4px;
  border-left: 3px solid #0066cc;
}

/* HTTPS帮助 */
.https-help {
  margin-top: 12px;
  padding: 12px;
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 6px;
}

.help-info {
  font-size: 12px;
  color: #856404;
  margin-bottom: 8px;
}

.help-suggestion {
  font-size: 12px;
  color: #856404;
  font-weight: 500;
  background: #fef7e0;
  padding: 6px 8px;
  border-radius: 4px;
  border-left: 3px solid #ffc107;
}

/* 帮助信息 */
.gesture-help {
  background: white;
  border-radius: 8px;
  border: 1px solid #eee;
  overflow: hidden;
}

.help-toggle {
  width: 100%;
  padding: 12px;
  border: none;
  background: #f8f9fa;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  text-align: left;
  transition: background 0.2s ease;
}

.help-toggle:hover {
  background: #e9ecef;
}

.help-content {
  padding: 16px;
  background: white;
}

.help-section {
  margin-bottom: 16px;
}

.help-section:last-child {
  margin-bottom: 0;
}

.help-section h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #333;
}

.help-section p {
  margin: 0;
  font-size: 13px;
  color: #666;
  line-height: 1.4;
}

.help-gestures {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.help-gesture {
  font-size: 12px;
  color: #333;
  padding: 4px 8px;
  background: #f8f9fa;
  border-radius: 4px;
  border-left: 3px solid #6c5ce7;
}

.help-tips {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.help-tip {
  font-size: 12px;
  color: #333;
  padding: 4px 8px;
  background: #f0f8ff;
  border-radius: 4px;
  border-left: 3px solid #0066cc;
}

/* 动画效果 */
@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.pulse {
  animation: pulse 1s infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .shortcuts-grid {
    grid-template-columns: 1fr 1fr;
  }
  
  .gesture-btn-content {
    flex-direction: column;
    text-align: center;
    gap: 8px;
  }
  
  .gesture-text {
    text-align: center;
  }
  
  .camera-preview .preview-container {
    height: 150px;
  }
}
</style>
