// 地图管理器 - 负责地图的初始化和3D效果
import mapboxgl from 'mapbox-gl'
import { BaiduMapSearchService } from './BaiduMapSearchService.js'

// 确保 mapboxgl 在全局可用
window.mapboxgl = mapboxgl

export class MapManager {
  constructor() {
    this.map = null
    this.container = null
    this.isLoaded = false
    
    // 初始化百度地图搜索服务
    this.baiduMapSearch = new BaiduMapSearchService()
    
    // 默认配置
    this.config = {
      token: 'pk.eyJ1IjoiZWpwcnhpczkiLCJhIjoiY21ieGIzeGY2MHNwMDJtcXdscWVxYmhzbCJ9.FsQ6WgRFA0kwzf_V6bE8yQ',
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [121.47004, 31.23136], // 上海
      zoom: 12,
      pitch: 60,
      bearing: 0,
      antialias: true
    }
    
    // 百度地图实例（用于搜索）
    this.baiduMapInstance = null
    this.baiduMapContainer = null
    this.currentSearchMarker = null
  }

  /**
   * 设置地图容器
   */
  setContainer(container) {
    this.container = container
  }

  /**
   * 初始化地图
   */
  async initialize() {
    if (!this.container) {
      throw new Error('地图容器未设置')
    }

    try {
      console.log('🗺️ MapManager: 开始初始化地图')

      // 设置访问令牌
      mapboxgl.accessToken = this.config.token

      // 创建地图实例
      this.map = new mapboxgl.Map({
        container: this.container, 
        style: this.config.style,
        center: this.config.center, 
        zoom: this.config.zoom,
        pitch: this.config.pitch,
        bearing: this.config.bearing,
        antialias: this.config.antialias
      })

      // 添加基础控件
      this.addControls()

      // 等待地图加载完成
      await this.waitForLoad()

      // 添加3D效果
      this.add3DEffects()

      // 初始化百度地图搜索功能
      await this.initializeBaiduMap()

      console.log('✅ MapManager: 地图初始化完成')
      this.isLoaded = true

    } catch (error) {
      console.error('❌ MapManager: 地图初始化失败:', error)
      throw error
    }
  }

  /**
   * 初始化百度地图（用于搜索功能）
   */
  async initializeBaiduMap() {
    try {
      console.log('🗺️ MapManager: 初始化百度地图搜索功能')
      
      // 检查百度地图API是否可用
      if (typeof window.BMap === 'undefined') {
        console.warn('⚠️ 百度地图API未加载，搜索功能将不可用')
        return false
      }
      
      // 创建隐藏的百度地图容器用于搜索
      if (!this.baiduMapContainer) {
        this.baiduMapContainer = document.createElement('div')
        this.baiduMapContainer.id = 'baidu-search-map'
        this.baiduMapContainer.style.display = 'none'
        this.baiduMapContainer.style.width = '1px'
        this.baiduMapContainer.style.height = '1px'
        document.body.appendChild(this.baiduMapContainer)
      }
      
      // 初始化百度地图实例（用于搜索）
      this.baiduMapInstance = new window.BMap.Map(this.baiduMapContainer)
      this.baiduMapInstance.centerAndZoom(new window.BMap.Point(116.404, 39.915), 12)
      
      // 初始化搜索服务
      this.baiduMapSearch.initialize(this.baiduMapInstance)
      
      console.log('✅ MapManager: 百度地图搜索功能初始化完成')
      return true
      
    } catch (error) {
      console.error('❌ MapManager: 百度地图初始化失败:', error)
      return false
    }
  }

  /**
   * 添加地图控件
   */
  addControls() {
    if (!this.map) return

    // 导航控件
    this.map.addControl(new mapboxgl.NavigationControl(), 'top-left')
    
    // 比例尺控件
    this.map.addControl(new mapboxgl.ScaleControl(), 'bottom-left')
    
    // 全屏控件
    this.map.addControl(new mapboxgl.FullscreenControl(), 'top-right')
  }

