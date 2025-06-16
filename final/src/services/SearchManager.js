// 搜索管理器 - 负责地点搜索和结果处理
export class SearchManager {
  constructor(mapManager) {
    this.mapManager = mapManager
    this.searchHistory = this.loadSearchHistory()
    this.markers = new Map() // 存储搜索结果标记
    this.currentResults = []
  }

  /**
   * 搜索地点
   * @param {string} query - 搜索关键词
   * @returns {Promise<Array>} 搜索结果数组
   */
  async searchLocation(query) {
    if (!query || query.trim().length === 0) {
      throw new Error('搜索关键词不能为空')
    }

    try {
      console.log('🔍 SearchManager: 开始搜索:', query)
      
      // 使用 Mapbox Geocoding API
      const response = await this.geocodeSearch(query)
      
      // 处理搜索结果
      const results = this.processSearchResults(response)
      
      // 保存搜索历史
      this.addToHistory(query)
      
      // 更新当前结果
      this.currentResults = results
      
      console.log('✅ SearchManager: 搜索完成，找到', results.length, '个结果')
      return results
      
    } catch (error) {
      console.error('❌ SearchManager: 搜索失败:', error)
      throw error
    }
  }

  /**
   * 使用 Mapbox Geocoding API 搜索
   */
  async geocodeSearch(query) {
    const token = this.mapManager?.config?.token
    if (!token) {
      throw new Error('Mapbox token 未配置')
    }

    const encodedQuery = encodeURIComponent(query)
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json?access_token=${token}&limit=10&language=zh`
    
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`搜索请求失败: ${response.status}`)
    }
    
    return await response.json()
  }

  /**
   * 处理搜索结果
   */
  processSearchResults(response) {
    if (!response.features || response.features.length === 0) {
      return []
    }

    return response.features.map((feature, index) => ({
      id: feature.id || `result-${index}`,
      name: feature.place_name || feature.text,
      address: feature.place_name,
      coordinates: feature.center, // [lng, lat]
      type: feature.place_type?.[0] || 'place',
      relevance: feature.relevance || 0,
      bbox: feature.bbox, // 边界框
      properties: feature.properties || {}
    }))
  }

  /**
   * 飞到搜索结果
   * @param {Object} result - 搜索结果对象
   */
  flyToResult(result) {
    if (!this.mapManager?.map || !result.coordinates) {
      console.error('❌ SearchManager: 无法导航，地图或坐标无效')
      return
    }

    const map = this.mapManager.map
    const [lng, lat] = result.coordinates

    // 飞到目标位置
    map.flyTo({
      center: [lng, lat],
      zoom: 16,
      pitch: 60,
      bearing: 0,
      duration: 2000,
      essential: true
    })

    console.log('🚁 SearchManager: 飞行到:', result.name)
  }

  /**
   * 添加搜索结果标记
   * @param {Object} result - 搜索结果
   */
  addMarker(result) {
    if (!this.mapManager?.map || !result.coordinates) {
      return null
    }

    const map = this.mapManager.map
    const [lng, lat] = result.coordinates

    // 创建标记元素
    const markerElement = document.createElement('div')
    markerElement.className = 'search-marker'
    markerElement.innerHTML = `
      <div class="marker-pin">📍</div>
      <div class="marker-label">${result.name}</div>
    `

    // 创建弹窗内容
    const popupHTML = `
      <div class="search-popup">
        <h3>${result.name}</h3>
        <p class="address">${result.address}</p>
        <p class="type">类型: ${this.getTypeLabel(result.type)}</p>
        <div class="popup-actions">
          <button onclick="navigator.geolocation && navigator.geolocation.getCurrentPosition(pos => {
            console.log('当前位置:', pos.coords.latitude, pos.coords.longitude)
          })" class="action-btn">📱 导航</button>
          <button onclick="navigator.clipboard?.writeText('${result.address}')" class="action-btn">📋 复制</button>
        </div>
      </div>
    `

    // 创建标记
    const marker = new mapboxgl.Marker({
      element: markerElement,
      anchor: 'bottom'
    })
      .setLngLat([lng, lat])
      .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(popupHTML))
      .addTo(map)

    // 保存标记
    this.markers.set(result.id, marker)

    console.log('📍 SearchManager: 添加标记:', result.name)
    return marker
  }

  /**
   * 获取类型标签
   */
  getTypeLabel(type) {
    const typeMap = {
      'place': '地点',
      'address': '地址',
      'poi': '兴趣点',
      'restaurant': '餐厅',
      'hotel': '酒店',
      'school': '学校',
      'hospital': '医院',
      'bank': '银行',
      'gas_station': '加油站',
      'shopping': '购物',
      'tourism': '旅游景点'
    }
    return typeMap[type] || type
  }

  /**
   * 清除所有标记
   */
  clearMarkers() {
    this.markers.forEach(marker => {
      marker.remove()
    })
    this.markers.clear()
    console.log('🗑️ SearchManager: 清除所有标记')
  }

  /**
   * 清除指定标记
   */
  removeMarker(resultId) {
    const marker = this.markers.get(resultId)
    if (marker) {
      marker.remove()
      this.markers.delete(resultId)
      console.log('🗑️ SearchManager: 删除标记:', resultId)
    }
  }

  /**
   * 获取搜索历史
   */
  getSearchHistory() {
    return [...this.searchHistory]
  }

  /**
   * 添加到搜索历史
   */
  addToHistory(query) {
    const trimmedQuery = query.trim()
    if (trimmedQuery.length === 0) return

    // 移除重复项
    this.searchHistory = this.searchHistory.filter(item => item !== trimmedQuery)
    
    // 添加到开头
    this.searchHistory.unshift(trimmedQuery)
    
    // 限制历史记录数量
    this.searchHistory = this.searchHistory.slice(0, 10)
    
    // 保存到本地存储
    this.saveSearchHistory()
  }

  /**
   * 清除搜索历史
   */
  clearHistory() {
    this.searchHistory = []
    this.saveSearchHistory()
    console.log('🗑️ SearchManager: 清除搜索历史')
  }

  /**
   * 保存搜索历史到本地存储
   */
  saveSearchHistory() {
    try {
      localStorage.setItem('mapSearchHistory', JSON.stringify(this.searchHistory))
    } catch (error) {
      console.warn('⚠️ SearchManager: 无法保存搜索历史:', error)
    }
  }

  /**
   * 从本地存储加载搜索历史
   */
  loadSearchHistory() {
    try {
      const saved = localStorage.getItem('mapSearchHistory')
      return saved ? JSON.parse(saved) : []
    } catch (error) {
      console.warn('⚠️ SearchManager: 无法加载搜索历史:', error)
      return []
    }
  }

  /**
   * 获取当前搜索结果
   */
  getCurrentResults() {
    return [...this.currentResults]
  }

  /**
   * 销毁搜索管理器
   */
  destroy() {
    this.clearMarkers()
    this.currentResults = []
    console.log('🧹 SearchManager: 销毁完成')
  }
}
