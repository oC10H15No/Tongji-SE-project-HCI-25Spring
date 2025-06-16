/**
 * 坐标转换工具 - 百度坐标系(BD09)与WGS84坐标系互转
 */

const PI = Math.PI;
const X_PI = PI * 3000.0 / 180.0;

/**
 * 百度坐标系 (BD-09) 与 火星坐标系 (GCJ-02)的转换
 * 即 百度 转 谷歌、高德
 * @param {number} lng - 经度
 * @param {number} lat - 纬度
 * @returns {Array} [lng, lat]
 */
function bd09ToGcj02(lng, lat) {
  const x = lng - 0.0065;
  const y = lat - 0.006;
  const z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * X_PI);
  const theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * X_PI);
  const gcjLng = z * Math.cos(theta);
  const gcjLat = z * Math.sin(theta);
  return [gcjLng, gcjLat];
}

/**
 * 火星坐标系 (GCJ-02) 转换为 百度坐标系 (BD-09)
 * 即谷歌、高德 转 百度
 * @param {number} lng - 经度
 * @param {number} lat - 纬度
 * @returns {Array} [lng, lat]
 */
function gcj02ToBd09(lng, lat) {
  const z = Math.sqrt(lng * lng + lat * lat) + 0.00002 * Math.sin(lat * X_PI);
  const theta = Math.atan2(lat, lng) + 0.000003 * Math.cos(lng * X_PI);
  const bdLng = z * Math.cos(theta) + 0.0065;
  const bdLat = z * Math.sin(theta) + 0.006;
  return [bdLng, bdLat];
}

/**
 * WGS84转GCJ02
 * @param {number} lng - 经度
 * @param {number} lat - 纬度
 * @returns {Array} [lng, lat]
 */
function wgs84ToGcj02(lng, lat) {
  const a = 6378245.0;
  const ee = 0.00669342162296594323;
  
  let dLat = transformLat(lng - 105.0, lat - 35.0);
  let dLng = transformLng(lng - 105.0, lat - 35.0);
  
  const radLat = lat / 180.0 * PI;
  let magic = Math.sin(radLat);
  magic = 1 - ee * magic * magic;
  const sqrtMagic = Math.sqrt(magic);
  
  dLat = (dLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * PI);
  dLng = (dLng * 180.0) / (a / sqrtMagic * Math.cos(radLat) * PI);
  
  const mgLat = lat + dLat;
  const mgLng = lng + dLng;
  
  return [mgLng, mgLat];
}

/**
 * GCJ02 转换为 WGS84
 * @param {number} lng - 经度
 * @param {number} lat - 纬度
 * @returns {Array} [lng, lat]
 */
function gcj02ToWgs84(lng, lat) {
  const a = 6378245.0;
  const ee = 0.00669342162296594323;
  
  let dLat = transformLat(lng - 105.0, lat - 35.0);
  let dLng = transformLng(lng - 105.0, lat - 35.0);
  
  const radLat = lat / 180.0 * PI;
  let magic = Math.sin(radLat);
  magic = 1 - ee * magic * magic;
  const sqrtMagic = Math.sqrt(magic);
  
  dLat = (dLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * PI);
  dLng = (dLng * 180.0) / (a / sqrtMagic * Math.cos(radLat) * PI);
  
  const mgLat = lat - dLat;
  const mgLng = lng - dLng;
  
  return [mgLng, mgLat];
}

/**
 * 百度坐标系(BD09)转WGS84
 * @param {number} lng - 经度
 * @param {number} lat - 纬度
 * @returns {Array} [lng, lat]
 */
function bd09ToWgs84(lng, lat) {
  const [gcjLng, gcjLat] = bd09ToGcj02(lng, lat);
  return gcj02ToWgs84(gcjLng, gcjLat);
}

/**
 * WGS84转百度坐标系(BD09)
 * @param {number} lng - 经度
 * @param {number} lat - 纬度
 * @returns {Array} [lng, lat]
 */
function wgs84ToBd09(lng, lat) {
  const [gcjLng, gcjLat] = wgs84ToGcj02(lng, lat);
  return gcj02ToBd09(gcjLng, gcjLat);
}

function transformLat(lng, lat) {
  let ret = -100.0 + 2.0 * lng + 3.0 * lat + 0.2 * lat * lat + 0.1 * lng * lat + 0.2 * Math.sqrt(Math.abs(lng));
  ret += (20.0 * Math.sin(6.0 * lng * PI) + 20.0 * Math.sin(2.0 * lng * PI)) * 2.0 / 3.0;
  ret += (20.0 * Math.sin(lat * PI) + 40.0 * Math.sin(lat / 3.0 * PI)) * 2.0 / 3.0;
  ret += (160.0 * Math.sin(lat / 12.0 * PI) + 320 * Math.sin(lat * PI / 30.0)) * 2.0 / 3.0;
  return ret;
}

function transformLng(lng, lat) {
  let ret = 300.0 + lng + 2.0 * lat + 0.1 * lng * lng + 0.1 * lng * lat + 0.1 * Math.sqrt(Math.abs(lng));
  ret += (20.0 * Math.sin(6.0 * lng * PI) + 20.0 * Math.sin(2.0 * lng * PI)) * 2.0 / 3.0;
  ret += (20.0 * Math.sin(lng * PI) + 40.0 * Math.sin(lng / 3.0 * PI)) * 2.0 / 3.0;
  ret += (150.0 * Math.sin(lng / 12.0 * PI) + 300.0 * Math.sin(lng / 30.0 * PI)) * 2.0 / 3.0;
  return ret;
}

/**
 * 判断是否在中国大陆范围内
 * @param {number} lng - 经度
 * @param {number} lat - 纬度
 * @returns {boolean}
 */
function outOfChina(lng, lat) {
  return (lng < 72.004 || lng > 137.8347) || (lat < 0.8293 || lat > 55.8271);
}

export {
  bd09ToGcj02,
  gcj02ToBd09,
  wgs84ToGcj02,
  gcj02ToWgs84,
  bd09ToWgs84,
  wgs84ToBd09,
  outOfChina
};
