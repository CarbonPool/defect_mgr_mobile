# 用户登录
POST /api/login

## 参数
- username(string): 登录用户名
- password(string): 登录密码，(md5加密后的字符串）

## 返回
{
  code: number; //状态码(200: 成功, 1001： 用户名或密码错误)
  data: {
    accessToken: string; // 访问令牌，用于后续 API 请求鉴权 (通常放在 Authorization Header)
    refreshToken: string; // 刷新令牌，用于 accessToken 过期后无感刷新
    user: {
      uid: string; // 用户唯一ID
      createdTime: string; // 账号创建时间
      updateTime: string; // 最后更新时间
      username: string; // 登录用户名
      realname: string | null; // 真实姓名
      sex: 'MALE' | 'FEMALE' | 'UNKNOWN'; // 性别
      mobile: string | null; // 手机号
      email: string | null; // 邮箱
      address: string | null; // 地址
      pic: string | null; // 头像地址
      lastLoginTime: string; // 最后登录时间
      roles: {
        [roleCode: string]: string; // 角色键值对，例如 { "USER": "用户" }
      };
      menus: string[]; // 菜单路径数组，用于前端动态路由渲染
      permissions: string[]; // 细粒度权限标识符数组，用于按钮级权限控制
      status: 'NORMAL' | 'BANNED' | 'DISABLED'; // 账号状态
    };
  };

}

# 用户注册
POST /api/register

## 参数
- username(string): 登录用户名
- password(string): 登录密码（字母+数字+特殊符号 长度不少于8位）
- passwordYes(string): 确认密码

## 返回
{
  code: number; //状态码(200: 成功)
  data: {
    uid: string; //用户id
    createdTime: string; //创建时间，如(2026-04-23 09:51:03)
  },
  msg: string; //接口中文消息,如("成功");
  time: number; //时间戳,如1776909063411
}

# 获取用户信息
GET /api/userInfo

## 参数
- .(string):  登录token签名

## 返回
interface UserInfoResponse {
  code: number; // 状态码 (200: 成功)
  msg: string; // 提示消息
  time: number; // 响应时间戳 (毫秒)
  data: {
    uid: string; // 用户唯一ID
    createdTime: string; // 账号创建时间 (YYYY-MM-DD HH:mm:ss)
    updateTime: string; // 最后更新时间
    username: string; // 用户名/登录账号
    realname: string | null; // 真实姓名
    sex: 'MALE' | 'FEMALE' | 'UNKNOWN'; // 性别
    mobile: string | null; // 手机号码
    email: string | null; // 电子邮箱
    address: string | null; // 联系地址
    pic: string | null; // 用户头像URL
    lastLoginTime: string; // 最后登录时间
    roles: {
      [key: string]: string; // 角色映射表，例如 {"USER": "用户"}
    };
    menus: string[]; // 菜单权限列表 (路由路径数组)
    permissions: string[]; // 具体操作权限码数组 (如 "dataset:create")
    status: 'NORMAL' | 'BANNED' | 'DISABLED'; // 账号状态
  };
}

# 获取项目列表
GET /api/projects

## 参数
- .(string):  登录token签名
- page(int): 从第几页开始
- size(int): 获取数量(获取全部可以写999)
- ?sort(string): 排序（例如填写"uid,Desc")

## 返回
interface ProjectListResponse {
  code: number; // 状态码 (200: 成功)
  msg: string; // 提示消息
  time: number; // 响应时间戳
  data: {
    page: number; // 当前页码
    size: number; // 每页条数
    count: number; // 总记录数
    list: Array<{
      uid: string; // 项目唯一ID
      createdTime: string; // 项目创建时间
      updateTime: string; // 项目更新时间
      name: string; // 项目名称 (如: CMT-Defect detection project)
      code: string; // 项目自定义编码
      status: 'ENABLE' | 'DISABLE'; // 项目启用/禁用状态
      productEntity: {
        uid: string; // 所属产品ID
        createdTime: string; // 产品创建时间
        updateTime: string; // 产品更新时间
        name: string; // 产品名称 (如: 大圆机)
        models: string[]; // 该产品关联的模型算法列表 (如: ["yolov7x..."])
      };
    }>;
  };
}

# 获取所有设备列表
GET /api/projects/equipments

## 参数
- ?projectId(string): 项目ID
- .(string):  登录token签名
- page(int): 从第几页开始
- size(int): 获取数量(获取全部可以写999)
- ?sort(string): 排序（例如填写"uid,Desc")

## 返回
/**
 * 设备列表完整响应结构
 */
