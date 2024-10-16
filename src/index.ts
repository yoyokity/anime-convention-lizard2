import { Context, Schema, h } from 'koishi'

export const name = 'anime-convention-lizard'
// npm publish --workspace koishi-plugin-anime-convention-lizard --access public --registry https://registry.npmjs.org
export const usage = `
# 开箱即用的漫展查询插件
## 主要功能及示例调用：
- 对接无差别同人站/CPP，根据关键词查询某个城市即将开始的漫展或查询相关动漫的漫展
  
  - 示例指令：漫展 南京
    - 返回结果：南京市所有即将开始的漫展信息

  - 示例指令：漫展 东方
    - 返回结果：所有即将开始的东方主题的漫展信息
  
## todo：
- 自动获取触发指令的ip地址，返回对应城市的漫展信息

- ……  
`

export interface Config {
  apiUrl: string;
}

export const Config = Schema.object({
  apiUrl: Schema.string()
    .default('https://www.hhlqilongzhu.cn/api/manzhan_sou.php')
    .description('默认API请勿更改'),
})

export const searchApi = '?msg=';

export function apply(ctx: Context, config: Config) {
  let eventCache: any[] = [];
  let retryCount = 0;
  let timeoutId: NodeJS.Timeout;

  ctx.command('漫展 <keyword>', '查询指定城市或主题的漫展信息')
    .action(async ({ session }, keyword) => {
      if (!keyword) return session.send('请提供查询关键词，例如：漫展 南京');
      
      const searchUrl = config.apiUrl + searchApi + encodeURIComponent(keyword);

      try {
        const response = await ctx.http.get(searchUrl);
        
        if (response.code !== 200 || !response.data || response.data.length === 0) {
          await session.send('未找到相关漫展信息，请更换关键词重试。');
          return;
        }

        eventCache = response.data;
        retryCount = 0;

        let selectionMessage = '请在15秒内选择以下漫展:\n';
        eventCache.forEach((item, index) => {
          selectionMessage += `${index + 1}. ${item.name}\n   - ${item.address}\n`;
        });

        await session.send(selectionMessage + '\n请输入对应的序号:');

        timeoutId = setTimeout(async () => {
          eventCache = [];
          retryCount = 0;
          await session.send('超时未选择，请重新查询。');
        }, 15000);
      } catch (error) {
        ctx.logger.error(`Error fetching anime convention data: ${error}`);
        await session.send('查询漫展信息时出现问题，请稍后重试。');
        return;
      }
    });

  ctx.middleware(async (session, next) => {
    if (eventCache.length === 0) {
      return next();
    }

    const userResponse = session.content?.trim();

    const choice = parseInt(userResponse || '');
    if (isNaN(choice) || choice < 1 || choice > eventCache.length) {
      retryCount += 1;

      if (retryCount >= 3) {
        eventCache = [];
        retryCount = 0;
        clearTimeout(timeoutId);
        await session.send('无效的选择次数过多，请稍后重新查询。');
        return;
      }

      await session.send(`无效的选择，请输入正确的序号。(还有${3 - retryCount}次机会)`);
      return;
    }

    clearTimeout(timeoutId);

    const selectedItem = eventCache[choice - 1];
    const result = 
      `漫展名称: ${selectedItem.name}\n` +
      `地点: ${selectedItem.location}\n` +
      `地址: ${selectedItem.address}\n` +
      `时间: ${selectedItem.time}\n` +
      `标签: ${selectedItem.tag}\n` +
      `想去的人数: ${selectedItem.wannaGoCount}\n` +
      `社团数: ${selectedItem.circleCount}\n` +
      `同人作品数: ${selectedItem.doujinshiCount}\n` +
      `链接: ${selectedItem.url}\n` +
      `参与方式: ${selectedItem.isOnline}`;

    await session.send(h('image', { src: selectedItem.appLogoPicUrl }) + '\n' + result);

    eventCache = [];
    retryCount = 0;
  });
}
