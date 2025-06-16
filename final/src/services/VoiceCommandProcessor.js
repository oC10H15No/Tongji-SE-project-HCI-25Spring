/**
 * 语音命令处理器
 * 负责解析语音识别结果并执行相应的地图操作
 */
export class VoiceCommandProcessor {
  constructor(mapManager) {
    this.mapManager = mapManager
    this.lastCommand = null
    this.lastCommandTime = 0
    
    // 命令映射表
    this.commands = this.initializeCommands()
    
    // 同义词映射
    this.synonyms = this.initializeSynonyms()
  }

  /**
   * 初始化命令映射
   */
  initializeCommands() {
    return {
      // 缩放命令
      '放大': () => this.zoomIn(),
      '缩小': () => this.zoomOut(),
      
      // 方向移动命令 - 进一步减少移动距离，提供超精细的控制
      '向上': () => this.moveMap(0, -25),
      '向下': () => this.moveMap(0, 25),
      '向左': () => this.moveMap(-25, 0),
      '向右': () => this.moveMap(25, 0),
      '往北': () => this.moveMap(0, -25),
      '往南': () => this.moveMap(0, 25),
      '往西': () => this.moveMap(-25, 0),
      '往东': () => this.moveMap(25, 0),
      
      // 重置命令
      '重置': () => this.resetView(),
      '回到原点': () => this.resetView(),
      '初始位置': () => this.resetView(),
      
      // 清除命令
      '清除': () => this.clearMarkers(),
      '清理': () => this.clearMarkers(),
      '删除标记': () => this.clearMarkers(),
      
      // 定位命令
      '定位': () => this.locateUser(),
      '我的位置': () => this.locateUser(),
      '当前位置': () => this.locateUser(),
      
      // 手势识别控制
      '打开手势': () => this.toggleGestureRecognition(),
      '开启手势': () => this.toggleGestureRecognition(),
      '手势识别': () => this.toggleGestureRecognition(),
      '启动手势': () => this.toggleGestureRecognition(),
    }
  }

  /**
   * 初始化同义词映射
   */
  initializeSynonyms() {
    return {
      // 放大同义词
      '放大': ['放大', '拉近', '变大', 'zoom in', '扩大'],
      '缩小': ['缩小', '拉远', '变小', 'zoom out', '缩小'],
      
      // 方向同义词
      '向上': ['向上', '上移', '北', '往北'],
      '向下': ['向下', '下移', '南', '往南'],
      '向左': ['向左', '左移', '西', '往西'],
      '向右': ['向右', '右移', '东', '往东'],
      
      // 搜索同义词
      '搜索': ['搜索', '查找', '找到', '去', '到', 'search'],
      
      // 定位同义词
      '定位': ['定位', '我的位置', '当前位置', 'locate', '我在哪', '位置'],
      
      // 清除同义词
      '清除': ['清除', '清理', '删除标记', 'clear', '重置标记']
    }
  }

  /**
   * 处理语音命令
   */
  async processCommand(transcript) {
    if (!transcript || transcript.trim().length === 0) {
      console.log('❓ VoiceCommandProcessor: 空的语音命令')
      return { success: false, message: '未识别到有效命令' }
    }

    const command = transcript.toLowerCase().trim()
    console.log('🔍 VoiceCommandProcessor: 处理语音命令:', command)

    try {
      // 防止重复执行相同命令
      const now = Date.now()
      if (this.lastCommand === command && (now - this.lastCommandTime) < 2000) {
        console.log('⏭️ VoiceCommandProcessor: 跳过重复命令')
        return { success: false, message: '命令重复，已跳过' }
      }

      this.lastCommand = command
      this.lastCommandTime = now

      // 1. 首先尝试精确匹配
      const exactMatch = this.findExactMatch(command)
      if (exactMatch) {
        const result = await exactMatch()
        return { success: true, message: `已执行: ${command}`, result }
      }

      // 2. 尝试搜索命令
      const searchResult = await this.handleSearchCommand(command)
      if (searchResult.success) {
        return searchResult
      }

      // 3. 尝试模糊匹配
      const fuzzyMatch = this.findFuzzyMatch(command)
      if (fuzzyMatch) {
        const result = await fuzzyMatch.action()
        return { success: true, message: `已执行: ${fuzzyMatch.matched}`, result }
      }

      // 4. 未匹配到任何命令
      return { 
        success: false, 
        message: `未识别的命令: "${command}"`,
        suggestions: this.getSuggestions() 
      }

    } catch (error) {
      console.error('❌ VoiceCommandProcessor: 命令执行失败:', error)
      return { success: false, message: `命令执行失败: ${error.message}` }
    }
  }

