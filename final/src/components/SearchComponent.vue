<template>
  <div class="search-container">
    <!-- 搜索输入框 -->
    <div class="search-input-group">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="🔍 搜索地点... (如：北京大学、星巴克、天安门)"
        class="search-input"
        @keyup.enter="handleSearch"
        @input="handleInputChange"
        @focus="showSuggestions = true"
      />
      <button 
        @click="handleSearch" 
        :disabled="!searchQuery.trim() || isSearching"
        class="search-button"
        :class="{ 'searching': isSearching }"
      >
        <span v-if="isSearching" class="loading-spinner">⏳</span>
        <span v-else>🔍</span>
      </button>
      <button 
        v-if="searchQuery.trim()"
        @click="clearSearch" 
        class="clear-button"
        title="清除搜索"
      >
        ✕
      </button>
    </div>

    <!-- 搜索建议/历史 -->
    <div v-if="showSuggestions && (searchHistory.length > 0 || searchQuery.trim())" class="suggestions-dropdown">
      <!-- 搜索历史 -->
      <div v-if="searchHistory.length > 0 && !searchQuery.trim()" class="suggestions-section">
        <div class="suggestions-header">
          <span>🕒 最近搜索</span>
          <button @click="clearHistory" class="clear-history-btn">清除</button>
        </div>
        <div
          v-for="(item, index) in searchHistory"
          :key="'history-' + index"
          class="suggestion-item history-item"
          @click="searchFromHistory(item)"
        >
          <span class="suggestion-text">{{ item }}</span>
          <button @click.stop="removeFromHistory(index)" class="remove-btn">×</button>
        </div>
      </div>

      <!-- 快捷搜索 -->
      <div v-if="!searchQuery.trim()" class="suggestions-section">
        <div class="suggestions-header">
          <span>⚡ 快捷搜索</span>
        </div>
        <div
          v-for="shortcut in quickSearches"
          :key="shortcut.text"
          class="suggestion-item shortcut-item"
          @click="searchFromHistory(shortcut.text)"
        >
          <span class="suggestion-icon">{{ shortcut.icon }}</span>
          <span class="suggestion-text">{{ shortcut.text }}</span>
        </div>
      </div>
    </div>

    <!-- 搜索结果 -->
    <div v-if="searchResults.length > 0" class="search-results">
      <div class="results-header">
        <h4>📍 搜索结果 ({{ searchResults.length }})</h4>
        <button @click="clearResults" class="clear-results-btn">清除</button>
      </div>
      <div class="results-list">
        <div
          v-for="(result, index) in searchResults"
          :key="result.id || index"
          class="result-item"
          @click="selectResult(result)"
        >
          <div class="result-icon">{{ getResultIcon(result.type) }}</div>
          <div class="result-content">
            <div class="result-name">{{ result.name }}</div>
            <div class="result-address">{{ result.address }}</div>
            <div class="result-coords">
              📍 {{ result.coordinates[1].toFixed(4) }}, {{ result.coordinates[0].toFixed(4) }}
            </div>
            <div v-if="result.provider" class="result-provider">
              数据源: {{ result.provider }}
            </div>
          </div>
          <div class="result-relevance">{{ Math.round(result.relevance * 100) }}%</div>
        </div>
      </div>
    </div>

    <!-- 状态信息 -->
    <div v-if="searchError" class="search-error">
      <span class="error-icon">⚠️</span>
      <span class="error-text">{{ searchError }}</span>
      <button @click="searchError = ''" class="error-close">×</button>
    </div>

    <div v-if="searchSuccess" class="search-success">
      <span class="success-icon">✅</span>
      <span class="success-text">{{ searchSuccess }}</span>
    </div>
  </div>
</template>

<script>
import { ref, watch, onMounted, onUnmounted } from 'vue'

