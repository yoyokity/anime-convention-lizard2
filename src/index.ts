import { Context, Schema, h } from 'koishi'
export const inject = ['database']
export const name = 'anime-convention-lizard'
// npm publish --workspace koishi-plugin-anime-convention-lizard --access public --registry https://registry.npmjs.org
export const usage = `
# 开箱即用的漫展查询插件
## 主要功能及示例调用：
- 对接无差别同人站/CPP，根据关键词查询某个城市即将开始的漫展或查询相关动漫的漫展，并提供订阅服务
  
  - 示例指令：漫展 查询 南京
    - 返回结果：南京市所有即将开始的漫展信息

  - 示例指令：漫展 订阅 东方
    - 返回结果：订阅未来更新的所有东方主题漫展的信息

  - 示例指令：漫展 取消订阅 东方
    - 返回结果：取消已经订阅的东方主题漫展信息

  - 示例指令：漫展 订阅列表
    - 返回结果：查看订阅列表
  
---
#### 喜欢我的插件可以[请我喝可乐](https://ifdian.net/a/lizard0126)，没准就有动力更新新功能了
`

declare module 'koishi' {
  interface Tables {
    user_subscription: Subscription
  }
}

export interface Subscription {
  userId: string;
  keyword: string;
  createdAt: number;
}
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
  let isSearching = false;

  ctx.model.extend('user_subscription', {
    userId: 'string',
    keyword: 'string',
    createdAt: 'integer',
  }, {
    primary: ['userId', 'keyword'],
  });

  const conventionCmd = ctx.command('漫展', '漫展查询和订阅管理');

  conventionCmd
    .subcommand('.查询 <keyword>', '查询指定城市或主题的漫展信息')
    .action(async ({ session }, keyword) => {
      if (isSearching) {
        await session.send('当前已有查询进行中，请先完成或停止当前查询。');
        return;
      }

      if (!keyword) {
        await session.send('请提供查询关键词，例如：漫展 查询 南京');
        return;
      }

      isSearching = true;

      const searchUrl = config.apiUrl + searchApi + encodeURIComponent(keyword);

      try {
        const response = await ctx.http.get(searchUrl);

        if (response.code !== 200 || !response.data || response.data.length === 0) {
          await session.send('未找到相关漫展信息，请更换关键词重试。');
          isSearching = false;
          return;
        }

        eventCache = response.data;
        retryCount = 0;

        let selectionMessage = '请在15秒内选择以下漫展:\n';
        eventCache.forEach((item, index) => {
          selectionMessage += `${index + 1}. ${item.name}\n   - ${item.address}\n`;
        });

        await session.send(selectionMessage + '\n请输入对应的序号，输入“0”停止查询');

        timeoutId = setTimeout(async () => {
          eventCache = [];
          retryCount = 0;
          isSearching = false;
          await session.send('超时未选择，请重新查询。');
        }, 15000);
      } catch (error) {
        ctx.logger.error(`Error fetching anime convention data: ${error}`);
        await session.send('查询漫展信息时出现问题，请稍后重试。');
        isSearching = false;
        return;
      }
    });

  ctx.middleware(async (session, next) => {
    if (eventCache.length === 0) {
      return next();
    }

    const userResponse = session.content?.trim();

    if (userResponse === '0') {
      clearTimeout(timeoutId);
      eventCache = [];
      retryCount = 0;
      isSearching = false;

      await session.send('已停止当前查询');
      return;
    }

    const choice = parseInt(userResponse || '');
    if (isNaN(choice) || choice < 1 || choice > eventCache.length) {
      retryCount += 1;

      if (retryCount >= 3) {
        eventCache = [];
        retryCount = 0;
        isSearching = false;
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

    const img = await ctx.http.get(selectedItem.appLogoPicUrl, {
      headers: {
        refer: 'https://cp.allcpp.cn/',
      },
    });

    await session.send(`${h.image(img)}\n${result}`);

    eventCache = [];
    retryCount = 0;
    isSearching = false;
  });

  conventionCmd
    .subcommand('.订阅 <keyword>', '订阅指定城市或主题的漫展信息')
    .action(async ({ session }, keyword) => {
      if (!keyword) return session.send('请提供订阅关键词，例如：漫展 订阅 南京');

      const subscriptionExists = await ctx.database.get('user_subscription', {
        userId: session.userId,
        keyword,
      });

      if (subscriptionExists.length > 0) {
        await session.send(`你已经订阅了关于「${keyword}」的漫展信息。`);
        return;
      }

      await ctx.database.create('user_subscription', {
        userId: session.userId,
        keyword,
        createdAt: Math.floor(Date.now() / 1000),
      });

      const message = `成功订阅「${keyword}」相关的漫展信息！`;
      await session.send(message);
    });

  conventionCmd
    .subcommand('.取消订阅 [keyword]', '取消订阅指定城市或主题的漫展信息，若无关键词则取消所有订阅')
    .action(async ({ session }, keyword) => {
      const subscriptions = await ctx.database.get('user_subscription', {
        userId: session.userId,
      });

      if (subscriptions.length === 0) {
        await session.send('你当前没有任何订阅，无法取消。');
        return;
      }

      if (!keyword) {
        await ctx.database.remove('user_subscription', {
          userId: session.userId,
        });
        await session.send('已取消所有的漫展订阅信息。');
        return;
      }

      const subscriptionExists = subscriptions.some(sub => sub.keyword === keyword);

      if (!subscriptionExists) {
        await session.send(`你没有订阅「${keyword}」相关的漫展信息。`);
        return;
      }

      await ctx.database.remove('user_subscription', {
        userId: session.userId,
        keyword,
      });

      await session.send(`已取消订阅「${keyword}」相关的漫展信息。`);
    });

  conventionCmd
    .subcommand('.订阅列表', '查看已经订阅的漫展关键词')
    .action(async ({ session }) => {
      const subscriptions = await ctx.database.get('user_subscription', {
        userId: session.userId,
      });

      if (subscriptions.length === 0) {
        return session.send('你当前没有订阅任何漫展信息。');
      }

      let message = '你已订阅以下漫展信息：\n';
      subscriptions.forEach(sub => {
        message += `- ${sub.keyword}\n`;
      });

      const result = await session.send(message);
      ctx.logger.info(`Message ID: ${result}`);
    });

  const userSessions = new Map<string, any>();
  let lastCheckTime = Date.now();

  ctx.setInterval(async () => {
    const subscriptions = await ctx.database.get('user_subscription', {});

    if (!subscriptions.length) return;

    for (const subscription of subscriptions) {
      const searchUrl = config.apiUrl + searchApi + encodeURIComponent(subscription.keyword);
      try {
        const response = await ctx.http.get(searchUrl);

        if (response.code === 200 && response.data && response.data.length > 0) {
          for (const item of response.data) {
            if (item.createdAt > lastCheckTime) {
              const message = `发现新的漫展: ${item.name}\n地点: ${item.address}\n时间: ${item.time}`;
              const userSession = userSessions.get(subscription.userId);
              if (userSession) {
                await userSession.send(message);
              }
            }
          }
        }
      } catch (error) {
        ctx.logger.error(`Error fetching anime convention data for subscription: ${error}`);
      }
    }

    lastCheckTime = Date.now();
  }, 3600000);

  ctx.on('message', (session) => {
    userSessions.set(session.userId, session);
  });
}