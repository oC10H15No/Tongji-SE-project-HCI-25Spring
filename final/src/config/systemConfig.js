/**
 * 智能控制系统配置文件
 * 包含语音识别、手势控制、地图管理等相关配置
 */

// 应用基础配置
export const AppConfig = {
  name: '3D地图智能控制系统',
  version: '2.0.0',
  features: {
    voiceControl: true,
    gestureControl: true,
    searchFunction: true,
    mapInteraction: true
  }
}

// 地图配置
export const MapConfig = {
  mapbox: {
    token: 'pk.eyJ1IjoiZWpwcnhpczkiLCJhIjoiY21ieGIzeGY2MHNwMDJtcXdscWVxYmhzbCJ9.FsQ6WgRFA0kwzf_V6bE8yQ',
    style: 'mapbox://styles/mapbox/streets-v12',
    defaultCenter: [121.47004, 31.23136], // 上海
    defaultZoom: 12,
    defaultPitch: 60,
    defaultBearing: 0,
    minZoom: 1,
    maxZoom: 22
  },
  
  baidu: {
    apiKey: 'xcLR5JxC4gfB1bKd59rClWELDB8zfgKQ', // 替换为您的百度API密钥
    serviceUrl: 'https://api.map.baidu.com/place/v2/search'
  },
  
  features: {
    enable3D: true,
    enableTerrain: true,
    enableBuildings: true,
    enableNavigation: true,
    enableFullscreen: true,
    enableScale: true
  }
}

// 语音识别配置
export const VoiceConfig = {
  recognition: {
    lang: 'zh-CN',
    continuous: false,
    interimResults: true,
    maxAlternatives: 1
  },
  
  commands: {
    // 缩放命令
    zoom: {
      in: ['放大', '拉近', '变大', 'zoom in', '扩大'],
      out: ['缩小', '拉远', '变小', 'zoom out', '缩小']
    },
    
    // 移动命令
    movement: {
      up: ['向上', '上移', '北', '往北'],
      down: ['向下', '下移', '南', '往南'],
      left: ['向左', '左移', '西', '往西'],
      right: ['向右', '右移', '东', '往东']
    },
    
    // 搜索命令
    search: ['搜索', '查找', '找到', '去', '到', 'search'],
    
    // 定位命令
    location: ['定位', '我的位置', '当前位置', 'locate', '我在哪', '位置'],
    
    // 控制命令
    control: {
      reset: ['重置', '回到原点', '初始位置'],
      clear: ['清除', '清理', '删除标记', 'clear', '重置标记']
    }
  },
  
  settings: {
    preventDuplicateInterval: 2000, // 防重复命令间隔(毫秒)
    confidenceThreshold: 0.7, // 置信度阈值
    timeoutDuration: 15000 // 语音超时时间(毫秒)
  }
}

// 手势识别配置
export const GestureConfig = {
  recognition: {
    modelComplexity: 1,
    minDetectionConfidence: 0.8,
    minTrackingConfidence: 0.8,
    maxNumHands: 2
  },
  
  gestures: {
    // 基础手势
    basic: {
      fist: { name: '握拳', action: 'stop', emoji: '✊' },
      open_palm: { name: '张开手掌', action: 'reset', emoji: '✋' },
      point: { name: '指向', action: 'select', emoji: '👆' },
      ok: { name: 'OK手势', action: 'confirm', emoji: '👌' },
      victory: { name: 'V手势', action: 'zoom_in', emoji: '✌️' }
    },
    
    // 移动手势
    movement: {
      swipe_left: { name: '向左滑动', action: 'move_left', emoji: '👈' },
      swipe_right: { name: '向右滑动', action: 'move_right', emoji: '👉' },
      swipe_up: { name: '向上滑动', action: 'move_up', emoji: '👆' },
      swipe_down: { name: '向下滑动', action: 'move_down', emoji: '👇' }
    },
    
    // 缩放手势
    zoom: {
      zoom_in: { name: '双手张开', action: 'zoom_in', emoji: '🔍' },
      zoom_out: { name: '双手合拢', action: 'zoom_out', emoji: '🔍' }
    }
  },
  
  settings: {
    gestureTimeout: 1500, // 手势持续时间(毫秒)
    stabilityThreshold: 3, // 稳定性阈值(连续识别次数)
    continuousGestureMultiplier: 3, // 连续手势增强倍数
    showLandmarks: false, // 是否显示手部关键点
    enableContinuousMode: true // 是否启用连续手势模式
  }
}