export default {
  name: 'SearchComponent',
  props: {
    mapManager: {
      type: Object,
      required: true
    }
  },
  emits: ['searchResult', 'searchError'],
  setup(props, { emit }) {
    const searchQuery = ref('')
    const searchResults = ref([])
    const searchHistory = ref([])
    const isSearching = ref(false)
    const searchError = ref('')
    const searchSuccess = ref('')
    const showSuggestions = ref(false)

    // 快捷搜索选项
    const quickSearches = ref([
      { icon: '🍽️', text: '餐厅' },
      { icon: '🏥', text: '医院' },
      { icon: '🏦', text: '银行' },
      { icon: '⛽', text: '加油站' },
      { icon: '🚇', text: '地铁站' },
      { icon: '🏫', text: '学校' },
      { icon: '🏨', text: '酒店' },
      { icon: '🛒', text: '超市' }
    ])

    /**
     * 初始化搜索历史
     */
    const loadSearchHistory = () => {
      try {
        const saved = localStorage.getItem('mapSearchHistory')
        searchHistory.value = saved ? JSON.parse(saved) : []
      } catch (error) {
        console.warn('⚠️ 无法加载搜索历史:', error)
        searchHistory.value = []
      }
    }

    /**
     * 保存搜索历史
     */
    const saveSearchHistory = () => {
      try {
        localStorage.setItem('mapSearchHistory', JSON.stringify(searchHistory.value))
      } catch (error) {
        console.warn('⚠️ 无法保存搜索历史:', error)
      }
    }

    /**
     * 处理输入变化
     */
    const handleInputChange = () => {
      // 清除错误信息
      if (searchError.value) {
        searchError.value = ''
      }
      
      // 清除成功信息
      if (searchSuccess.value) {
        searchSuccess.value = ''
      }
    }

    /**
     * 执行搜索
     */
    const handleSearch = async () => {
      const query = searchQuery.value.trim()
      if (!query) {
        showSuggestions.value = true
        return
      }

      // 检查 mapManager 是否可用
      if (!props.mapManager) {
        searchError.value = '地图未加载完成，请稍后再试'
        console.warn('⚠️ SearchComponent: mapManager 不可用')
        return
      }

      isSearching.value = true
      searchError.value = ''
      searchSuccess.value = ''
      showSuggestions.value = false

      try {
        console.log('🔍 SearchComponent: 开始搜索:', query)
        
        // 使用MapManager的搜索功能
        const results = await props.mapManager.searchLocation(query)
        
        if (results && results.length > 0) {
          searchResults.value = results
          addToHistory(query)
          searchSuccess.value = `找到 ${results.length} 个相关地点`
          emit('searchResult', results)
          
          // 3秒后清除成功信息
          setTimeout(() => {
            searchSuccess.value = ''
          }, 3000)
        } else {
          searchError.value = '未找到相关地点，请尝试其他关键词'
          emit('searchError', new Error('未找到相关地点'))
        }
      } catch (error) {
        console.error('❌ SearchComponent: 搜索失败:', error)
        searchError.value = error.message || '搜索失败，请检查网络连接后重试'
        emit('searchError', error)
      } finally {
        isSearching.value = false
      }
    }

    /**
     * 选择搜索结果
     */
    const selectResult = async (result) => {
      try {
        console.log('📍 SearchComponent: 选择结果:', result.name)
        
        // 检查 mapManager 是否可用
        if (!props.mapManager) {
          searchError.value = '地图未加载完成，无法导航'
          console.warn('⚠️ SearchComponent: mapManager 不可用，无法导航')
          return
        }
        
        // 使用MapManager导航到结果
        await props.mapManager.flyToSearchResult(result)
        
        // 更新搜索框
        searchQuery.value = result.name
        
        // 隐藏结果
        showSuggestions.value = false
        
        // 显示成功信息
        searchSuccess.value = `已导航到 ${result.name}`
        setTimeout(() => {
          searchSuccess.value = ''
        }, 3000)
        
        emit('searchResult', [result])
      } catch (error) {
        console.error('❌ SearchComponent: 导航失败:', error)
        searchError.value = '导航失败，请重试'
        emit('searchError', error)
      }
    }

    /**
     * 从历史记录搜索
     */
    const searchFromHistory = (query) => {
      searchQuery.value = query
      handleSearch()
    }

    /**
     * 添加到搜索历史
     */
    const addToHistory = (query) => {
      if (!query.trim()) return
      
      // 移除重复项
      const index = searchHistory.value.indexOf(query)
      if (index > -1) {
        searchHistory.value.splice(index, 1)
      }
      
      // 添加到开头
      searchHistory.value.unshift(query)
      
      // 限制历史记录数量
      if (searchHistory.value.length > 8) {
        searchHistory.value = searchHistory.value.slice(0, 8)
      }
      
      saveSearchHistory()
    }

    /**
     * 从历史记录中移除
     */
    const removeFromHistory = (index) => {
      searchHistory.value.splice(index, 1)
      saveSearchHistory()
    }

    /**
     * 清除搜索历史
     */
    const clearHistory = () => {
      searchHistory.value = []
      saveSearchHistory()
    }

    /**
     * 清除搜索
     */
    const clearSearch = () => {
      searchQuery.value = ''
      searchResults.value = []
      searchError.value = ''
      searchSuccess.value = ''
      showSuggestions.value = false
    }

    /**
     * 清除搜索结果
     */
    const clearResults = () => {
      searchResults.value = []
      // 检查 mapManager 是否可用
      if (props.mapManager && props.mapManager.clearSearchMarker) {
        props.mapManager.clearSearchMarker()
      }
    }

    /**
     * 获取结果图标
     */
    const getResultIcon = (type) => {
      const iconMap = {
        'place': '📍',
        'address': '🏠',
        'poi': '⭐',
        'restaurant': '🍽️',
        'hotel': '🏨',
        'school': '🏫',
        'hospital': '🏥',
        'bank': '🏦',
        'gas_station': '⛽',
        'shopping': '🛒',
        'tourism': '🗺️',
        'transport': '🚇'
      }
      return iconMap[type] || '📍'
    }

    /**
     * 点击外部隐藏建议
     */
    const handleClickOutside = (event) => {
      const searchContainer = event.target.closest('.search-container')
      if (!searchContainer) {
        showSuggestions.value = false
      }
    }

    // 生命周期
    onMounted(() => {
      loadSearchHistory()
      document.addEventListener('click', handleClickOutside)
    })

    onUnmounted(() => {
      document.removeEventListener('click', handleClickOutside)
    })

    return {
      searchQuery,
      searchResults,
      searchHistory,
      isSearching,
      searchError,
      searchSuccess,
      showSuggestions,
      quickSearches,
      handleSearch,
      handleInputChange,
      selectResult,
      searchFromHistory,
      removeFromHistory,
      clearHistory,
      clearSearch,
      clearResults,
      getResultIcon
    }
  }
}
</script>

