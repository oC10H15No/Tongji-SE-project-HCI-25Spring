/**
 * MediaPipe Hands 模拟器
 * 用于演示手势识别功能，实际项目中应替换为真正的MediaPipe库
 */

// 模拟MediaPipe Hands配置
export const MediaPipeConfig = {
  HAND_CONNECTIONS: [
    [0, 1], [1, 2], [2, 3], [3, 4],      // 拇指
    [0, 5], [5, 6], [6, 7], [7, 8],      // 食指
    [0, 9], [9, 10], [10, 11], [11, 12], // 中指
    [0, 13], [13, 14], [14, 15], [15, 16], // 无名指
    [0, 17], [17, 18], [18, 19], [19, 20] // 小指
  ],
  
  LANDMARKS: {
    WRIST: 0,
    THUMB_CMC: 1, THUMB_MCP: 2, THUMB_IP: 3, THUMB_TIP: 4,
    INDEX_FINGER_MCP: 5, INDEX_FINGER_PIP: 6, INDEX_FINGER_DIP: 7, INDEX_FINGER_TIP: 8,
    MIDDLE_FINGER_MCP: 9, MIDDLE_FINGER_PIP: 10, MIDDLE_FINGER_DIP: 11, MIDDLE_FINGER_TIP: 12,
    RING_FINGER_MCP: 13, RING_FINGER_PIP: 14, RING_FINGER_DIP: 15, RING_FINGER_TIP: 16,
    PINKY_MCP: 17, PINKY_PIP: 18, PINKY_DIP: 19, PINKY_TIP: 20
  }
}

// 模拟手势数据生成器
export class MockGestureGenerator {
  constructor() {
    this.gesturePatterns = {
      fist: this.generateFistPattern(),
      open_palm: this.generateOpenPalmPattern(),
      point: this.generatePointPattern(),
      ok: this.generateOkPattern(),
      victory: this.generateVictoryPattern()
    }
  }

  /**
   * 生成握拳手势模式
   */
  generateFistPattern() {
    return {
      confidence: 0.9,
      landmarks: this.generateLandmarks({
        thumbClosed: true,
        indexClosed: true,
        middleClosed: true,
        ringClosed: true,
        pinkyClosed: true
      })
    }
  }

  /**
   * 生成张开手掌手势模式
   */
  generateOpenPalmPattern() {
    return {
      confidence: 0.95,
      landmarks: this.generateLandmarks({
        thumbOpen: true,
        indexOpen: true,
        middleOpen: true,
        ringOpen: true,
        pinkyOpen: true
      })
    }
  }

  /**
   * 生成指向手势模式
   */
  generatePointPattern() {
    return {
      confidence: 0.85,
      landmarks: this.generateLandmarks({
        thumbClosed: true,
        indexOpen: true,
        middleClosed: true,
        ringClosed: true,
        pinkyClosed: true
      })
    }
  }

  /**
   * 生成OK手势模式
   */
  generateOkPattern() {
    return {
      confidence: 0.8,
      landmarks: this.generateLandmarks({
        thumbTouch: true,
        indexTouch: true,
        middleOpen: true,
        ringOpen: true,
        pinkyOpen: true
      })
    }
  }

  /**
   * 生成V手势模式
   */
  generateVictoryPattern() {
    return {
      confidence: 0.88,
      landmarks: this.generateLandmarks({
        thumbClosed: true,
        indexOpen: true,
        middleOpen: true,
        ringClosed: true,
        pinkyClosed: true
      })
    }
  }