// 搜索配置
export const SearchConfig = {
  providers: {
    mapbox: {
      enabled: true,
      baseUrl: 'https://api.mapbox.com/geocoding/v5/mapbox.places',
      limit: 10,
      language: 'zh'
    },
    
    baidu: {
      enabled: true,
      baseUrl: 'https://api.map.baidu.com/place/v2/search',
      pageSize: 10,
      region: '全国'
    }
  },
  
  settings: {
    defaultProvider: 'baidu', // 默认搜索提供商
    fallbackEnabled: true, // 是否启用备用搜索
    historySize: 20, // 搜索历史记录数量
    autoSaveHistory: true, // 是否自动保存搜索历史
    debounceDelay: 300 // 搜索防抖延迟(毫秒)
  },
  
  shortcuts: [
    { name: '餐厅', query: '餐厅', icon: '🍽️' },
    { name: '医院', query: '医院', icon: '🏥' },
    { name: '银行', query: '银行', icon: '🏦' },
    { name: '加油站', query: '加油站', icon: '⛽' },
    { name: '超市', query: '超市', icon: '🛒' },
    { name: '学校', query: '学校', icon: '🏫' }
  ]
}

// UI配置
export const UIConfig = {
  theme: {
    primaryColor: '#667eea',
    secondaryColor: '#764ba2',
    successColor: '#28a745',
    errorColor: '#dc3545',
    warningColor: '#ffc107',
    infoColor: '#17a2b8'
  },
  
  layout: {
    controlPanelWidth: 350,
    headerHeight: 70,
    mobileBreakpoint: 768
  },
  
  animations: {
    transitionDuration: 300,
    pulseInterval: 2000,
    fadeTimeout: 3000
  },
  
  feedback: {
    showSuccessMessages: true,
    showErrorMessages: true,
    autoHideDelay: 4000,
    maxSuggestions: 3
  }
}

// 性能配置
export const PerformanceConfig = {
  voice: {
    maxConcurrentSessions: 1,
    recordingBufferSize: 4096,
    processingInterval: 100
  },
  
  gesture: {
    frameRate: 30,
    processingInterval: 33, // ~30fps
    maxTrackingHistory: 10
  },
  
  map: {
    maxZoom: 22,
    minZoom: 1,
    animationDuration: 2000,
    buildingMinZoom: 15
  }
}

// 错误消息配置
export const ErrorMessages = {
  voice: {
    notSupported: '您的浏览器不支持语音识别功能',
    microphoneAccess: '无法访问麦克风，请检查权限设置',
    networkError: '网络错误，请检查网络连接',
    timeout: '语音识别超时，请重试',
    unknown: '语音识别发生未知错误'
  },
  
  gesture: {
    notSupported: '您的设备不支持手势识别功能',
    cameraAccess: '无法访问摄像头，请检查权限设置',
    lowLight: '光线不足，请改善照明条件',
    noHands: '未检测到手部，请将手放在摄像头前',
    unknown: '手势识别发生未知错误'
  },
  
  map: {
    loadFailed: '地图加载失败，请检查网络连接',
    tokenInvalid: 'Mapbox访问令牌无效',
    styleLoadError: '地图样式加载失败',
    unknown: '地图发生未知错误'
  },
  
  search: {
    noResults: '未找到相关地点，请尝试其他关键词',
    networkError: '搜索服务不可用，请稍后重试',
    apiKeyInvalid: 'API密钥无效或已过期',
    rateLimitExceeded: '请求过于频繁，请稍后重试',
    unknown: '搜索发生未知错误'
  }
}

// 帮助信息配置
export const HelpConfig = {
  voice: {
    title: '语音控制帮助',
    sections: [
      {
        title: '🎯 缩放控制',
        content: '说 "放大"、"缩小"、"拉近"、"拉远"'
      },
      {
        title: '🧭 移动地图',
        content: '说 "向上"、"向下"、"向左"、"向右" 或 "往北"、"往南"、"往东"、"往西"'
      },
      {
        title: '🔍 搜索地点',
        content: '说 "搜索北京"、"查找上海"、"去广州"'
      },
      {
        title: '📍 定位功能',
        content: '说 "定位"、"我的位置"、"当前位置"'
      },
      {
        title: '🔄 重置操作',
        content: '说 "重置"、"回到原点"、"清除"'
      }
    ]
  },
  
  gesture: {
    title: '手势控制帮助',
    sections: [
      {
        title: '🤚 基础手势',
        content: [
          '✊ 握拳 - 停止操作',
          '✋ 张开手掌 - 重置视图',
          '👆 指向 - 选择位置',
          '👌 OK手势 - 确认操作',
          '✌️ V手势 - 放大地图'
        ]
      },
      {
        title: '👈 移动手势',
        content: [
          '← 向左滑动 - 地图左移',
          '→ 向右滑动 - 地图右移',
          '↑ 向上滑动 - 地图上移',
          '↓ 向下滑动 - 地图下移'
        ]
      },
      {
        title: '💡 使用技巧',
        content: [
          '• 保持手部在摄像头视野内',
          '• 手势动作要清晰明确',
          '• 避免快速连续的相同手势',
          '• 光线充足时识别效果更好'
        ]
      }
    ]
  }
}

// 导出所有配置
export default {
  AppConfig,
  MapConfig,
  VoiceConfig,
  GestureConfig,
  SearchConfig,
  UIConfig,
  PerformanceConfig,
  ErrorMessages,
  HelpConfig
}
