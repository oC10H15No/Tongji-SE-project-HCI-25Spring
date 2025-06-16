/**
 * 百度地图搜索服务 - 基于百度地图JavaScript API
 * 参考main.js中经过验证的搜索逻辑
 */
import { bd09ToWgs84 } from '../utils/coordinateTransform.js'

export class BaiduMapSearchService {
  constructor() {
    this.currentMarkers = []
    this.isInitialized = false
  }

  /**
   * 检查百度地图API是否可用
   */
  checkBaiduMapAPI() {
    if (typeof window.BMap === 'undefined') {
      throw new Error('百度地图API未加载，请检查网络连接')
    }
    return true
  }

  /**
   * 初始化服务
   */
  initialize(mapInstance) {
    this.checkBaiduMapAPI()
    this.mapInstance = mapInstance
    this.isInitialized = true
    console.log('✅ BaiduMapSearchService: 初始化完成')
  }

  /**
   * 搜索地点 - 使用百度地图LocalSearch API
   * @param {string} query - 搜索关键词
   * @param {Object} options - 搜索选项
   * @returns {Promise<Array>} 搜索结果数组
   */
  async searchPlaces(query, options = {}) {
    if (!query || query.trim().length === 0) {
      throw new Error('搜索关键词不能为空')
    }

    this.checkBaiduMapAPI()

    return new Promise((resolve, reject) => {
      try {
        console.log('🔍 BaiduMapSearchService: 开始搜索:', query)
        
        // 清理之前的标记
        this.clearMarkers()
        
        // 创建LocalSearch实例
        const localSearch = new window.BMap.LocalSearch(this.mapInstance || window.map, {
          onSearchComplete: (results) => {
            console.log('🔍 本地搜索结果:', results, '状态:', localSearch.getStatus())
            
            if (localSearch.getStatus() === window.BMAP_STATUS_SUCCESS) {
              const searchResults = []
              
              // 处理搜索结果
              for (let i = 0; i < results.getNumPois(); i++) {
                const poi = results.getPoi(i)
                if (poi && poi.point) {
                  searchResults.push(this.formatSearchResult(poi, i))
                }
              }
              
              if (searchResults.length > 0) {
                console.log('✅ 找到', searchResults.length, '个搜索结果')
                resolve(searchResults)
              } else {
                console.log('📭 本地搜索无结果，尝试备用搜索')
                this.fallbackGeocodeSearch(query).then(resolve).catch(reject)
              }
            } else {
              console.log('本地搜索失败，尝试备用搜索')
              this.fallbackGeocodeSearch(query).then(resolve).catch(reject)
            }
          },
          onSearchError: (status) => {
            console.error('🔍 搜索错误:', status)
            // 搜索失败时尝试备用方法
            this.fallbackGeocodeSearch(query).then(resolve).catch(reject)
          }
        })
        
        // 执行搜索
        localSearch.search(query)
        console.log('🔍 已发起本地搜索:', query)
        
      } catch (error) {
        console.error('❌ BaiduMapSearchService: 搜索发起失败:', error)
        reject(new Error(`搜索失败: ${error.message}`))
      }
    })
  }

  /**
   * 备用搜索方法 - 使用地理编码
   * @param {string} query - 搜索关键词
   * @returns {Promise<Array>} 搜索结果数组
   */
  async fallbackGeocodeSearch(query) {
    return new Promise((resolve, reject) => {
      try {
        console.log('🔄 使用地理编码搜索:', query)
        
        const geocoder = new window.BMap.Geocoder()
        
        // 尝试不同的城市作为搜索范围
        const searchCities = ['全国', '北京市', '上海市', '广州市', '深圳市', '杭州市', '南京市']
        let currentIndex = 0
        
        const tryGeocode = () => {
          if (currentIndex >= searchCities.length) {
            resolve([]) // 所有尝试都失败，返回空结果
            return
          }
          
          const city = searchCities[currentIndex]
          const searchQuery = city === '全国' ? query : `${city}${query}`
          
          geocoder.getPoint(searchQuery, (point) => {
            if (point) {
              console.log('✅ 地理编码找到结果:', point)
              const result = this.formatGeocodeResult(point, query, city)
              resolve([result])
            } else {
              // 尝试下一个城市
              currentIndex++
              tryGeocode()
            }
          }, city === '全国' ? null : city)
        }
        
        tryGeocode()
        
      } catch (error) {
        console.error('❌ 地理编码搜索失败:', error)
        reject(new Error(`备用搜索失败: ${error.message}`))
      }
    })
  }