<style scoped>
.search-container {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  position: relative;
}

.search-input-group {
  display: flex;
  gap: 8px;
  align-items: center;
  position: relative;
}

.search-input {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #e9ecef;
  border-radius: 10px;
  font-size: 14px;
  transition: all 0.3s ease;
  background: white;
  outline: none;
}

.search-input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.search-button {
  padding: 12px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
  min-width: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.search-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.search-button.searching {
  animation: pulse 1.5s infinite;
}

.clear-button {
  padding: 8px;
  background: #f8f9fa;
  color: #6c757d;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.clear-button:hover {
  background: #e9ecef;
  color: #495057;
}

.loading-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

/* 搜索建议下拉框 */
.suggestions-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 10px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  margin-top: 4px;
  max-height: 300px;
  overflow-y: auto;
}

.suggestions-section {
  padding: 8px 0;
}

.suggestions-section:not(:last-child) {
  border-bottom: 1px solid #f8f9fa;
}

.suggestions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  font-size: 12px;
  color: #6c757d;
  font-weight: 600;
}

.clear-history-btn {
  background: none;
  border: none;
  color: #667eea;
  cursor: pointer;
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background 0.2s ease;
}

.clear-history-btn:hover {
  background: rgba(102, 126, 234, 0.1);
}

.suggestion-item {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  cursor: pointer;
  transition: background 0.2s ease;
  font-size: 13px;
}

