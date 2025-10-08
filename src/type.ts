/**
 * 漫展数据接口
 */
export interface ConventionEvent {
  /** 展会ID */
  id: number;
  /** 展会名称 */
  name: string;
  /** 标签 */
  tag: string;
  /** 地区 */
  location: string;
  /** 详细地址 */
  address: string;
  /** 展会链接 */
  url: string;
  /** 展会类型 */
  type: string;
  /** 想去的人数 */
  wannaGoCount: number;
  /** 社团数 */
  circleCount: number;
  /** 同人作品数 */
  doujinshiCount: number;
  /** 展会时间 */
  time: string;
  /** APP Logo图片地址 */
  appLogoPicUrl: string;
  /** Logo图片地址 */
  logoPicUrl: string;
  /** 是否结束 */
  ended: string;
  /** 是否线上 */
  isOnline: string;
  /** 查询关键词（可选，仅在一键查询时包含） */
  keyword?: string;
}

/**
 * API响应接口
 */
export interface ConventionApiResponse {
  /** 状态码 */
  code: number;
  /** 消息 */
  msg: string;
  /** 数据列表 */
  data: ConventionEvent[];
}