  /**
   * 格式化搜索结果
   * @param {Object} poi - 百度POI对象
   * @param {number} index - 结果索引
   * @returns {Object} 格式化的搜索结果
   */
  formatSearchResult(poi, index) {
    // 百度坐标系坐标
    const baiduLng = poi.point.lng
    const baiduLat = poi.point.lat
    
    // 转换为WGS84坐标系（Mapbox使用的坐标系）
    const [wgs84Lng, wgs84Lat] = bd09ToWgs84(baiduLng, baiduLat)
    
    // 添加调试日志
    console.log(`🔄 坐标转换 - ${poi.title}:`)
    console.log(`   百度坐标: ${baiduLng.toFixed(6)}, ${baiduLat.toFixed(6)}`)
    console.log(`   WGS84坐标: ${wgs84Lng.toFixed(6)}, ${wgs84Lat.toFixed(6)}`)
    
    // 计算相关度
    const relevance = this.calculateRelevance(poi.title, poi.title)
    
    return {
      id: poi.uid || `baidu-local-${index}`,
      name: poi.title || '未知地点',
      address: poi.address || '地址信息暂无',
      coordinates: [wgs84Lng, wgs84Lat], // 使用转换后的WGS84坐标
      baiduCoordinates: [baiduLng, baiduLat], // 保存原始百度坐标
      baiduPoint: poi.point, // 保存百度Point对象用于地图操作
      type: this.classifyPOIType(poi.title, poi.address),
      relevance: relevance,
      source: 'baidu_local',
      provider: '百度地图',
      raw: poi // 保存原始数据
    }
  }

  /**
   * 格式化地理编码结果
   * @param {Object} point - 百度Point对象
   * @param {string} query - 原始查询
   * @param {string} city - 搜索城市
   * @returns {Object} 格式化的结果
   */
  formatGeocodeResult(point, query, city) {
    // 百度坐标系坐标
    const baiduLng = point.lng
    const baiduLat = point.lat
    
    // 转换为WGS84坐标系
    const [wgs84Lng, wgs84Lat] = bd09ToWgs84(baiduLng, baiduLat)
    
    return {
      id: `baidu-geocode-${Date.now()}`,
      name: query,
      address: city === '全国' ? '通过地理编码找到的位置' : `${city}地区`,
      coordinates: [wgs84Lng, wgs84Lat], // 使用转换后的WGS84坐标
      baiduCoordinates: [baiduLng, baiduLat], // 保存原始百度坐标
      baiduPoint: point,
      type: 'location',
      relevance: 0.8, // 地理编码的相关度设为0.8
      source: 'baidu_geocode',
      provider: '百度地图(地理编码)',
      raw: point
    }
  }

  /**
   * 分类POI类型
   * @param {string} title - POI标题
   * @param {string} address - POI地址
   * @returns {string} POI类型
   */
  classifyPOIType(title, address) {
    const text = (title + ' ' + address).toLowerCase()
    
    if (text.includes('餐') || text.includes('饭') || text.includes('食')) return 'restaurant'
    if (text.includes('医院') || text.includes('诊所')) return 'hospital'
    if (text.includes('学校') || text.includes('大学') || text.includes('学院')) return 'school'
    if (text.includes('银行') || text.includes('ATM')) return 'bank'
    if (text.includes('酒店') || text.includes('宾馆')) return 'hotel'
    if (text.includes('加油站') || text.includes('中石油') || text.includes('中石化')) return 'gas_station'
    if (text.includes('地铁') || text.includes('车站')) return 'transit'
    if (text.includes('超市') || text.includes('商场')) return 'shopping'
    if (text.includes('公园') || text.includes('景区')) return 'park'
    
    return 'location'
  }