  /**
   * 精确匹配命令
   */
  findExactMatch(command) {
    return this.commands[command]
  }

  /**
   * 模糊匹配命令
   */
  findFuzzyMatch(command) {
    // 遍历同义词进行匹配
    for (const [key, synonyms] of Object.entries(this.synonyms)) {
      for (const synonym of synonyms) {
        if (command.includes(synonym.toLowerCase())) {
          const action = this.commands[key]
          if (action) {
            return { matched: key, action }
          }
        }
      }
    }

    // 部分匹配
    for (const [key, action] of Object.entries(this.commands)) {
      if (command.includes(key) || key.includes(command)) {
        return { matched: key, action }
      }
    }

    return null
  }

  /**
   * 处理搜索命令
   */
  async handleSearchCommand(command) {
    // 检测搜索命令
    const searchKeywords = ['搜索', '查找', '找到', '去', '到', 'search']
    const hasSearchKeyword = searchKeywords.some(keyword => 
      command.includes(keyword.toLowerCase())
    )

    if (!hasSearchKeyword) {
      return { success: false }
    }

    // 提取搜索词
    let searchTerm = command

    // 移除搜索关键词
    searchKeywords.forEach(keyword => {
      searchTerm = searchTerm.replace(new RegExp(keyword, 'gi'), '').trim()
    })

    // 如果提取的搜索词为空，尝试正则匹配
    if (!searchTerm) {
      const searchPatterns = [
        /搜索(.+)/,
        /查找(.+)/,
        /找到(.+)/,
        /去(.+)/,
        /到(.+)/
      ]
      
      for (const pattern of searchPatterns) {
        const match = command.match(pattern)
        if (match && match[1]) {
          searchTerm = match[1].trim()
          break
        }
      }
    }

    if (!searchTerm || searchTerm.length === 0) {
      return { 
        success: false, 
        message: '请说出要搜索的地点，例如："搜索北京"' 
      }
    }

    console.log('🔍 VoiceCommandProcessor: 提取的搜索词:', searchTerm)

    try {
      // 执行搜索
      const results = await this.mapManager.searchLocation(searchTerm)
      
      if (results && results.length > 0) {
        // 自动导航到第一个结果
        await this.mapManager.flyToSearchResult(results[0])
        
        return {
          success: true,
          message: `已找到并导航到: ${results[0].name}`,
          searchTerm,
          results
        }
      } else {
        return {
          success: false,
          message: `未找到"${searchTerm}"相关地点，请尝试更具体的地名`
        }
      }
    } catch (error) {
      console.error('❌ VoiceCommandProcessor: 搜索失败:', error)
      return {
        success: false,
        message: `搜索"${searchTerm}"失败: ${error.message}`
      }
    }
  }

  /**
   * 地图放大
   */
  zoomIn() {
    if (!this.mapManager?.map) {
      throw new Error('地图未初始化')
    }
    this.mapManager.map.zoomIn()
    console.log('📈 VoiceCommandProcessor: 地图已放大')
    return { action: 'zoom_in' }
  }

  /**
   * 地图缩小
   */
  zoomOut() {
    if (!this.mapManager?.map) {
      throw new Error('地图未初始化')
    }
    this.mapManager.map.zoomOut()
    console.log('📉 VoiceCommandProcessor: 地图已缩小')
    return { action: 'zoom_out' }
  }