  /**
   * 生成手部关键点数据
   */
  generateLandmarks(fingerStates) {
    const landmarks = []
    
    // 手腕位置 (基准点)
    landmarks[0] = { x: 0.5, y: 0.8, z: 0 }
    
    // 拇指关键点
    if (fingerStates.thumbOpen) {
      landmarks[1] = { x: 0.4, y: 0.75, z: 0 }
      landmarks[2] = { x: 0.35, y: 0.7, z: 0 }
      landmarks[3] = { x: 0.3, y: 0.65, z: 0 }
      landmarks[4] = { x: 0.25, y: 0.6, z: 0 }
    } else if (fingerStates.thumbClosed) {
      landmarks[1] = { x: 0.45, y: 0.75, z: 0 }
      landmarks[2] = { x: 0.47, y: 0.73, z: 0 }
      landmarks[3] = { x: 0.49, y: 0.71, z: 0 }
      landmarks[4] = { x: 0.51, y: 0.69, z: 0 }
    }
    
    // 食指关键点
    if (fingerStates.indexOpen) {
      landmarks[5] = { x: 0.45, y: 0.7, z: 0 }
      landmarks[6] = { x: 0.45, y: 0.6, z: 0 }
      landmarks[7] = { x: 0.45, y: 0.5, z: 0 }
      landmarks[8] = { x: 0.45, y: 0.4, z: 0 }
    } else if (fingerStates.indexClosed) {
      landmarks[5] = { x: 0.45, y: 0.7, z: 0 }
      landmarks[6] = { x: 0.46, y: 0.65, z: 0 }
      landmarks[7] = { x: 0.47, y: 0.62, z: 0 }
      landmarks[8] = { x: 0.48, y: 0.6, z: 0 }
    }
    
    // 中指关键点
    if (fingerStates.middleOpen) {
      landmarks[9] = { x: 0.5, y: 0.7, z: 0 }
      landmarks[10] = { x: 0.5, y: 0.6, z: 0 }
      landmarks[11] = { x: 0.5, y: 0.5, z: 0 }
      landmarks[12] = { x: 0.5, y: 0.35, z: 0 }
    } else if (fingerStates.middleClosed) {
      landmarks[9] = { x: 0.5, y: 0.7, z: 0 }
      landmarks[10] = { x: 0.51, y: 0.65, z: 0 }
      landmarks[11] = { x: 0.52, y: 0.62, z: 0 }
      landmarks[12] = { x: 0.53, y: 0.6, z: 0 }
    }
    
    // 无名指关键点
    if (fingerStates.ringOpen) {
      landmarks[13] = { x: 0.55, y: 0.7, z: 0 }
      landmarks[14] = { x: 0.55, y: 0.6, z: 0 }
      landmarks[15] = { x: 0.55, y: 0.5, z: 0 }
      landmarks[16] = { x: 0.55, y: 0.4, z: 0 }
    } else if (fingerStates.ringClosed) {
      landmarks[13] = { x: 0.55, y: 0.7, z: 0 }
      landmarks[14] = { x: 0.54, y: 0.65, z: 0 }
      landmarks[15] = { x: 0.53, y: 0.62, z: 0 }
      landmarks[16] = { x: 0.52, y: 0.6, z: 0 }
    }
    
    // 小指关键点
    if (fingerStates.pinkyOpen) {
      landmarks[17] = { x: 0.6, y: 0.7, z: 0 }
      landmarks[18] = { x: 0.6, y: 0.6, z: 0 }
      landmarks[19] = { x: 0.6, y: 0.5, z: 0 }
      landmarks[20] = { x: 0.6, y: 0.45, z: 0 }
    } else if (fingerStates.pinkyClosed) {
      landmarks[17] = { x: 0.6, y: 0.7, z: 0 }
      landmarks[18] = { x: 0.59, y: 0.65, z: 0 }
      landmarks[19] = { x: 0.58, y: 0.62, z: 0 }
      landmarks[20] = { x: 0.57, y: 0.6, z: 0 }
    }
    
    return landmarks
  }

  /**
   * 获取随机手势
   */
  getRandomGesture() {
    const gestureNames = Object.keys(this.gesturePatterns)
    const randomName = gestureNames[Math.floor(Math.random() * gestureNames.length)]
    return {
      name: randomName,
      ...this.gesturePatterns[randomName],
      timestamp: Date.now()
    }
  }

  /**
   * 根据手势名称获取模拟数据
   */
  getGesturePattern(gestureName) {
    return this.gesturePatterns[gestureName] || null
  }
}

// 手势识别辅助函数
export class GestureUtils {
  /**
   * 计算两点之间的距离
   */
  static calculateDistance(point1, point2) {
    const dx = point1.x - point2.x
    const dy = point1.y - point2.y
    const dz = (point1.z || 0) - (point2.z || 0)
    return Math.sqrt(dx * dx + dy * dy + dz * dz)
  }

  /**
   * 判断手指是否伸直
   */
  static isFingerExtended(landmarks, fingerTip, fingerPip, fingerMcp) {
    if (!landmarks[fingerTip] || !landmarks[fingerPip] || !landmarks[fingerMcp]) {
      return false
    }
    
    // 简化的手指伸展判断：指尖Y坐标小于中间关节Y坐标
    return landmarks[fingerTip].y < landmarks[fingerPip].y
  }

  /**
   * 获取手部边界框
   */
  static getHandBoundingBox(landmarks) {
    if (!landmarks || landmarks.length === 0) {
      return null
    }
    
    let minX = Infinity, maxX = -Infinity
    let minY = Infinity, maxY = -Infinity
    
    landmarks.forEach(landmark => {
      if (landmark) {
        minX = Math.min(minX, landmark.x)
        maxX = Math.max(maxX, landmark.x)
        minY = Math.min(minY, landmark.y)
        maxY = Math.max(maxY, landmark.y)
      }
    })
    
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    }
  }

  /**
   * 规范化坐标（转换为像素坐标）
   */
  static normalizeCoordinates(landmarks, canvasWidth, canvasHeight) {
    return landmarks.map(landmark => {
      if (!landmark) return null
      
      return {
        x: landmark.x * canvasWidth,
        y: landmark.y * canvasHeight,
        z: landmark.z || 0
      }
    })
  }

  /**
   * 绘制手部关键点
   */
  static drawLandmarks(ctx, landmarks, connections = null) {
    if (!ctx || !landmarks) return
    
    // 绘制连接线
    if (connections) {
      ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)'
      ctx.lineWidth = 2
      ctx.beginPath()
      
      connections.forEach(([start, end]) => {
        if (landmarks[start] && landmarks[end]) {
          ctx.moveTo(landmarks[start].x, landmarks[start].y)
          ctx.lineTo(landmarks[end].x, landmarks[end].y)
        }
      })
      
      ctx.stroke()
    }
    
    // 绘制关键点
    landmarks.forEach((landmark, index) => {
      if (!landmark) return
      
      ctx.fillStyle = index === 0 ? 'red' : 'blue' // 手腕用红色，其他用蓝色
      ctx.beginPath()
      ctx.arc(landmark.x, landmark.y, 4, 0, 2 * Math.PI)
      ctx.fill()
    })
  }
}

// 导出默认配置
export default {
  MediaPipeConfig,
  MockGestureGenerator,
  GestureUtils
}