  /**
   * 计算搜索相关度
   * @param {string} resultName - 结果名称
   * @param {string} query - 搜索关键词
   * @returns {number} 相关度 (0-1)
   */
  calculateRelevance(resultName, query) {
    if (!resultName || !query) return 0
    
    const name = resultName.toLowerCase()
    const searchTerm = query.toLowerCase()
    
    // 完全匹配
    if (name === searchTerm) return 1.0
    
    // 包含匹配
    if (name.includes(searchTerm)) return 0.9
    
    // 开头匹配
    if (name.startsWith(searchTerm)) return 0.8
    
    // 字符重叠度
    let commonChars = 0
    for (const char of searchTerm) {
      if (name.includes(char)) {
        commonChars++
      }
    }
    
    return Math.max(0.1, commonChars / searchTerm.length * 0.7)
  }

  /**
   * 清除地图标记
   */
  clearMarkers() {
    if (this.mapInstance && this.currentMarkers.length > 0) {
      this.currentMarkers.forEach(marker => {
        this.mapInstance.removeOverlay(marker)
      })
      this.currentMarkers = []
      
      // 关闭信息窗口
      this.mapInstance.closeInfoWindow()
      
      console.log('🧹 已清除地图标记')
    }
  }

  /**
   * 在地图上添加搜索结果标记
   * @param {Object} result - 搜索结果
   * @returns {Object} 创建的标记对象
   */
  addMarkerToMap(result) {
    if (!this.mapInstance || !result.baiduPoint) {
      console.warn('⚠️ 无法添加标记: 地图实例或坐标无效')
      return null
    }

    try {
      // 创建标记
      const marker = new window.BMap.Marker(result.baiduPoint)
      this.mapInstance.addOverlay(marker)
      this.currentMarkers.push(marker)

      // 创建信息窗口
      const infoWindow = new window.BMap.InfoWindow(`
        <div style="padding: 5px; max-width: 200px;">
          <h4 style="margin: 0 0 5px 0; font-size: 13px;">${result.name}</h4>
          <p style="margin: 0; font-size: 11px; color: #666;">${result.address}</p>
          <p style="margin: 5px 0 0 0; font-size: 10px; color: #999;">
            数据源: ${result.provider}
          </p>
        </div>
      `)

      // 点击标记显示信息窗口
      marker.addEventListener('click', () => {
        this.mapInstance.openInfoWindow(infoWindow, result.baiduPoint)
      })

      console.log('📍 已添加标记:', result.name)
      return marker

    } catch (error) {
      console.error('❌ 添加标记失败:', error)
      return null
    }
  }

  /**
   * 导航到搜索结果
   * @param {Object} result - 搜索结果
   */
  navigateToResult(result) {
    if (!this.mapInstance || !result.baiduPoint) {
      throw new Error('无法导航: 地图实例或坐标无效')
    }

    try {
      // 设置地图中心和缩放级别
      this.mapInstance.centerAndZoom(result.baiduPoint, 15)
      
      // 添加标记
      const marker = this.addMarkerToMap(result)
      
      if (marker) {
        // 自动打开信息窗口
        const infoWindow = new window.BMap.InfoWindow(`
          <div style="padding: 5px; max-width: 200px;">
            <h4 style="margin: 0 0 5px 0; font-size: 13px;">${result.name}</h4>
            <p style="margin: 0; font-size: 11px; color: #666;">${result.address}</p>
            <p style="margin: 5px 0 0 0; font-size: 10px; color: #999;">
              数据源: ${result.provider}
            </p>
          </div>
        `)
        
        this.mapInstance.openInfoWindow(infoWindow, result.baiduPoint)
      }

      console.log('🚁 已导航到:', result.name)

    } catch (error) {
      console.error('❌ 导航失败:', error)
      throw new Error(`导航失败: ${error.message}`)
    }
  }
}
