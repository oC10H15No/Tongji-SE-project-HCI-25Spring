/**
 * 手势命令处理器
 * 负责解析手势识别结果并执行相应的地图操作
 * 新的缩放设计：双手张开/合拢进行缩放
 */
export class GestureCommandProcessor {
  constructor(mapManager) {
    this.mapManager = mapManager
    this.lastGesture = null
    this.lastGestureTime = 0
    
    // 手势命令映射表
    this.gestureCommands = this.initializeGestureCommands()
    
    // 连续手势状态
    this.continuousGestureState = {
      isActive: false,
      type: null,
      startTime: 0,
      lastUpdateTime: 0,
      multiplier: 1.0
    }

    // 临时标记
    this.tempMarker = null
  }

  /**
   * 初始化手势命令映射 - 与语音识别统一的移动距离
   */
  initializeGestureCommands() {
    return {
      // 静态手势 - 采用main.js中的放大/缩小逻辑
      'zoom_in': () => this.zoomIn(),       // 五指张开放大
      'zoom_out': () => this.zoomOut(),     // OK手势缩小
      
      // 滑动手势 - 地图移动，进一步减少移动距离提供超精细的控制
      'swipe_left': () => this.moveMap(-25, 0),   // 向西移动
      'swipe_right': () => this.moveMap(25, 0),   // 向东移动
      'swipe_up': () => this.moveMap(0, -25),     // 向北移动
      'swipe_down': () => this.moveMap(0, 25),    // 向南移动
      
      // 保留双手缩放（如果检测到）
      'pinch_out': (gesture) => this.handleZoomGesture(gesture, 'zoom_in'),
      'pinch_in': (gesture) => this.handleZoomGesture(gesture, 'zoom_out'),
      
      // 旋转手势（备用）
      'rotate_left': () => this.rotateMap(-15),
      'rotate_right': () => this.rotateMap(15),
      
      // 倾斜手势（备用）
      'tilt_up': () => this.tiltMap(10),
      'tilt_down': () => this.tiltMap(-10)
    }
  }

  /**
   * 处理手势命令
   */
  async processGesture(gesture) {
    if (!gesture || !gesture.name) {
      console.log('❓ GestureCommandProcessor: 无效的手势数据')
      return { success: false, message: '无效的手势' }
    }

    console.log('🤚 GestureCommandProcessor: 处理手势:', gesture.name)

    try {
      // 不同手势类型使用不同的防抖间隔
      if (!gesture.name.includes('pinch')) {
        const now = Date.now()
        
        // 为不同手势设置不同的防抖时间
        let cooldownTime = 1500 // 默认间隔
        if (gesture.name.includes('swipe')) {
          cooldownTime = 2500 // 滑动手势增加更长间隔，防止地图飞太快
        } else if (gesture.name.includes('zoom')) {
          cooldownTime = 1000 // 缩放手势稍短间隔
        }
        
        // 防止重复执行相同手势
        if (this.lastGesture === gesture.name && (now - this.lastGestureTime) < cooldownTime) {
          console.log(`⏭️ GestureCommandProcessor: 跳过重复手势 (${gesture.name}，间隔: ${cooldownTime}ms)`)
          return { success: false, message: '手势重复，已跳过' }
        }
        
        this.lastGesture = gesture.name
        this.lastGestureTime = now
      }

      // 查找对应的命令处理函数
      const command = this.gestureCommands[gesture.name]
      if (command) {
        const result = await command(gesture) // 将gesture参数传递给命令
        return { 
          success: true, 
          message: `手势命令执行成功: ${this.getGestureDisplayName(gesture.name)}`, 
          gesture: gesture.name,
          result 
        }
      }

      // 处理连续手势
      const continuousResult = this.handleContinuousGesture(gesture)
      if (continuousResult) {
        return continuousResult
      }

      // 未识别的手势
      return {
        success: false,
        message: `未识别的手势: ${gesture.name}`,
        suggestions: this.getSuggestions()
      }

    } catch (error) {
      console.error('❌ GestureCommandProcessor: 手势命令执行失败:', error)
      return { success: false, message: `手势命令执行失败: ${error.message}` }
    }
  }

  /**
   * 处理缩放手势 - 新的双手缩放逻辑
   */
  handleZoomGesture(gesture, zoomType) {
    if (!this.mapManager?.map) {
      throw new Error('地图未初始化')
    }

    // 获取强度系数，用于控制缩放幅度
    const intensity = gesture.data?.intensity || 1.0
    const baseZoomAmount = 0.5 // 基础缩放量
    const zoomAmount = baseZoomAmount * intensity * 1.5 // 加强缩放效果

    console.log(`🔍 GestureCommandProcessor: ${zoomType}手势，强度: ${intensity.toFixed(2)}`)

    if (zoomType === 'zoom_in') {
      // 双手张开 - 放大
      this.mapManager.map.easeTo({
        zoom: this.mapManager.map.getZoom() + zoomAmount,
        duration: 300
      })
      return { action: 'zoom_in', amount: zoomAmount, intensity }
    } else {
      // 双手合拢 - 缩小
      this.mapManager.map.easeTo({
        zoom: this.mapManager.map.getZoom() - zoomAmount,
        duration: 300
      })
      return { action: 'zoom_out', amount: zoomAmount, intensity }
    }
  }

