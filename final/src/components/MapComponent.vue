<template>
  <div class="map-component">
    <div id="map" ref="mapContainer"></div>
    
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <div class="loading-text">正在加载3D地图...</div>
    </div>

    <!-- 错误状态 -->
    <div v-if="error" class="error-overlay">
      <div class="error-icon">⚠️</div>
      <div class="error-text">{{ error }}</div>
      <button class="retry-button" @click="retryLoad">重新加载</button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'
import { MapManager } from '../services/MapManager.js'

export default {
  name: 'MapComponent',
  emits: ['map-loaded', 'map-error'],
  setup(props, { emit }) {
    const mapContainer = ref(null)
    const loading = ref(true)
    const error = ref(null)
    
    let mapManager = null

    /**
     * 初始化地图
     */
    const initializeMap = async () => {
      try {
        loading.value = true
        error.value = null
        
        console.log('🗺️ MapComponent: 开始初始化地图')
        
        // 创建地图管理器实例
        mapManager = new MapManager()
        
        // 设置地图容器
        mapManager.setContainer(mapContainer.value)
        
        // 初始化地图
        await mapManager.initialize()
        
        loading.value = false
        
        console.log('✅ MapComponent: 地图初始化完成')
        emit('map-loaded', mapManager)
        
      } catch (err) {
        console.error('❌ MapComponent: 地图初始化失败:', err)
        loading.value = false
        error.value = err.message || '地图加载失败'
        emit('map-error', err)
      }
    }

    /**
     * 重新加载地图
     */
    const retryLoad = () => {
      console.log('🔄 MapComponent: 重新加载地图')
      initializeMap()
    }

    /**
     * 清理资源
     */
    const cleanup = () => {
      if (mapManager) {
        mapManager.destroy()
        mapManager = null
      }
    }

    // 生命周期
    onMounted(() => {
      console.log('📦 MapComponent: 组件挂载')
      // 延迟初始化，确保DOM已渲染
      setTimeout(initializeMap, 100)
    })

    onUnmounted(() => {
      console.log('🗑️ MapComponent: 组件卸载')
      cleanup()
    })

    return {
      mapContainer,
      loading,
      error,
      retryLoad
    }
  }
}
</script>

<style scoped>
.map-component {
  width: 100%;
  height: 100%;
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

#map {
  width: 100%;
  height: 100%;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  font-size: 18px;
  color: #495057;
  font-weight: 500;
}

.error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  text-align: center;
}

.error-icon {
  font-size: 48px;
  margin-bottom: 15px;
}

.error-text {
  font-size: 16px;
  color: #e53e3e;
  margin-bottom: 20px;
  line-height: 1.4;
}

.retry-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.retry-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.retry-button:active {
  transform: translateY(0);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .loading-text {
    font-size: 16px;
  }
  
  .error-text {
    font-size: 14px;
  }
}
</style>