  /**
   * 等待地图加载完成
   */
  waitForLoad() {
    return new Promise((resolve, reject) => {
      if (!this.map) {
        reject(new Error('地图实例不存在'))
        return
      }

      this.map.on('load', () => {
        console.log('🎯 MapManager: 地图加载完成事件触发')
        resolve()
      })

      this.map.on('error', (e) => {
        console.error('❌ MapManager: 地图加载错误:', e)
        reject(e.error || new Error('地图加载失败'))
      })
    })
  }

  /**
   * 添加3D效果
   */
  add3DEffects() {
    if (!this.map || !this.map.isStyleLoaded()) {
      console.warn('⚠️ MapManager: 地图样式未加载完成，跳过3D效果添加')
      return
    }

    try {
      // 添加3D建筑物图层
      this.add3DBuildings()
      
      // 添加地形图层
      this.addTerrain()
      
      console.log('✅ MapManager: 3D效果添加完成')
    } catch (error) {
      console.warn('⚠️ MapManager: 3D效果添加失败:', error)
    }
  }

  /**
   * 添加3D建筑物
   */
  add3DBuildings() {
    if (!this.map) return

    // 添加建筑物3D效果
    const layers = this.map.getStyle().layers
    const labelLayerId = layers.find(
      (layer) => layer.type === 'symbol' && layer.layout['text-field']
    ).id

    this.map.addLayer({
      'id': 'add-3d-buildings',
      'source': 'composite',
      'source-layer': 'building',
      'filter': ['==', 'extrude', 'true'],
      'type': 'fill-extrusion',
      'minzoom': 15,
      'paint': {
        'fill-extrusion-color': '#aaa',
        'fill-extrusion-height': [
          'interpolate',
          ['linear'],
          ['zoom'],
          15,
          0,
          15.05,
          ['get', 'height']
        ],
        'fill-extrusion-base': [
          'interpolate',
          ['linear'],
          ['zoom'],
          15,
          0,
          15.05,
          ['get', 'min_height']
        ],
        'fill-extrusion-opacity': 0.6
      }
    }, labelLayerId)
  }

