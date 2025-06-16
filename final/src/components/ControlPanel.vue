<template>
  <div class="control-panel">
    <!-- 搜索组件 -->
    <SearchComponent
      :map-manager="mapManager"
      @search-result="handleSearchResult"
      @search-error="handleSearchError"
    />

    <!-- 语音控制组件 -->
    <div class="voice-control-section">
      <VoiceComponent
        ref="voiceComponent"
        :map-manager="mapManager"
        @voice-result="handleVoiceResult"
        @voice-error="handleVoiceError"
      />
    </div>

    <!-- 手势控制组件 -->
    <div class="gesture-control-section">
      <div class="gesture-header">
        <h3 class="gesture-title">手势控制</h3>
        <button 
          class="help-btn" 
          @click="toggleGestureHelp()" 
          @mouseenter="showHelpTooltip = true"
          @mouseleave="showHelpTooltip = false"
          title="使用帮助"
        >
          <span>❓</span>
          <!-- 帮助提示弹窗 -->
          <div v-if="showHelpTooltip" class="help-tooltip">
            <div class="help-section">
              <h4>🔍 主要缩放手势</h4>
              <p>🖐️ 五指张开 - 放大地图<br>👌 OK手势 - 缩小地图</p>
            </div>
            <div class="help-section">
              <h4>👈 地图移动手势</h4>
              <p>向左/右/上/下滑动 - 地图移动</p>
            </div>
            <div class="help-section">
              <h4>💡 使用技巧</h4>
              <p>保持手部在摄像头视野内<br>光线充足时识别效果更好</p>
            </div>
          </div>
        </button>
      </div>
      <GestureComponent
        ref="gestureComponent"
        :map-manager="mapManager"
        @gesture-result="handleGestureResult"
        @gesture-error="handleGestureError"
      />
    </div>

    <!-- 状态信息 -->
    <div v-if="lastAction" class="status-info">
      <div class="status-message" :class="lastAction.type">
        <span class="status-icon">{{ getStatusIcon(lastAction.type) }}</span>
        <span class="status-text">{{ lastAction.message }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import SearchComponent from './SearchComponent.vue'
import VoiceComponent from './VoiceComponent.vue'
import GestureComponent from './GestureComponent.vue'

export default {
  name: 'ControlPanel',
  components: {
    SearchComponent,
    VoiceComponent,
    GestureComponent
  },
  props: {
    mapManager: {
      type: Object,
      default: null
    }
  },
  emits: ['action-result'],
  setup(props, { emit }) {
    const lastAction = ref(null)
    const voiceComponent = ref(null)
    const gestureComponent = ref(null)
    const showGestureHelp = ref(false)
    const showHelpTooltip = ref(false)

    /**
     * 切换手势帮助显示
     */
    const toggleGestureHelp = () => {
      showGestureHelp.value = !showGestureHelp.value
    }

    /**
     * 设置状态信息
     */
    const setStatus = (type, message) => {
      lastAction.value = { type, message }
      setTimeout(() => {
        lastAction.value = null
      }, 3000)
    }

    /**
     * 获取状态图标
     */
    const getStatusIcon = (type) => {
      const icons = {
        success: '✅',
        error: '❌',
        info: 'ℹ️',
        warning: '⚠️'
      }
      return icons[type] || 'ℹ️'
    }

    /**
     * 处理搜索结果
     */
    const handleSearchResult = (results) => {
      setStatus('success', `找到 ${results.length} 个搜索结果`)
      emit('action-result', { type: 'search', results })
    }

    /**
     * 处理搜索错误
     */
    const handleSearchError = (error) => {
      setStatus('error', `搜索失败: ${error.message}`)
      emit('action-result', { type: 'error', error })
    }

    /**
     * 处理语音识别结果
     */
    const handleVoiceResult = (data) => {
      const { transcript, result } = data
      
      if (result.success) {
        setStatus('success', `语音命令执行成功: ${transcript}`)
        emit('action-result', { 
          type: 'voice', 
          transcript, 
          result: result.result 
        })
      } else {
        setStatus('warning', `语音命令执行失败: ${result.message}`)
        emit('action-result', { 
          type: 'voice_error', 
          transcript, 
          error: result.message 
        })
      }
    }

    /**
     * 处理语音识别错误
     */
    const handleVoiceError = (error) => {
      setStatus('error', `语音识别错误: ${error.message}`)
      emit('action-result', { type: 'voice_error', error })
    }

    /**
     * 处理手势识别结果
     */
    const handleGestureResult = (data) => {
      const { gesture, result } = data
      
      if (result.success) {
        setStatus('success', `手势命令执行成功: ${gesture.name}`)
        emit('action-result', { 
          type: 'gesture', 
          gesture: gesture.name, 
          result: result.result 
        })
      } else {
        setStatus('warning', `手势命令执行失败: ${result.message}`)
        emit('action-result', { 
          type: 'gesture_error', 
          gesture: gesture.name, 
          error: result.message 
        })
      }
    }

    /**
     * 处理手势识别错误
     */
    const handleGestureError = (error) => {
      setStatus('error', `手势识别错误: ${error.error}`)
      emit('action-result', { type: 'gesture_error', error })
    }

    /**
     * 从手势触发切换语音识别
     */
    const toggleVoiceFromGesture = () => {
      console.log('🎤 ControlPanel: 从手势切换到语音识别')
      
      if (voiceComponent.value) {
        // 先停止手势识别
        if (gestureComponent.value) {
          gestureComponent.value.stopGesture()
        }
        
        // 启动语音识别
        voiceComponent.value.startVoice()
        setStatus('info', '已从手势切换到语音识别')
      }
    }

    /**
     * 从语音触发切换手势识别
     */
    const toggleGestureFromVoice = () => {
      console.log('🤚 ControlPanel: 从语音切换到手势识别')
      
      if (gestureComponent.value) {
        // 先停止语音识别
        if (voiceComponent.value) {
          voiceComponent.value.stopVoice()
        }
        
        // 启动手势识别
        gestureComponent.value.startGesture()
        setStatus('info', '已从语音切换到手势识别')
      }
    }

    return {
      lastAction,
      voiceComponent,
      gestureComponent,
      showGestureHelp,
      showHelpTooltip,
      toggleGestureHelp,
      getStatusIcon,
      handleSearchResult,
      handleSearchError,
      handleVoiceResult,
      handleVoiceError,
      handleGestureResult,
      handleGestureError,
      toggleVoiceFromGesture,
      toggleGestureFromVoice
    }
  }
}
</script>

<style scoped>
.control-panel {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  width: 350px;
  max-height: calc(100vh - 100px);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.voice-control-section h3 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
}

.gesture-control-section h3 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
}

