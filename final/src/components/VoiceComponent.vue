<template>
  <div class="voice-control">
    <!-- 标题和帮助按钮 -->
    <div class="voice-header">
      <h3 class="voice-title">语音控制</h3>
      <button class="help-btn" @click="showHelp = !showHelp" title="使用帮助">
        <span>❓</span>
      </button>
    </div>

    <!-- 帮助信息（展开时显示） -->
    <div v-if="showHelp" class="help-content">
      <div class="help-section">
        <h4>🎯 缩放控制</h4>
        <p>说 "放大"、"缩小"、"拉近"、"拉远"</p>
      </div>
      <div class="help-section">
        <h4>🧭 移动地图</h4>
        <p>说 "向上"、"向下"、"向左"、"向右" 或 "往北"、"往南"、"往东"、"往西"</p>
      </div>
      <div class="help-section">
        <h4>🔍 搜索地点</h4>
        <p>说 "搜索北京"、"查找上海"、"去广州"</p>
      </div>
      <div class="help-section">
        <h4>📍 定位功能</h4>
        <p>说 "定位"、"我的位置"、"当前位置"</p>
      </div>
      <div class="help-section">
        <h4>🔄 重置操作</h4>
        <p>说 "重置"、"回到原点"、"清除"</p>
      </div>
    </div>

    <!-- 主控制按钮 -->
    <div class="voice-main-control">
      <button
        :class="['voice-btn', { 
          'recording': isListening, 
          'disabled': !isSupported || isProcessing 
        }]"
        @click="toggleVoiceRecognition"
        :disabled="!isSupported || isProcessing"
      >
        <div class="voice-btn-content">
          <div class="voice-icon">
            <span v-if="!isListening">🎤</span>
            <span v-else class="pulse">🎙️</span>
          </div>
          <div class="voice-text">
            <div class="voice-status">
              {{ getStatusText() }}
            </div>
            <div class="voice-hint">
              {{ getHintText() }}
            </div>
          </div>
        </div>
      </button>
    </div>

    <!-- 语音识别实时显示 -->
    <div v-if="isListening || recentTranscript" class="voice-display">
      <div class="voice-transcript">
        <div class="transcript-label">
          <span>{{ isListening ? '🎙️ 正在听...' : '📝 最近识别' }}</span>
        </div>
        <div class="transcript-content">
          <span v-if="interimTranscript" class="interim">{{ interimTranscript }}</span>
          <span v-if="finalTranscript" class="final">{{ finalTranscript }}</span>
          <span v-if="!interimTranscript && !finalTranscript && recentTranscript" class="recent">
            {{ recentTranscript }}
          </span>
        </div>
      </div>
    </div>

    <!-- 命令反馈 -->
    <div v-if="lastResult" class="voice-feedback">
      <div :class="['feedback-message', lastResult.success ? 'success' : 'error']">
        <span class="feedback-icon">
          {{ lastResult.success ? '✅' : '❌' }}
        </span>
        <span class="feedback-text">{{ lastResult.message }}</span>
      </div>
      <div v-if="!lastResult.success && lastResult.suggestions" class="suggestions">
        <div class="suggestions-title">💡 建议试试：</div>
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
    <div v-if="error" class="voice-error">
      <div class="error-message">
        <span class="error-icon">⚠️</span>
        <span class="error-text">{{ error }}</span>
      </div>
      <button class="retry-btn" @click="retryVoiceSetup">
        🔄 重试
      </button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { VoiceManager } from '../services/VoiceManager.js'
import { VoiceCommandProcessor } from '../services/VoiceCommandProcessor.js'