  /**
   * 添加地形图层
   */
  addTerrain() {
    if (!this.map) return

    // 添加地形数据源
    this.map.addSource('mapbox-dem', {
      'type': 'raster-dem',
      'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
      'tileSize': 512,
      'maxzoom': 14
    })

    // 设置地形
    this.map.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.5 })
  }

  /**
   * 获取地图实例
   */
  getMap() {
    return this.map
  }

  /**
   * 检查地图是否已加载
   */
  isMapLoaded() {
    return this.isLoaded && this.map && this.map.isStyleLoaded()
  }

  /**
   * 使用百度API搜索地点
   * @param {string} query - 搜索关键词
   * @returns {Promise<Array>} 搜索结果数组
   */
  async searchLocation(query) {
    if (!query || query.trim().length === 0) {
      throw new Error('搜索关键词不能为空')
    }

    try {
      console.log('🔍 MapManager: 开始百度搜索:', query)
      
      // 确保百度地图搜索服务已初始化
      if (!this.baiduMapInstance) {
        const initialized = await this.initializeBaiduMap()
        if (!initialized) {
          throw new Error('百度地图搜索服务初始化失败')
        }
      }
      
      // 使用百度地图搜索服务
      const results = await this.baiduMapSearch.searchPlaces(query)
      
      console.log('✅ MapManager: 百度搜索完成，找到', results.length, '个结果')
      return results
      
    } catch (error) {
      console.error('❌ MapManager: 搜索失败:', error)
      throw new Error(`搜索失败: ${error.message}`)
    }
  }

  /**
   * 飞行到搜索结果位置
   * @param {Object} result - 搜索结果对象
   */
  flyToSearchResult(result) {
    if (!this.map || !result.coordinates) {
      console.error('❌ MapManager: 无法导航，地图或坐标无效')
      throw new Error('无法导航到指定位置')
    }

    try {
      const [lng, lat] = result.coordinates
      
      // 验证坐标范围
      if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
        console.warn('⚠️ MapManager: 坐标范围异常:', lng, lat)
      }
      
      console.log('🚁 MapManager: 飞行到:', result.name)
      console.log('   🎯 目标坐标 (WGS84):', `${lng.toFixed(6)}, ${lat.toFixed(6)}`)
      if (result.baiduCoordinates) {
        console.log('   📍 原始坐标 (百度):', `${result.baiduCoordinates[0].toFixed(6)}, ${result.baiduCoordinates[1].toFixed(6)}`)
      }

      // 飞到目标位置
      this.map.flyTo({
        center: [lng, lat],
        zoom: 16,
        pitch: 60,
        bearing: 0,
        duration: 2000,
        essential: true
      })

      // 添加标记
      this.addSearchMarker(result)
      
      // 如果有百度地图搜索服务，也在百度地图上显示
      if (this.baiduMapSearch && result.baiduPoint) {
        this.baiduMapSearch.navigateToResult(result)
      }
      
    } catch (error) {
      console.error('❌ MapManager: 导航失败:', error)
      throw new Error(`导航失败: ${error.message}`)
    }
  }

  /**
   * 添加搜索结果标记
   * @param {Object} result - 搜索结果
   */
  addSearchMarker(result) {
    if (!this.map || !result.coordinates) {
      return null
    }

    try {
      // 清除之前的标记
      this.clearSearchMarker()

      const [lng, lat] = result.coordinates

      // 创建标记元素
      const markerElement = document.createElement('div')
      markerElement.className = 'search-marker'
      markerElement.innerHTML = `
        <div class="marker-pin">
          <div class="marker-icon">${this.getTypeIcon(result.type)}</div>
        </div>
        <div class="marker-label">${result.name}</div>
      `

      // 添加样式
      markerElement.style.cssText = `
        background: none;
        border: none;
        cursor: pointer;
        padding: 0;
      `

      // 创建标记
      this.currentSearchMarker = new mapboxgl.Marker(markerElement)
        .setLngLat([lng, lat])
        .addTo(this.map)

      // 创建弹窗
      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: true,
        closeOnClick: false
      }).setHTML(`
        <div class="search-popup">
          <h3>${result.name}</h3>
          <p>${result.address}</p>
          <div class="popup-meta">
            <span>📍 WGS84: ${lat.toFixed(6)}, ${lng.toFixed(6)}</span>
            ${result.baiduCoordinates ? 
              `<span>📍 百度: ${result.baiduCoordinates[1].toFixed(6)}, ${result.baiduCoordinates[0].toFixed(6)}</span>` : 
              ''
            }
            <span>🔍 ${result.provider}</span>
          </div>
        </div>
      `)

      // 绑定弹窗到标记
      this.currentSearchMarker.setPopup(popup)

      console.log('📍 MapManager: 搜索标记已添加')
      return this.currentSearchMarker

    } catch (error) {
      console.error('❌ MapManager: 添加搜索标记失败:', error)
      return null
    }
  }

  /**
   * 获取类型图标
   * @param {string} type - POI类型
   * @returns {string} 图标emoji
   */
  getTypeIcon(type) {
    const icons = {
      'restaurant': '🍽️',
      'hospital': '🏥',
      'school': '🏫',
      'bank': '🏦',
      'hotel': '🏨',
      'gas_station': '⛽',
      'transit': '🚇',
      'shopping': '🛒',
      'park': '🌳',
      'location': '📍'
    }
    return icons[type] || '📍'
  }

  /**
   * 清除搜索标记
   */
  clearSearchMarker() {
    if (this.currentSearchMarker) {
      this.currentSearchMarker.remove()
      this.currentSearchMarker = null
      console.log('🗑️ MapManager: 清除搜索标记')
    }
  }

  /**
   * 销毁地图
   */
  destroy() {
    if (this.map) {
      console.log('🧹 MapManager: 销毁地图实例')
      this.map.remove()
      this.map = null
      this.isLoaded = false
    }
    
    // 清理百度地图容器
    if (this.baiduMapContainer && this.baiduMapContainer.parentNode) {
      this.baiduMapContainer.parentNode.removeChild(this.baiduMapContainer)
      this.baiduMapContainer = null
    }
    
    this.baiduMapInstance = null
  }
}