.suggestion-item:hover {
  background: #f8f9fa;
}

.history-item {
  justify-content: space-between;
}

.shortcut-item {
  gap: 12px;
}

.suggestion-icon {
  font-size: 16px;
  width: 20px;
  text-align: center;
}

.suggestion-text {
  flex: 1;
  color: #333;
}

.remove-btn {
  background: none;
  border: none;
  color: #6c757d;
  cursor: pointer;
  font-size: 16px;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-btn:hover {
  background: #e9ecef;
  color: #dc3545;
}

/* 搜索结果 */
.search-results {
  margin-top: 16px;
  background: #f8f9fa;
  border-radius: 10px;
  overflow: hidden;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #e9ecef;
  border-bottom: 1px solid #dee2e6;
}

.results-header h4 {
  margin: 0;
  font-size: 14px;
  color: #333;
}

.clear-results-btn {
  background: none;
  border: none;
  color: #667eea;
  cursor: pointer;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background 0.2s ease;
}

.clear-results-btn:hover {
  background: rgba(102, 126, 234, 0.1);
}

.results-list {
  max-height: 250px;
  overflow-y: auto;
}

.result-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.2s ease;
  border-bottom: 1px solid #e9ecef;
  gap: 12px;
}

.result-item:hover {
  background: white;
}

.result-item:last-child {
  border-bottom: none;
}

.result-icon {
  font-size: 20px;
  width: 24px;
  text-align: center;
  flex-shrink: 0;
}

.result-content {
  flex: 1;
  min-width: 0;
}

.result-name {
  font-weight: 600;
  color: #333;
  font-size: 14px;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.result-address {
  color: #6c757d;
  font-size: 12px;
  line-height: 1.4;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.result-coords {
  color: #999;
  font-size: 11px;
  font-family: monospace;
}

.result-provider {
  color: #667eea;
  font-size: 10px;
  font-weight: 500;
  margin-top: 2px;
  padding: 1px 4px;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 3px;
  display: inline-block;
}

.result-relevance {
  color: #667eea;
  font-size: 11px;
  font-weight: 600;
  background: rgba(102, 126, 234, 0.1);
  padding: 2px 6px;
  border-radius: 12px;
  flex-shrink: 0;
}

/* 状态信息 */
.search-error,
.search-success {
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 8px;
  animation: slideIn 0.3s ease-out;
}

.search-error {
  background: #fff5f5;
  color: #c53030;
  border: 1px solid #fed7d7;
}

.search-success {
  background: #f0fff4;
  color: #38a169;
  border: 1px solid #c6f6d5;
}

.error-text,
.success-text {
  flex: 1;
}

.error-close {
  background: none;
  border: none;
  color: #c53030;
  cursor: pointer;
  font-size: 16px;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background 0.2s ease;
}

.error-close:hover {
  background: rgba(197, 48, 48, 0.1);
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 滚动条样式 */
.suggestions-dropdown::-webkit-scrollbar,
.results-list::-webkit-scrollbar {
  width: 6px;
}

.suggestions-dropdown::-webkit-scrollbar-track,
.results-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.suggestions-dropdown::-webkit-scrollbar-thumb,
.results-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.suggestions-dropdown::-webkit-scrollbar-thumb:hover,
.results-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .search-container {
    padding: 12px;
  }
  
  .search-input {
    padding: 10px 12px;
    font-size: 16px; /* 防止iOS缩放 */
  }
  
  .search-button {
    padding: 10px 12px;
  }
  
  .suggestions-dropdown {
    max-height: 200px;
  }
  
  .results-list {
    max-height: 180px;
  }
  
  .result-item {
    padding: 10px 12px;
  }
}
</style>
