import { Context, Schema, Session, h } from 'koishi';
// npm publish --workspace koishi-plugin-anime-convention-lizard --access public --registry https://registry.npmjs.org
export const inject = ['database'];
export const name = 'anime-convention-lizard';
export const usage = `
## 开箱即用的漫展查询插件
### 简介
- anime-convention-lizard 是一款针对漫展查询与订阅的 Koishi 插件，对接无差别同人站/CPP，通过简单的指令快速查询城市或主题相关的漫展，并提供订阅与管理功能。
### 功能特性
- 漫展查询：根据城市或关键词查询即将举办的漫展。
- 订阅管理：订阅特定关键词，获取对应漫展的最新更新。
- 一键查询：快速整合所有订阅关键词的漫展信息。

---
<details>
<summary>如果要反馈建议或报告问题</summary>

可以[点这里](https://github.com/lizard0126/anime-convention-lizard/issues)创建议题~
</details>
<details>
<summary>如果喜欢我的插件</summary>

可以[请我喝可乐](https://ifdian.net/a/lizard0126)，没准就有动力更新新功能了~
</details>
`;

declare module 'koishi' {
  interface Tables {
    anime_convention: Subscription;
  }
}

export interface Subscription {
  userId: string;
  channelId: string;
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
});

export const searchApi = '?msg=';