export default {
  name: 'VoiceComponent',
  props: {
    mapManager: {
      type: Object,
      default: null
    }
  },
  emits: ['voice-result', 'voice-error'],
  setup(props, { emit }) {
    // 核心状态
    const voiceManager = ref(null)
    const commandProcessor = ref(null)
    const isSupported = ref(false)
    const isListening = ref(false)
    const isProcessing = ref(false)
    const error = ref('')

    // 语音识别结果
    const finalTranscript = ref('')
    const interimTranscript = ref('')
    const recentTranscript = ref('')
    const lastResult = ref(null)

    // UI状态
    const showHelp = ref(false)

    /**
     * 初始化语音服务
     */
    const initializeVoiceServices = () => {
      try {
        // 初始化语音管理器
        voiceManager.value = new VoiceManager()
        isSupported.value = voiceManager.value.isRecognitionSupported()

        if (!isSupported.value) {
          error.value = '您的浏览器不支持语音识别功能'
          return
        }

        // 初始化命令处理器
        if (props.mapManager) {
          commandProcessor.value = new VoiceCommandProcessor(props.mapManager)
        }

        // 绑定事件监听器
        setupVoiceEventListeners()

        console.log('✅ VoiceComponent: 语音服务初始化完成')
      } catch (err) {
        console.error('❌ VoiceComponent: 语音服务初始化失败:', err)
        error.value = `语音服务初始化失败: ${err.message}`
      }
    }

    /**
     * 设置语音事件监听器
     */
    const setupVoiceEventListeners = () => {
      if (!voiceManager.value) return

      // 语音识别开始
      voiceManager.value.on('onStart', () => {
        isListening.value = true
        finalTranscript.value = ''
        interimTranscript.value = ''
        error.value = ''
        console.log('🎤 VoiceComponent: 开始语音识别')
      })

      // 语音识别结果
      voiceManager.value.on('onResult', async (data) => {
        console.log('📝 VoiceComponent: 收到语音结果:', data)
        
        if (data.isFinal && data.finalTranscript) {
          finalTranscript.value = data.finalTranscript
          recentTranscript.value = data.finalTranscript
          interimTranscript.value = ''
          
          // 处理最终识别结果
          await processVoiceCommand(data.finalTranscript)
        } else if (data.interimTranscript) {
          interimTranscript.value = data.interimTranscript
        }
      })

      // 语音识别结束
      voiceManager.value.on('onEnd', () => {
        isListening.value = false
        isProcessing.value = false
        console.log('🔚 VoiceComponent: 语音识别结束')
      })

      // 语音识别错误
      voiceManager.value.on('onError', (errorData) => {
        isListening.value = false
        isProcessing.value = false
        error.value = errorData.message || '语音识别发生错误'
        console.error('❌ VoiceComponent: 语音识别错误:', errorData)
        emit('voice-error', errorData)
      })
    }

    /**
     * 处理语音命令
     */
    const processVoiceCommand = async (transcript) => {
      if (!commandProcessor.value || !transcript) {
        return
      }

      try {
        isProcessing.value = true
        console.log('🔄 VoiceComponent: 处理语音命令:', transcript)

        const result = await commandProcessor.value.processCommand(transcript)
        
        lastResult.value = result
        
        // 自动清除结果显示
        setTimeout(() => {
          lastResult.value = null
        }, 5000)

        // 发送结果给父组件
        emit('voice-result', { transcript, result })

        console.log('✅ VoiceComponent: 命令处理完成:', result)
      } catch (err) {
        console.error('❌ VoiceComponent: 命令处理失败:', err)
        lastResult.value = {
          success: false,
          message: `命令处理失败: ${err.message}`
        }
      } finally {
        isProcessing.value = false
      }
    }

    /**
     * 切换语音识别状态
     */
    const toggleVoiceRecognition = async () => {
      if (!voiceManager.value || !isSupported.value) return

      try {
        if (isListening.value) {
          // 停止语音识别
          voiceManager.value.stop()
        } else {
          // 开始语音识别
          await voiceManager.value.start()
        }
      } catch (err) {
        console.error('❌ VoiceComponent: 切换语音识别失败:', err)
        error.value = err.message
      }
    }

    /**
     * 启动语音识别 (供外部调用)
     */
    const startVoice = async () => {
      if (!voiceManager.value || !isSupported.value || isListening.value) return

      try {
        console.log('🎤 VoiceComponent: 外部启动语音识别')
        await voiceManager.value.start()
      } catch (err) {
        console.error('❌ VoiceComponent: 启动语音识别失败:', err)
        error.value = err.message
      }
    }

    /**
     * 停止语音识别 (供外部调用)
     */
    const stopVoice = () => {
      if (!voiceManager.value || !isListening.value) return

      try {
        console.log('🛑 VoiceComponent: 外部停止语音识别')
        voiceManager.value.stop()
      } catch (err) {
        console.error('❌ VoiceComponent: 停止语音识别失败:', err)
      }
    }

    /**
     * 重试语音设置
     */
    const retryVoiceSetup = () => {
      error.value = ''
      initializeVoiceServices()
    }

    /**
     * 获取状态文本
     */
    const getStatusText = () => {
      if (!isSupported.value) return '不支持语音识别'
      if (isProcessing.value) return '处理中...'
      if (isListening.value) return '正在听...'
      return '点击开始语音识别'
    }

    /**
     * 获取提示文本
     */
    const getHintText = () => {
      if (!isSupported.value) return '请使用支持语音识别的浏览器'
      if (isListening.value) return '请说出语音命令'
      return '支持搜索、导航、缩放等操作'
    }

    // 监听mapManager变化
    watch(() => props.mapManager, (newMapManager) => {
      if (newMapManager && !commandProcessor.value) {
        commandProcessor.value = new VoiceCommandProcessor(newMapManager)
        console.log('✅ VoiceComponent: CommandProcessor已更新')
      }
    }, { immediate: true })

    // 组件生命周期
    onMounted(() => {
      initializeVoiceServices()
    })

    onUnmounted(() => {
      if (voiceManager.value) {
        voiceManager.value.destroy()
      }
      if (commandProcessor.value) {
        commandProcessor.value.destroy()
      }
    })

    return {
      // 状态
      isSupported,
      isListening,
      isProcessing,
      error,
      
      // 语音结果
      finalTranscript,
      interimTranscript,
      recentTranscript,
      lastResult,
      
      // UI状态
      showHelp,
      
      // 方法
      toggleVoiceRecognition,
      startVoice,
      stopVoice,
      retryVoiceSetup,
      getStatusText,
      getHintText
    }
  }
}
</script>

