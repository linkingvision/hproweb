/**
 * 16进制色值获取反色设置方法
 * @param  {String} oldColor 为16进制色值的字符串（例：'#000000'）
 * @return {String} 返回反色的色值（例：'#ffffff'）
 */
function getOppositeColor(oldColor: string): string {
  const color = '0x' + oldColor.replace(/#/g, '');
  const str = '000000' + (0xFFFFFF - parseInt(color, 16)).toString(16);
  return '#' + str.substring(str.length - 6, str.length);
}

export default getOppositeColor;
