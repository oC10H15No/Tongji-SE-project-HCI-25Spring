const RGB_EXPERIMENTAL = 'rgb(52, 152, 219)';
const RGB_TEACHING = 'rgb(46, 204, 113)';
const RGB_OFFICE = 'rgb(231, 76, 60)';


const roomsData = [
  {
    "id": "401",
    "name": "学生活动中心",
    "type": "实验区",
    "position": {
      "x": 1700,
      "y": 950
    },
    "marker": {
      "radius": 6,
      "color": RGB_EXPERIMENTAL,
      "label": "401"
    },
    "purpose": "娱乐中心",
    "personnel": [],
    "description": "学生活动中心，提供学生休闲娱乐设施，包括台球桌、乒乓球桌、健身器材等。",
    "images": ["images/401.jpg"]
  },
  {
    "id": "436",
    "name": "软件角",
    "type": "教学区",
    "position": {
      "x": 786,
      "y": 280
    },
    "marker": {
      "radius": 6,
      "color": RGB_TEACHING,
      "label": "436"
    },
    "purpose": "阅读区",
    "personnel": [],
    "description": "软件角，提供丰富的阅读材料和舒适的阅读环境。",
    "images": ["images/436.jpg"]
  },
  {
    "id": "438",
    "name": "学生活动中心",
    "type": "教学区",
    "position": {
      "x": 660,
      "y": 500
    },
    "marker": {
      "radius": 6,
      "color": RGB_TEACHING,
      "label": "438"
    },
    "purpose": "休闲中心",
    "personnel": [],
    "description": "学生活动中心，提供学生休闲娱乐设施，包括钢琴、象棋等。",
    "images": ["images/438.jpg"]
  },
  {
    "id": "407",
    "name": "407",
    "type": "实验区",
    "position": {
      "x": 1360,
      "y": 896
    },
    "marker": {
      "radius": 6,
      "color": RGB_EXPERIMENTAL,
      "label": "407"
    },
    "purpose": "实验室",
    "personnel": [
      {
        "name": "陈梁",
        "title": "实验中心负责人",
        "responsibility": "负责实验室管理和实验教学工作"
      },
      {
        "name": "严海州",
        "title": "实验室安全负责人",
        "responsibility": "负责实验室安全管理"
      },
      {
        "name": "叶珂男",
        "title": "实验室安全员",
        "responsibility": "负责实验室安全巡查"
      }
    ],
    "description": "研究生工作室：机电类实验室，提供实验设备和研究空间。",
    "images": ["images/407-1.jpg", "images/407-2.jpg"]
  },
  {
    "id": "408",
    "name": "408",
    "type": "实验区",
    "position": {
      "x": 1438,
      "y": 1104
    },
    "marker": {
      "radius": 6,
      "color": RGB_EXPERIMENTAL,
      "label": "408"
    },
    "purpose": "实验室",
    "personnel": [],
    "description": "研究生工作室",
    "images": ["images/408R-1.jpg", "images/408R-2.jpg"]
  },
  {
    "id": "409",
    "name": "409",
    "type": "实验区",
    "position": {
      "x": 1235,
      "y": 950
    },
    "marker": {
      "radius": 6,
      "color": RGB_EXPERIMENTAL,
      "label": "409"
    },
    "purpose": "实验室",
    "personnel": [
      {
        "name": "陈梁",
        "title": "实验中心负责人",
        "responsibility": "负责实验室管理和实验教学工作"
      },
      {
        "name": "朱亚萍",
        "title": "实验室安全负责人",
        "responsibility": "负责实验室安全管理"
      },
      {
        "name": "杜庆峰",
        "title": "实验室安全负责人",
        "responsibility": "负责实验室安全管理"
      },
      {
        "name": "代玉琢",
        "title": "实验室安全员",
        "responsibility": "负责实验室安全巡查"
      },
      {
        "name": "韩永琦",
        "title": "实验室安全员",
        "responsibility": "负责实验室安全巡查"
      }
    ],
    "description": "研究生工作室：机电类实验室，提供实验设备和研究空间。",
    "images": ["images/409L.jpg", "images/409R.jpg", "images/409-2.jpg"]
  },
  {
    "id": "410",
    "name": "410",
    "type": "实验区",
    "position": {
      "x": 1363,
      "y": 1132
    },
    "marker": {
      "radius": 6,
      "color": RGB_EXPERIMENTAL,
      "label": "410"
    },
    "purpose": "教研室",
    "personnel": [
      {
        "name": "王冬青",
        "title": "讲师",
        "responsibility": "嵌入式系统 计算机网络 移动通讯"
      },      
      {
        "name": "李江峰",
        "title": "副教授",
        "responsibility": "主要研究方向为人工智能、区块链、云计算等。"
      },      
      {
        "name": "夏波涌",
        "title": "讲师",
        "responsibility": "研究方向：图像理解 智能信号处理 网络通信"
      },      
      {
        "name": "张颖",
        "title": "副教授",
        "responsibility": "主要研究无人机的智能计算系统(采用集成芯粒)和零日漏洞挖掘等相关技术"
      }
    ],
    "description": "教研室，提供教师办公和教研活动空间。",
    "images": ["images/410.jpg"]
  },
  {
    "id": "411",
    "name": "软件学院历史角",
    "type": "实验区",
    "position": {
      "x": 1104,
      "y": 930
    },
    "marker": {
      "radius": 6,
      "color": RGB_EXPERIMENTAL,
      "label": "411"
    },
    "purpose": "历史资料展示",
    "personnel": [],
    "description": "软件学院历史角，展示软件学院的发展历程和重要事件。",
    "images": ["images/411.jpg"]
  },
  {
    "id": "412",
    "name": "412",
    "type": "实验区",
    "position": {
      "x": 1260,
      "y": 1172
    },
    "marker": {
      "radius": 6,
      "color": RGB_EXPERIMENTAL,
      "label": "412"
    },
    "purpose": "教研室",
    "personnel": [
      {
        "name": "刘岩",
        "title": "副教授",
        "responsibility": "研究方向：虚拟企业的服务识别方法与架构模式 Web应用技术 软件系统理解 重构与再工程"
      },
      {
        "name": "张惠娟",
        "title": "副教授",
        "responsibility": "研究方向：嵌入式系统 3G网络平台 移动平台软件 实时系统"
      },
      {
        "name": "孙萍",
        "title": "副教授",
        "responsibility": "研究方向：数据分析/数据挖掘 Web服务/工作流 数据库理论"
      },
      {
        "name": "罗怡桂",
        "title": "副教授",
        "responsibility": "研究方向：智能驾驶 嵌入式系统 软硬件协同设计"
      }
    ],
    "description": "教研室，提供教师办公和教研活动空间。",
    "images": ["images/412L.jpg", "images/412.jpg"]
  },
  {
    "id": "414",
    "name": "414",
    "type": "实验区",
    "position": {
      "x": 933,
      "y": 1165
    },
    "marker": {
      "radius": 6,
      "color": RGB_EXPERIMENTAL,
      "label": "414"
    },
    "purpose": "",
    "personnel": [],
    "description": "",
    "images": ["images/414.jpg"]
  },
  {
    "id": "416",
    "name": "416",
    "type": "实验区",
    "position": {
      "x": 760,
      "y": 1080
    },
    "marker": {
      "radius": 6,
      "color": RGB_EXPERIMENTAL,
      "label": "416"
    },
    "purpose": "多媒体教学机房",
    "personnel": [
          {
              "name": "杨旻",
              "title": "课题组负责人",
              "responsibility": "负责多媒体教学机房的管理和维护"
          },
          {
              "name": "严海州",
              "title": "安全责任人",
              "responsibility": "负责多媒体教学机房的安全管理"
          }
    ],
    "description": "多媒体教学机房，提供多媒体教学设备和环境。",
    "images": ["images/416-1.jpg", "images/416-2.jpg"]
  },
  {
    "id": "417",
    "name": "417",
    "type": "实验区",
    "position": {
      "x": 840,
      "y": 900
    },
    "marker": {
      "radius": 6,
      "color": RGB_EXPERIMENTAL,
      "label": "417"
    },
    "purpose": "会议室",
    "personnel": [],
    "description": "会议室，提供可容纳约20人的会议空间，配有投影仪和白板。",
    "images": ["images/417.jpg"]
  },
  {
    "id": "418",
    "name": "418",
    "type": "实验区",
    "position": {
      "x": 602,
      "y": 990
    },
    "marker": {
      "radius": 6,
      "color": RGB_EXPERIMENTAL,
      "label": "418"
    },
    "purpose": "教授办公室",
    "personnel": [
        {
            "name": "张林",
            "title": "教授",
            "responsibility": "研究方向：计算机视觉 机器视觉 机器学习 环境感知与理解"
        },
        {
            "name": "江建慧",
            "title": "教授",
            "responsibility": "研究方向：可信赖系统与网络 软件可靠性工程 VLSI/SoC测试与容错 性能评测与设计优化"
        },
        {
            "name": "刘琴",
            "title": "教授",
            "responsibility": "研究方向：交叉学科深度学习网络研究 异构数据相关性分析 人工智能系统测试方法"
        }
    ],
    "description": "教授办公室，提供教授办公和研究空间。",
    "images": ["images/418L.jpg", "images/418R.jpg", "images/418R-2.jpg"]
  },
  {
    "id": "419",
    "name": "419",
    "type": "实验区",
    "position": {
      "x": 692,
      "y": 814
    },
    "marker": {
      "radius": 6,
      "color": RGB_EXPERIMENTAL,
      "label": "419"
    },
    "purpose": "实验室",
    "personnel": [
      {
        "name": "陈梁",
        "title": "实验中心负责人",
        "responsibility": "负责实验室管理和实验教学工作"
      },
      {
        "name": "张晶",
        "title": "实验室安全负责人",
        "responsibility": "负责实验室安全管理"
      }
    ],
    "description": "教学实验室，提供实验设备和教学空间。",
    "images": ["images/419-1.jpg", "images/419-2.jpg", "images/419-3.jpg"]
  },
  {
    "id": "426",
    "name": "426",
    "type": "教学区",
    "position": {
      "x": 380,
      "y": 716
    },
    "marker": {
      "radius": 6,
      "color": RGB_TEACHING,
      "label": "426"
    },
    "purpose": "教学机房",
    "personnel": [
        {
            "name": "陈梁",
            "title": "实验中心负责人",
            "responsibility": "负责教学机房的管理和维护"
        },
        {
            "name": "杨旻",
            "title": "实验室安全负责人",
            "responsibility": "负责教学机房的安全管理"
        }
    ],
    "description": "教学机房，提供教学设备和环境。",
    "images": ["images/426-1.jpg", "images/426-2.jpg"]
  },
  {
    "id": "428",
    "name": "428",
    "type": "教学区",
    "position": {
      "x": 432,
      "y": 624
    },
    "marker": {
      "radius": 6,
      "color": RGB_TEACHING,
      "label": "428"
    },
    "purpose": "服务器机房",
    "personnel": [
        {
            "name": "杨旻",
            "title": "课题组负责人",
            "responsibility": "负责服务器机房的管理和维护"
        },
        {
            "name": "严海州",
            "title": "安全责任人",
            "responsibility": "负责服务器机房的安全管理"
        }
    ],
    "description": "服务器机房，提供服务器设备和环境。",
    "images": ["images/428-1.jpg", "images/428-2.jpg"]
  },
  {
    "id": "430",
    "name": "430",
    "type": "教学区",
    "position": {
      "x": 530,
      "y": 484
    },
    "marker": {
      "radius": 6,
      "color": RGB_TEACHING,
      "label": "430"
    },
    "purpose": "教学机房",
    "personnel": [
        {
            "name": "陈梁",
            "title": "实验中心负责人",
            "responsibility": "负责教学机房的管理和维护"
        },
        {
            "name": "杨旻",
            "title": "实验室安全负责人",
            "responsibility": "负责教学机房的安全管理"
        }
    ],
    "description": "教学机房，提供教学设备和环境。",
    "images": ["images/430-1.jpg", "images/430-2.jpg"]
  },
  {
    "id": "432",
    "name": "432",
    "type": "教学区",
    "position": {
      "x": 620,
      "y": 305
    },
    "marker": {
      "radius": 6,
      "color": RGB_TEACHING,
      "label": "432"
    },
    "purpose": "党员之家",
    "personnel": [],
    "description": "软件学院党员之家，提供党员党建活动和学习空间。",
    "images": ["images/432-1.jpg", "images/432-2.jpg"]
  },
  {
    "id": "434",
    "name": "434",
    "type": "教学区",
    "position": {
      "x": 650,
      "y": 254
    },
    "marker": {
      "radius": 6,
      "color": RGB_TEACHING,
      "label": "434"
    },
    "purpose": "教室",
    "personnel": [],
    "description": "教室，提供可容纳约50人的教学和学习空间。",
    "images": ["images/434-1.jpg", "images/434-2.jpg"]
  },
  {
    "id": "442L",
    "name": "442L",
    "type": "办公区",
    "position": {
      "x": 820,
      "y": 400
    },
    "marker": {
      "radius": 6,
      "color": RGB_OFFICE,
      "label": "442"
    },
    "purpose": "教务办公室",
    "personnel": [
        {
          "name": "刘梦露",
          "responsibility": "本科教务"
        },
        {
          "name": "李慧敏",
          "responsibility": "教务"
        },
        {
          "name": "王彩霞",
          "responsibility": "本科教务"
        },
        {
          "name": "杨丹",
          "responsibility": "研究生教务"
        },
        {
          "name": "姚仕仪",
          "responsibility": "研究生教务、质管员"
        }
    ],
    "description": "教务办公室，负责教学管理和教务工作。",
    "images": ["images/442L.jpg"]
  },
    {
    "id": "442R",
    "name": "442R",
    "type": "办公区",
    "position": {
      "x": 860,
      "y": 430
    },
    "marker": {
      "radius": 6,
      "color": RGB_OFFICE,
      "label": "442"
    },
    "purpose": "学院办公室",
    "personnel": [
      {
        "name": "闫鹏",
        "responsibility": "综合、人事人才"
      },
      {
        "name": "张晶",
        "title": "工程师",
        "responsibility": "OA、宣传、安全"
      },
      {
        "name": "林伊凡",
        "title": "",
        "responsibility": "科研"
      },
      {
        "name": "张晓雅",
        "title": "",
        "responsibility": "人事人才"
      },
      {
        "name": "钱银飞",
        "title": "",
        "responsibility": "财务、非全日制硕士"
      },
      {
        "name": "王昊榕",
        "title": "",
        "responsibility": ""
      },
      {
        "name": "俞晓静",
        "title": "",
        "responsibility": "博士后、科研管理、其他"
      }
    ],
    "description": "学院办公室，负责学院日常行政事务和协调工作。",
    "images": ["images/442R.jpg"]
  },
  {
    "id": "443",
    "name": "443",
    "type": "办公区",
    "position": {
      "x": 1040,
      "y": 372
    },
    "marker": {
      "radius": 6,
      "color": RGB_OFFICE,
      "label": "443"
    },
    "purpose": "实验中心",
    "personnel": [
        {
            "name": "陈梁",
        },
        {
            "name": "杨旻",
        },
        {
            "name": "严海州",
            "title": "工程师",
            "responsibility": "研究方向：Linux 平台应用开发、嵌入式系统、IT 服务管理"
        }
    ],
    "description": "实验中心，负责实验室管理和实验教学工作。",
    "images": ["images/443-1.jpg", "images/443-2.jpg"]
  },
  {
    "id": "444",
    "name": "444",
    "type": "办公区",
    "position": {
      "x": 916,
      "y": 462
    },
    "marker": {
      "radius": 6,
      "color": RGB_OFFICE,
      "label": "444"
    },
    "purpose": "档案室",
    "personnel": [],
    "description": "档案室，负责软件学院档案的管理和存储。",
    "images": ["images/444-1.jpg", "images/444-2.jpg"]
  },
  {
    "id": "441",
    "name": "441",
    "type": "办公区",
    "position": {
      "x": 962,
      "y": 326
    },
    "marker": {
      "radius": 6,
      "color": RGB_OFFICE,
      "label": "441"
    },
    "purpose": "会议室",
    "personnel": [],
    "description": "会议室，配备投影仪、白板等会议设备，供系部会议、学术交流等使用。",
    "images": ["images/441-1.jpg", "images/441-2.jpg"]
  },
  {
    "id": "446",
    "name": "446",
    "type": "办公区",
    "position": {
      "x": 990,
      "y": 502
    },
    "marker": {
      "radius": 6,
      "color": RGB_OFFICE,
      "label": "446"
    },
    "purpose": "学生工作办公室",
    "personnel": [
        {
            "name": "张砚秋",
            "title": "",
            "responsibility": "主任"
        },
        {
            "name": "丁瑞庭",
            "title": "",
            "responsibility": "辅导员"
        },
        {
            "name": "葛蕾",
            "title": "",
            "responsibility": "辅导员"
        },
        {
            "name": "焦嘉欣",
            "title": "",
            "responsibility": "辅导员"
        },
        {
            "name": "钟梦莹",
            "title": "",
            "responsibility": "辅导员"
        },
        {
            "name": "陈璞皎",
            "title": "",
            "responsibility": "辅导员"
        }
    ],
    "description": "学生工作办公室，负责学生工作整体协调。",
    "images": ["images/446-1.jpg", "images/446-2.jpg"]
  },
  {
    "id": "448",
    "name": "448",
    "type": "办公区",
    "position": {
      "x": 1070,
      "y": 530
    },
    "marker": {
      "radius": 6,
      "color": RGB_OFFICE,
      "label": "448"
    },
    "purpose": "副书记办公室",
    "description": "副书记办公室，负责学院党委工作。",
    "personnel": [
        {
          "name": "陈荣",
          "title": "副书记",
          "responsibility": "负责学院党委工作"
        },
        {
          "name": "吴晓培",
          "title": "副书记",
          "responsibility": "负责学院党委工作"
        },
        {
          "name": "宋井宽",
          "title": "院务助理",
          "responsibility": "协助副书记工作"
        }
    ],
    "images": ["images/448-1.jpg", "images/448-2.jpg", "images/448-3.jpg", "images/448-4.jpg"]
  },
  {
    "id": "450",
    "name": "450",
    "type": "办公区",
    "position": {
      "x": 1198,
      "y": 534
    },
    "marker": {
      "radius": 6,
      "color": RGB_OFFICE,
      "label": "450"
    },
    "purpose": "院长办公室 & 党委书记办公室",
    "personnel": [
        {
            "name": "申恒涛",
            "title": "院长",
            "responsibility": "负责学院整体工作"
        },
        {
            "name": "熊岚",
            "title": "党委书记",
            "responsibility": "负责学院党委工作"
        }
    ],
    "description": "院长/党委书记办公室，提供办公和会议空间。",
    "images": ["images/450R.jpg", "images/450L.jpg"]
  },
  {
    "id": "451",
    "name": "451",
    "type": "办公区",
    "position": {
      "x": 1210,
      "y": 376
    },
    "marker": {
      "radius": 6,
      "color": RGB_OFFICE,
      "label": "451"
    },
    "purpose": "副院长办公室",
    "personnel": [
        {
            "name": "王成",
            "title": "副院长",
            "responsibility": "负责行政事务协调"
        },
        {
            "name": "何良华",
            "title": "副院长",
            "responsibility": "负责行政事务协调"
        },
        {
            "name": "张林",
            "title": "副院长",
            "responsibility": "负责行政事务协调"
        }
    ],
    "description": "副院长办公室，提供副院长办公和会议空间。",
    "images": ["images/451-1.jpg", "images/451-2.jpg", "images/451-3.jpg"]
  },
  {
    "id": "455",
    "name": "455",
    "type": "办公区",
    "position": {
      "x": 1388,
      "y": 282
    },
    "marker": {
      "radius": 6,
      "color": RGB_OFFICE,
      "label": "455"
    },
    "purpose": "会议室",
    "personnel": [],
    "description": "会议室，配备投影仪、白板等会议设备，供系部会议、学术交流等使用。",
    "images": ["images/455-1.jpg", "images/455-2.jpg"]
  },
  {
    "id": "456",
    "name": "456",
    "type": "办公区",
    "position": {
      "x": 1434,
      "y": 406
    },
    "marker": {
      "radius": 6,
      "color": RGB_OFFICE,
      "label": "456"
    },
    "purpose": "党委办公室",
    "personnel": [
        {
            "name": "周微微",
        },
        {
            "name": "陆凤兰",
        },
        {
            "name": "赵清理",
        }
    ],
    "description": "党委办公室，负责学院党委工作。",
    "images": ["images/456.jpg"]
  }
];