.gesture-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.gesture-title {
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
  position: relative;
}

.help-btn:hover {
  background: #5a6fd8;
  transform: scale(1.1);
}

.help-tooltip {
  position: absolute;
  top: 35px;
  right: 0;
  width: 280px;
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  padding: 16px;
  z-index: 1000;
  animation: fadeIn 0.2s ease-out;
}

.help-tooltip::before {
  content: '';
  position: absolute;
  top: -6px;
  right: 8px;
  width: 12px;
  height: 12px;
  background: white;
  border: 1px solid #e9ecef;
  border-right: none;
  border-bottom: none;
  transform: rotate(45deg);
}

.help-tooltip .help-section {
  margin-bottom: 12px;
}

.help-tooltip .help-section:last-child {
  margin-bottom: 0;
}

.help-tooltip h4 {
  margin: 0 0 6px 0;
  font-size: 13px;
  color: #333;
  font-weight: 600;
}

.help-tooltip p {
  margin: 0;
  font-size: 12px;
  color: #666;
  line-height: 1.4;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.status-info {
  margin-top: auto;
}

.status-message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 6px;
  font-size: 13px;
  animation: slideIn 0.3s ease-out;
}

.status-message.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.status-message.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.status-message.info {
  background: #d1ecf1;
  color: #0c5460;
  border: 1px solid #bee5eb;
}

.status-message.warning {
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 滚动条样式 */
.control-panel::-webkit-scrollbar {
  width: 6px;
}

.control-panel::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.control-panel::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.control-panel::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .control-panel {
    width: 100%;
    max-width: 350px;
    margin: 0 auto;
  }
}
</style>