  /**
   * 移动地图
   */
  moveMap(deltaX, deltaY) {
    if (!this.mapManager?.map) {
      throw new Error('地图未初始化')
    }
    
    // 获取当前中心点
    const currentCenter = this.mapManager.map.getCenter()
    
    // 计算移动距离（根据当前缩放级别调整）
    const zoom = this.mapManager.map.getZoom()
    const factor = Math.pow(2, 15 - zoom) * 0.001
    
    const newCenter = [
      currentCenter.lng + deltaX * factor,
      currentCenter.lat - deltaY * factor  // 注意Y轴方向
    ]
    
    this.mapManager.map.easeTo({ center: newCenter, duration: 500 })
    
    const direction = deltaX > 0 ? '东' : deltaX < 0 ? '西' : deltaY > 0 ? '南' : '北'
    console.log(`🧭 VoiceCommandProcessor: 地图向${direction}移动`)
    
    return { action: 'move', direction, deltaX, deltaY }
  }

  /**
   * 重置视图
   */
  resetView() {
    if (!this.mapManager?.map) {
      throw new Error('地图未初始化')
    }
    
    this.mapManager.map.flyTo({
      center: this.mapManager.config.center,
      zoom: this.mapManager.config.zoom,
      pitch: this.mapManager.config.pitch,
      bearing: this.mapManager.config.bearing,
      duration: 2000
    })
    
    console.log('🏠 VoiceCommandProcessor: 视图已重置')
    return { action: 'reset_view' }
  }

  /**
   * 清除标记
   */
  clearMarkers() {
    if (!this.mapManager) {
      throw new Error('地图管理器未初始化')
    }
    
    this.mapManager.clearSearchMarker()
    console.log('🗑️ VoiceCommandProcessor: 标记已清除')
    return { action: 'clear_markers' }
  }

  /**
   * 定位用户
   */
  async locateUser() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('浏览器不支持定位功能'))
        return
      }

      const options = {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (this.mapManager?.map) {
            const userLocation = [position.coords.longitude, position.coords.latitude]
            
            this.mapManager.map.flyTo({
              center: userLocation,
              zoom: 15,
              duration: 2000
            })
            
            console.log('📍 VoiceCommandProcessor: 已定位到用户位置')
            resolve({ 
              action: 'locate_user', 
              coordinates: userLocation,
              accuracy: position.coords.accuracy 
            })
          } else {
            reject(new Error('地图未初始化'))
          }
        },
        (error) => {
          let errorMessage = '定位失败：'
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage += '权限被拒绝'
              break
            case error.POSITION_UNAVAILABLE:
              errorMessage += '位置不可用'
              break
            case error.TIMEOUT:
              errorMessage += '请求超时'
              break
            default:
              errorMessage += '未知错误'
          }
          reject(new Error(errorMessage))
        },
        options
      )
    })
  }

  /**
   * 获取命令建议
   */
  getSuggestions() {
    return [
      '试试说："放大" 或 "缩小"',
      '试试说："搜索 北京"',
      '试试说："定位" 或 "我的位置"',
      '试试说："向上" 或 "往北"',
      '试试说："重置" 或 "回到原点"',
      '试试说："清除" 删除地图标记'
    ]
  }

  /**
   * 获取支持的命令列表
   */
  getSupportedCommands() {
    return {
      zoom: ['放大', '缩小', '拉近', '拉远'],
      move: ['向上', '向下', '向左', '向右', '往北', '往南', '往东', '往西'],
      search: ['搜索 [地点]', '查找 [地点]', '去 [地点]'],
      locate: ['定位', '我的位置', '当前位置'],
      reset: ['重置', '回到原点', '初始位置'],
      clear: ['清除', '清理', '删除标记']
    }
  }

  /**
   * 切换手势识别状态
   */
  toggleGestureRecognition() {
    try {
      console.log('🤚 VoiceCommandProcessor: 切换手势识别状态')
      
      // 发送自定义事件来通知主应用切换手势识别
      const event = new CustomEvent('toggleGestureRecognition', {
        detail: {
          source: 'voice',
          action: 'toggle',
          timestamp: Date.now()
        }
      })
      
      window.dispatchEvent(event)
      
      return {
        success: true,
        message: '正在切换手势识别状态...'
      }
    } catch (error) {
      console.error('❌ VoiceCommandProcessor: 切换手势识别失败:', error)
      return {
        success: false,
        message: '切换手势识别失败'
      }
    }
  }

  /**
   * 销毁命令处理器
   */
  destroy() {
    this.mapManager = null
    this.lastCommand = null
    this.lastCommandTime = 0
    console.log('🧹 VoiceCommandProcessor: 已销毁')
  }
}
