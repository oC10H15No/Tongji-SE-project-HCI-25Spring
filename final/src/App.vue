<template>
  <div id="app">
    <!-- 顶部标题 -->
    <header class="header">
      <h1>🗺️ 3D地图智能控制系统</h1>
      <div class="header-subtitle">语音识别 + 手势控制 + 地点搜索</div>
      <div class="status">
        <span v-if="mapLoaded" class="status-badge success">3D地图已加载</span>
        <span v-else-if="error" class="status-badge error">加载失败</span>
        <span v-else class="status-badge loading">正在加载...</span>
      </div>
    </header>

    <!-- 主容器 -->
    <div class="main-container">
      <!-- 地图组件 -->
      <MapComponent 
        @map-loaded="onMapLoaded"
        @map-error="onMapError"
        ref="mapComponent"
      />
      
      <!-- 控制面板 -->
      <div class="control-panel-container">
        <ControlPanel
          ref="controlPanel"
          :map-manager="mapManager"
          @action-result="onActionResult"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'
import MapComponent from './components/MapComponent.vue'
import ControlPanel from './components/ControlPanel.vue'

export default {
  name: 'App',
  components: {
    MapComponent,
    ControlPanel
  },
  setup() {
    // 应用状态
    const mapLoaded = ref(false)
    const error = ref(null)
    const mapComponent = ref(null)
    const controlPanel = ref(null)
    
    // 地图管理器实例（使用响应式引用）
    const mapManager = ref(null)

    /**
     * 地图加载成功处理
     */
    const onMapLoaded = (manager) => {
      console.log('🎉 App: 地图加载成功')
      mapLoaded.value = true
      error.value = null
      mapManager.value = manager
    }

    /**
     * 地图加载错误处理
     */
    const onMapError = (err) => {
      console.error('💥 App: 地图加载失败:', err)
      mapLoaded.value = false
      error.value = err.message || '地图加载失败'
    }

    /**
     * 处理操作结果
     */
    const onActionResult = (result) => {
      console.log('📊 App: 操作结果:', result)
      
      // 专门处理语音控制结果
      if (result.type === 'voice') {
        console.log('🎤 App: 语音命令执行成功:', result.transcript)
        console.log('✅ App: 命令结果:', result.result)
      } else if (result.type === 'voice_error') {
        console.error('❌ App: 语音控制错误:', result.error)
      } else if (result.type === 'gesture') {
        console.log('🤚 App: 手势命令执行成功:', result.gesture)
        console.log('✅ App: 命令结果:', result.result)
      } else if (result.type === 'gesture_error') {
        console.error('❌ App: 手势控制错误:', result.error)
      } else if (result.type === 'search') {
        console.log('🔍 App: 搜索完成，找到结果:', result.results?.length || 0)
      }
    }

    /**
     * 获取地图管理器
     */
    const getMapManager = () => {
      return mapManager.value
    }

    /**
     * 处理手势切换语音识别事件
     */
    const handleToggleVoiceRecognition = (event) => {
      console.log('🎤 App: 收到切换语音识别请求:', event.detail)
      
      // 通过ControlPanel组件切换语音识别
      if (controlPanel.value) {
        controlPanel.value.toggleVoiceFromGesture()
      }
    }

    /**
     * 处理语音切换手势识别事件
     */
    const handleToggleGestureRecognition = (event) => {
      console.log('🤚 App: 收到切换手势识别请求:', event.detail)
      
      // 通过ControlPanel组件切换手势识别
      if (controlPanel.value) {
        controlPanel.value.toggleGestureFromVoice()
      }
    }

    /**
     * 组件挂载时设置事件监听器
     */
    onMounted(() => {
      console.log('🔧 App: 设置事件监听器')
      
      // 监听手势触发的语音识别切换事件
      window.addEventListener('toggleVoiceRecognition', handleToggleVoiceRecognition)
      
      // 监听语音触发的手势识别切换事件
      window.addEventListener('toggleGestureRecognition', handleToggleGestureRecognition)
    })

    /**
     * 组件卸载时清理事件监听器
     */
    onUnmounted(() => {
      console.log('🧹 App: 清理事件监听器')
      
      window.removeEventListener('toggleVoiceRecognition', handleToggleVoiceRecognition)
      window.removeEventListener('toggleGestureRecognition', handleToggleGestureRecognition)
    })

    return {
      mapLoaded,
      error,
      mapComponent,
      controlPanel,
      mapManager,
      onMapLoaded,
      onMapError,
      onActionResult,
      getMapManager,
      handleToggleVoiceRecognition,
      handleToggleGestureRecognition
    }
  }
}
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  height: 100vh;
  display: flex;
  flex-direction: column;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.header h1 {
  font-size: 24px;
  font-weight: 600;
  margin: 0;
}

.header-subtitle {
  font-size: 14px;
  opacity: 0.9;
  font-weight: 400;
  margin-top: 4px;
  color: rgba(255, 255, 255, 0.8);
}

.status {
  display: flex;
  gap: 10px;
}

.status-badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-badge.success {
  background: rgba(72, 187, 120, 0.2);
  color: #48bb78;
  border: 1px solid rgba(72, 187, 120, 0.3);
}

.status-badge.error {
  background: rgba(229, 62, 62, 0.2);
  color: #e53e3e;
  border: 1px solid rgba(229, 62, 62, 0.3);
}

.status-badge.loading {
  background: rgba(237, 137, 54, 0.2);
  color: #ed8936;
  border: 1px solid rgba(237, 137, 54, 0.3);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.main-container {
  flex: 1;
  position: relative;
  overflow: hidden;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header {
    padding: 10px 15px;
    flex-direction: column;
    gap: 10px;
    text-align: center;
  }
  
  .header h1 {
    font-size: 20px;
  }
  
  .status {
    justify-content: center;
  }
}
</style>