interface DeviceListResponse {
  code: number; // 状态码
  msg: string; // 提示消息
  time: number; // 响应时间戳
  data: {
    page: number; // 当前页码
    size: number; // 每页条数
    count: number; // 总记录数
    list: Array<{
      uid: string; // 设备唯一ID
      createdTime: string; // 创建时间
      updateTime: string; // 更新时间
      snCode: string; // 设备序列号
      name: string; // 设备名称
      place: string; // 部署地点
      status: 'ENABLE' | 'DISABLE'; // 设备启用状态
      online: boolean; // 是否在线
      state: string; // 设备健康状态 (如: NORMAL)
      message: string; // 状态描述消息
      project: {
        uid: string; // 项目唯一ID
        createdTime: string;
        updateTime: string;
        name: string; // 项目名称
        code: string; // 项目编码
        status: string; // 项目状态
        productEntity: {
          uid: string; // 产品ID
          createdTime: string;
          updateTime: string;
          name: string; // 产品名称 (如: 大圆机)
          models: string[]; // 模型列表
        };
      };
      device: any | null; // 备用设备信息
      vpnIp: string; // VPN IP地址
      vpnStatus: 'ON' | 'OFF'; // VPN 状态
      masterVersion: string; // 主程序版本
      algVersion: string; // 算法版本
      hardwareVersion: string; // 硬件版本
      others: {
        platform: string; // 平台
        speed: number; // 运行速度
        network: number; // 网络信号
        status: string; // 运行状态
      };
    }>;
  };
}

# 获取指定设备缺陷统计
GET /api/dyj/equipment/statistics/defect

##参数
- .(string):  登录token签名
- startTime(int):  查询开始时间，时间戳(例:1776614400000)
- endTime(int):  查询结束时间，时间戳(例: 1776700799999)
- snCode(string): 设备标识码

## 返回
interface ApiResponse {
  time: number;
  data: {
    snCode: string; ##设备标识码
    stopNgDataCount: number; ##不停机缺陷
    normalNgDataCount: number; ## 停机缺陷
  };
  errorCode: number;
  errorMessage: string | null;
}

# 获取指定设备缺陷历史记录
GET /api/dyj/data/ng

- .(string):  登录token签名
- page(int): 从第几页开始
- size(int): 获取数量
- equipmentId(string)：设备ID
- key(string): 缺陷原因，可选，参考缺陷原因
- startTime(int, 可选): 查询开始时间，毫秒时间戳，一般取当日 00:00:00.000
- endTime(int, 可选): 查询结束时间，毫秒时间戳，一般取当日 23:59:59.999

interface DetectionRecordResponse {
  time: number; // 响应时间戳
  errorCode: number; // 错误代码 (0 表示成功)
  errorMessage: string | null; // 错误信息描述
  data: {
    page: number; // 当前页码
    size: number; // 每页条数
    totalCount: number; // 总记录条数
    list: Array<{
      uid: string; // 记录唯一ID
      projectUid: string; // 关联的项目ID
      equipmentUid: string; // 关联的设备ID
      snCode: string; // 设备序列号
      cameraNumber: string; // 摄像头编号 (如: "0")
      productionCode: string; // 生产批次代码(生产编号)
      operatorId: string; // 操作员ID(工人编号)
      stopType: string; // 停机类型描述 (如: "不是")
      imageUrl: string; // 检测图片相对路径
      ngReason: string; // 停机原因/NG原因代码 (如:"2"，也可能多种，如："0-1")
      startTime: string; // 检测开始时间 (YYYY-MM-DD HH:mm:ss)
      isStop: boolean; // 是否触发停机 (true: 停机, false: 未停机)
    }>;
  };
}

# 缺陷原因code对照表
- 0：坏针
- 1：破洞
- 2：横条
- 3：漏针
- 4：飞花
- 5：下布线
- 6：油针
- 7：褶皱

# 机器管理状态判断
- 在线：online = true
- 空闲: others.status="idle"
- 检测中：others.status="detect"
- 异常或错误：others.status="err"
- 摄像头异常：others.status="err" && others没有cameras属性

# 统计接口
GET /api/dyj/data/statistical

## 参数
- equipmentId(string)：设备ID

interface Response {
  time: number; // 响应时间戳
  errorCode: number; // 错误代码 (0 表示成功)
  errorMessage: string | null; // 错误信息描述
  data: {
    todayNgReasonStatistical: Array<{
      ngReason: string; // 停机原因/NG原因代码 (如:"2"，也可能多种，如："0-1"),
      count: int; // 停机数量
    }>;
    thisWeekNgReasonStatistical: Array<{
      ngReason: string; // 停机原因/NG原因代码 (如:"2"，也可能多种，如："0-1"),
      count: int; // 停机数量
    }>;
    thisMonthNgReasonStatistical: Array<{
      ngReason: string; // 停机原因/NG原因代码 (如:"2"，也可能多种，如："0-1"),
      count: int; // 停机数量
    }>;
  };
}