export function apply(ctx: Context, config: Config) {
  let userSearchCache: Record<string, { cache: any[]; timeoutId?: NodeJS.Timeout; retryCount: number }> = {};

  ctx.model.extend(
    'anime_convention',
    {
      userId: 'string',
      channelId: 'string',
      keyword: 'string',
      createdAt: 'integer',
    },
    {
      primary: ['userId', 'channelId', 'keyword'],
    }
  );

  const getChannelId = (session: Session): string => {
    return session.guildId ? session.channelId : `private:${session.userId}`;
  };

  const conventionCmd = ctx.command('漫展', '漫展查询和订阅管理');

  conventionCmd
    .subcommand('.查询 <keyword>', '查询指定城市或主题的漫展信息')
    .action(async ({ session }, keyword) => {
      if (!keyword) {
        await session.send('请提供查询关键词，例如：漫展 查询 南京');
        return;
      }

      if (userSearchCache[session.userId]?.cache?.length) {
        await session.send('你已有未完成的查询，请完成后再发起新查询。');
        return;
      }

      const searchUrl = config.apiUrl + searchApi + encodeURIComponent(keyword);
      try {
        const response = await ctx.http.get(searchUrl);
        if (response.code !== 200 || !response.data?.length) {
          await session.send('未找到相关漫展信息，请尝试其他关键词。');
          return;
        }

        userSearchCache[session.userId] = {
          cache: response.data,
          retryCount: 0,
        };

        const selectionMessage = response.data
          .map((item: any, index: number) => `${index + 1}. ${item.name}\n   - ${item.address}`)
          .join('\n');
        await session.send(`找到以下漫展信息：\n${selectionMessage}\n\n请输入对应的序号查看详细信息，输入“0”取消操作。`);

        userSearchCache[session.userId].timeoutId = setTimeout(() => {
          delete userSearchCache[session.userId];
          session.send('超时未选择，请重新发起查询。');
        }, 15000);
      } catch (error) {
        ctx.logger.error(`Anime convention search error: ${error}`);
        await session.send('查询漫展信息时出现问题，请稍后重试。');
        return;
      }
    });

  conventionCmd
    .subcommand('.一键查询', '查询所有订阅关键词的漫展信息')
    .action(async ({ session }) => {
      const channelId = getChannelId(session);

      const subscriptions = await ctx.database.get('anime_convention', {
        userId: session.userId,
        channelId,
      });

      if (subscriptions.length === 0) {
        await session.send('你当前没有订阅任何关键词，请先订阅后再使用此功能。');
        return;
      }

      const results: any[] = [];
      const failedKeywords: string[] = [];

      for (const subscription of subscriptions) {
        const searchUrl = config.apiUrl + searchApi + encodeURIComponent(subscription.keyword);
        try {
          const response = await ctx.http.get(searchUrl);
          if (response.code === 200 && response.data?.length > 0) {
            results.push(...response.data.map((item: any) => ({ ...item, keyword: subscription.keyword })));
          } else {
            failedKeywords.push(subscription.keyword);
          }
        } catch (error) {
          ctx.logger.error(`Error querying for keyword "${subscription.keyword}": ${error}`);
          failedKeywords.push(subscription.keyword);
        }
      }

      if (results.length === 0) {
        await session.send(
          failedKeywords.length > 0
            ? `未找到任何订阅关键词的相关漫展信息（失败关键词：${failedKeywords.join('，')}）。`
            : '未找到任何订阅的漫展信息。'
        );
        return;
      }

      let selectionMessage = '以下是所有订阅关键词的漫展信息：\n';
      results.forEach((item, index) => {
        selectionMessage += `${index + 1}. [${item.keyword}] ${item.name}\n   - ${item.address}\n`;
      });
      selectionMessage += '\n请输入对应的序号查看详细信息，输入“0”取消操作。';

      await session.send(selectionMessage);

      userSearchCache[session.userId] = {
        cache: results,
        retryCount: 0,
      };

      userSearchCache[session.userId].timeoutId = setTimeout(() => {
        delete userSearchCache[session.userId];
        session.send('超时未选择，请重新发起查询。');
      }, 15000);
    });

  conventionCmd
    .subcommand('.订阅 <keyword>', '订阅指定城市或主题的漫展信息')
    .action(async ({ session }, keyword) => {
      if (!keyword) {
        await session.send('请提供订阅关键词，例如：漫展 订阅 南京');
        return;
      }

      const channelId = getChannelId(session);

      const subscriptionExists = await ctx.database.get('anime_convention', {
        userId: session.userId,
        channelId,
        keyword,
      });

      if (subscriptionExists.length > 0) {
        await session.send(`你已经订阅了关于「${keyword}」的漫展信息。`);
        return;
      }

      await ctx.database.create('anime_convention', {
        userId: session.userId,
        channelId,
        keyword,
        createdAt: Math.floor(Date.now() / 1000),
      });

      await session.send(`成功订阅「${keyword}」相关的漫展信息！`);
      return;
    });

  conventionCmd
    .subcommand('.取消订阅 [keyword]', '取消订阅指定城市或主题的漫展信息，若无关键词则取消所有订阅')
    .action(async ({ session }, keyword) => {
      const channelId = getChannelId(session);

      const subscriptions = await ctx.database.get('anime_convention', {
        userId: session.userId,
        channelId,
      });

      if (subscriptions.length === 0) {
        await session.send('你当前没有任何订阅，无法取消。');
        return;
      }

      if (!keyword) {
        await session.send('你确定要取消所有的漫展订阅信息吗？（是/否）');

        const confirmation = await session.prompt(10000);

        if (confirmation?.toLowerCase() === '是') {
          await ctx.database.remove('anime_convention', {
            userId: session.userId,
            channelId,
          });
          await session.send('已取消所有的漫展订阅信息。');
        } else {
          await session.send('操作已取消。');
        }
        return;
      }

      const subscriptionExists = subscriptions.some((sub) => sub.keyword === keyword);
      if (!subscriptionExists) {
        await session.send(`你没有订阅「${keyword}」相关的漫展信息。`);
        return;
      }

      await ctx.database.remove('anime_convention', {
        userId: session.userId,
        channelId,
        keyword,
      });

      await session.send(`已取消订阅「${keyword}」相关的漫展信息。`);
      return;
    });

  conventionCmd
    .subcommand('.订阅列表', '查看已经订阅的漫展关键词')
    .action(async ({ session }) => {
      const channelId = getChannelId(session);

      const subscriptions = await ctx.database.get('anime_convention', {
        userId: session.userId,
        channelId,
      });

      if (subscriptions.length === 0) {
        await session.send('你当前没有订阅任何漫展信息。');
        return;
      }

      let message = '你已订阅以下漫展信息：\n';
      subscriptions.forEach((sub) => {
        message += `- ${sub.keyword}\n`;
      });

      await session.send(message);
      return;
    });

  ctx.middleware(async (session, next) => {
    const userCache = userSearchCache[session.userId];
    if (!userCache?.cache?.length) return next();

    const userResponse = session.content?.trim();
    if (userResponse === '0') {
      clearTimeout(userCache.timeoutId);
      delete userSearchCache[session.userId];
      await session.send('已取消操作。');
      return;
    }

    const choice = parseInt(userResponse || '');
    if (isNaN(choice) || choice < 1 || choice > userCache.cache.length) {
      userCache.retryCount += 1;
      if (userCache.retryCount >= 3) {
        clearTimeout(userCache.timeoutId);
        delete userSearchCache[session.userId];
        await session.send('无效选择次数过多，操作已取消。');
        return;
      }
      await session.send(`无效选择，请输入正确的序号。(剩余${3 - userCache.retryCount}次机会)`);
    }

    clearTimeout(userCache.timeoutId);

    const selectedItem = userCache.cache[choice - 1];
    const result =
      `漫展名称: ${selectedItem.name}\n` +
      `关键词: ${selectedItem.keyword}\n` +
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
    delete userSearchCache[session.userId];
  });
}