  /**
   * 放大地图
   */
  zoomIn() {
    if (!this.mapManager?.map) {
      throw new Error('地图未初始化')
    }
    
    const currentZoom = this.mapManager.map.getZoom()
    const newZoom = Math.min(currentZoom + 1, 22) // 限制最大缩放级别
    
    this.mapManager.map.easeTo({
      zoom: newZoom,
      duration: 300
    })
    
    console.log(`🔍 GestureCommandProcessor: 地图放大到 ${newZoom.toFixed(1)}`)
    return { action: 'zoom_in', zoom: newZoom }
  }

  /**
   * 缩小地图
   */
  zoomOut() {
    if (!this.mapManager?.map) {
      throw new Error('地图未初始化')
    }
    
    const currentZoom = this.mapManager.map.getZoom()
    const newZoom = Math.max(currentZoom - 1, 0) // 限制最小缩放级别
    
    this.mapManager.map.easeTo({
      zoom: newZoom,
      duration: 300
    })
    
    console.log(`🔍 GestureCommandProcessor: 地图缩小到 ${newZoom.toFixed(1)}`)
    return { action: 'zoom_out', zoom: newZoom }
  }

  /**
   * 停止操作
   */
  stopOperation() {
    if (!this.mapManager?.map) {
      throw new Error('地图未初始化')
    }
    
    // 停止所有动画
    this.mapManager.map.stop()
    console.log('✋ GestureCommandProcessor: 停止所有地图操作')
    return { action: 'stop' }
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
      pitch: this.mapManager.config.pitch || 60,
      bearing: this.mapManager.config.bearing || 0,
      duration: 2000
    })
    
    console.log('🏠 GestureCommandProcessor: 视图已重置')
    return { action: 'reset_view' }
  }

  /**
   * 选择当前位置
   */
  selectCurrentLocation() {
    if (!this.mapManager?.map) {
      throw new Error('地图未初始化')
    }
    
    const center = this.mapManager.map.getCenter()
    
    // 移除之前的临时标记
    if (this.tempMarker) {
      this.tempMarker.remove()
    }
    
    // 添加新的临时标记
    this.tempMarker = new mapboxgl.Marker({
      color: '#ff6b6b',
      scale: 1.2
    })
      .setLngLat([center.lng, center.lat])
      .addTo(this.mapManager.map)
    
    console.log('📍 GestureCommandProcessor: 已选择当前位置')
    return { action: 'select_location', coordinates: [center.lng, center.lat] }
  }

  /**
   * 确认操作
   */
  confirmOperation() {
    console.log('✅ GestureCommandProcessor: 操作已确认')
    return { action: 'confirm' }
  }

  /**
   * 切换地图样式
   */
  toggleMapStyle() {
    if (!this.mapManager?.map) {
      throw new Error('地图未初始化')
    }

    const currentStyle = this.mapManager.map.getStyle().name
    const newStyle = currentStyle === 'Mapbox Streets' ? 
      'mapbox://styles/mapbox/satellite-v9' : 
      'mapbox://styles/mapbox/streets-v11'
    
    this.mapManager.map.setStyle(newStyle)
    console.log('🎨 GestureCommandProcessor: 地图样式已切换')
    return { action: 'toggle_style', style: newStyle }
  }

  /**
   * 切换地图模式
   */
  toggleMapMode() {
    if (!this.mapManager?.map) {
      throw new Error('地图未初始化')
    }

    const currentPitch = this.mapManager.map.getPitch()
    const newPitch = currentPitch > 30 ? 0 : 60
    
    this.mapManager.map.easeTo({
      pitch: newPitch,
      duration: 1000
    })
    
    console.log('🌍 GestureCommandProcessor: 地图模式已切换 (3D/2D)')
    return { action: 'toggle_mode', pitch: newPitch }
  }

  /**
   * 移动地图 - 与语音识别完全统一的移动逻辑
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
    console.log(`🧭 GestureCommandProcessor: 地图向${direction}移动`)
    
    return { action: 'move', direction, deltaX, deltaY }
  }

  /**
   * 旋转地图
   */
  rotateMap(angle) {
    if (!this.mapManager?.map) {
      throw new Error('地图未初始化')
    }
    
    const currentBearing = this.mapManager.map.getBearing()
    const newBearing = (currentBearing + angle) % 360
    
    this.mapManager.map.easeTo({
      bearing: newBearing,
      duration: 500
    })
    
    console.log(`🔄 GestureCommandProcessor: 地图旋转 ${angle}°`)
    return { action: 'rotate', angle, bearing: newBearing }
  }

  /**
   * 倾斜地图
   */
  tiltMap(pitchChange) {
    if (!this.mapManager?.map) {
      throw new Error('地图未初始化')
    }
    
    const currentPitch = this.mapManager.map.getPitch()
    const newPitch = Math.max(0, Math.min(60, currentPitch + pitchChange))
    
    this.mapManager.map.easeTo({
      pitch: newPitch,
      duration: 500
    })
    
    console.log(`📐 GestureCommandProcessor: 地图倾斜调整 ${pitchChange}°`)
    return { action: 'tilt', pitchChange, pitch: newPitch }
  }

  /**
   * 切换语音识别
   */
  toggleVoiceRecognition() {
    console.log('🎤 GestureCommandProcessor: 切换语音识别状态')
    
    // 发送自定义事件来通知主应用切换语音识别
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('toggleVoiceRecognition', {
        detail: { 
          action: 'toggle', 
          source: 'gesture',
          timestamp: Date.now()
        }
      }))
    }
    
    return { action: 'toggle_voice_recognition' }
  }

  /**
   * 处理连续手势
   */
  handleContinuousGesture(gesture) {
    const now = Date.now()
    
    // 检查是否为连续手势
    if (this.lastGesture === gesture.name && (now - this.lastGestureTime) < 2000) {
      this.continuousGestureState.isActive = true
      this.continuousGestureState.type = gesture.name
      this.continuousGestureState.multiplier = Math.min(this.continuousGestureState.multiplier + 0.2, 3.0)
      
      console.log(`🔄 GestureCommandProcessor: 连续手势 ${gesture.name} x${this.continuousGestureState.multiplier.toFixed(1)}`)
      
      return {
        success: true,
        message: `连续手势: ${this.getGestureDisplayName(gesture.name)}`,
        continuous: true,
        multiplier: this.continuousGestureState.multiplier
      }
    }
    
    // 重置连续手势状态
    this.continuousGestureState.isActive = false
    this.continuousGestureState.multiplier = 1.0
    
    return null
  }

  /**
   * 获取手势显示名称
   */
  getGestureDisplayName(gestureName) {
    const displayNames = {
      'fist': '握拳停止',
      'open_palm': '张开重置',
      'point': '指向选择',
      'ok': 'OK确认',
      'peace': 'V手势样式',
      'rock': '摇滚3D',
      'pinch_out': '双手张开放大',
      'pinch_in': '双手合拢缩小',
      'swipe_left': '向左滑动',
      'swipe_right': '向右滑动',
      'swipe_up': '向上滑动',
      'swipe_down': '向下滑动'
    }
    return displayNames[gestureName] || gestureName
  }

  /**
   * 获取手势建议
   */
  getSuggestions() {
    return [
      '试试握拳停止操作',
      '试试张开手掌重置视图',
      '试试双手张开/合拢进行缩放',
      '试试指向手势选择位置',
      '试试OK手势确认操作'
    ]
  }

  /**
   * 获取支持的命令列表
   */
  getSupportedCommands() {
    return {
      basic: ['握拳', '张开手掌', '指向', 'OK手势'],
      zoom: ['双手张开放大', '双手合拢缩小'],
      move: ['向左滑动', '向右滑动', '向上滑动', '向下滑动'],
      rotate: ['顺时针旋转', '逆时针旋转'],
      tilt: ['向上倾斜', '向下倾斜']
    }
  }

  /**
   * 获取手势描述
   */
  getGestureDescription(gestureName) {
    const descriptions = {
      'fist': '停止所有地图操作',
      'zoom_in': '五指张开放大地图',
      'zoom_out': 'OK手势缩小地图',
      'point': '选择指向的地图位置',
      'peace': '切换地图样式 (街道/卫星)',
      'rock': '切换2D/3D视图模式',
      'voice_on': '打开语音识别功能',
      'swipe_up': '地图向北移动',
      'swipe_down': '地图向南移动',
      'swipe_left': '地图向西移动',
      'swipe_right': '地图向东移动',
      'pinch_out': '双手张开放大地图',
      'pinch_in': '双手合拢缩小地图'
    }
    return descriptions[gestureName] || '执行地图操作'
  }

  /**
   * 销毁命令处理器
   */
  destroy() {
    // 清理临时标记
    if (this.tempMarker) {
      this.tempMarker.remove()
      this.tempMarker = null
    }
    
    this.mapManager = null
    this.lastGesture = null
    this.lastGestureTime = 0
    this.continuousGestureState = {
      isActive: false,
      type: null,
      startTime: 0,
      lastUpdateTime: 0,
      multiplier: 1.0
    }
    
    console.log('🧹 GestureCommandProcessor: 已销毁')
  }
}