<style scoped>
.voice-control {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 标题和帮助按钮 */
.voice-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.voice-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.help-btn {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 50%;
  background: #667eea;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  transition: all 0.2s ease;
}

.help-btn:hover {
  background: #5a6fd8;
  transform: scale(1.1);
}

/* 帮助内容 */
.help-content {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  border-left: 4px solid #667eea;
  margin-bottom: 16px;
}

.help-section {
  margin-bottom: 12px;
}

.help-section:last-child {
  margin-bottom: 0;
}

.help-section h4 {
  margin: 0 0 6px 0;
  font-size: 14px;
  color: #333;
  font-weight: 600;
}

.help-section p {
  margin: 0;
  font-size: 13px;
  color: #666;
  line-height: 1.4;
}

/* 主控制按钮 */
.voice-main-control {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.voice-btn {
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

.voice-btn:hover:not(.disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.voice-btn.recording {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  animation: pulse 1.5s infinite;
  box-shadow: 0 4px 15px rgba(40, 167, 69, 0.4);
}

.voice-btn.disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.voice-btn-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.voice-icon {
  font-size: 24px;
  min-width: 32px;
}

.voice-text {
  text-align: left;
  flex: 1;
  background: transparent;
}

.voice-status {
  font-weight: 600;
  font-size: 16px;
  margin-bottom: 4px;
  background: transparent;
}

.voice-hint {
  font-size: 12px;
  opacity: 0.9;
  background: transparent;
}

/* 语音显示区域 */
.voice-display {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 12px;
  /* border-left: 4px solid #667eea; */
}

.transcript-label {
  font-size: 12px;
  font-weight: 600;
  color: #666;
  margin-bottom: 8px;
}

.transcript-content {
  font-size: 14px;
  line-height: 1.4;
  min-height: 20px;
}

.interim {
  color: #999;
  font-style: italic;
}

.final {
  color: #333;
  font-weight: 500;
}

.recent {
  color: #666;
}

/* 命令反馈 */
.voice-feedback {
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

.feedback-icon {
  font-size: 16px;
}

.feedback-text {
  font-size: 14px;
  font-weight: 500;
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

/* 错误显示 */
.voice-error {
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

.error-icon {
  font-size: 16px;
}

.error-text {
  font-size: 14px;
  font-weight: 500;
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

/* 动画效果 */
@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.pulse {
  animation: pulse 1s infinite;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .voice-btn-content {
    flex-direction: column;
    text-align: center;
    gap: 8px;
  }
  
  .voice-text {
    text-align: center;
  }
}
</style>
