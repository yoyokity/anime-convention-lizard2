import { Context, Schema, Session, h } from 'koishi';

export const inject = ['database'];
export const name = 'anime-convention-lizard';
export const usage = `
# 🎉 开箱即用的漫展查询插件

## 简介
- **anime-convention-lizard** 是一款针对漫展查询与订阅的 Koishi 插件，对接无差别同人站/CPP，通过简单的指令快速查询城市或主题相关的漫展，并提供订阅与管理功能。

---

<details>
<summary><strong><span style="font-size: 1.3em; color: #2a2a2a;">使用方法</span></strong></summary>

### 通过关键词查询漫展
#### 示例：
<pre style="background-color: #f4f4f4; padding: 10px; border-radius: 4px; border: 1px solid #ddd;">漫展 查询 南京 // 查询南京的漫展</pre>
<pre style="background-color: #f4f4f4; padding: 10px; border-radius: 4px; border: 1px solid #ddd;">漫展 查询 东方 // 查询与东方相关的漫展</pre>

### 一键查询所有订阅的漫展
#### 示例：
<pre style="background-color: #f4f4f4; padding: 10px; border-radius: 4px; border: 1px solid #ddd;">漫展 一键查询 // 查询所有已订阅关键词的漫展</pre>

### 订阅漫展关键词
#### 示例：
<pre style="background-color: #f4f4f4; padding: 10px; border-radius: 4px; border: 1px solid #ddd;">漫展 订阅 南京 // 订阅南京的漫展</pre>
<pre style="background-color: #f4f4f4; padding: 10px; border-radius: 4px; border: 1px solid #ddd;">漫展 订阅 东方 // 订阅与东方相关的漫展</pre>

### 取消订阅漫展关键词
#### 示例：
<pre style="background-color: #f4f4f4; padding: 10px; border-radius: 4px; border: 1px solid #ddd;">漫展 取消订阅 南京 // 取消订阅南京的漫展</pre>
<pre style="background-color: #f4f4f4; padding: 10px; border-radius: 4px; border: 1px solid #ddd;">漫展 取消订阅 // 取消所有订阅</pre>

### 查看当前订阅列表
#### 示例：
<pre style="background-color: #f4f4f4; padding: 10px; border-radius: 4px; border: 1px solid #ddd;">漫展 订阅列表 // 查看当前订阅的关键词列表</pre>
</details>

<details>
<summary><strong><span style="font-size: 1.3em; color: #2a2a2a;">如果要反馈建议或报告问题</span></strong></summary>

<strong>可以[点这里](https://github.com/lizard0126/javbus-lizard/issues)创建议题~</strong>
</details>

<details>
<summary><strong><span style="font-size: 1.3em; color: #2a2a2a;">如果喜欢我的插件</span></strong></summary>

<strong>可以[请我喝可乐](https://ifdian.net/a/lizard0126)，没准就有动力更新新功能了~</strong>
</details>
`;

export const Config = Schema.object({
  apiUrl: Schema.string()
    .default('https://www.hhlqilongzhu.cn/api/manzhan_sou.php')
    .description('默认API请勿更改'),
});

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

export function apply(ctx: Context, config: { apiUrl: string }) {
  ctx.model.extend('anime_convention', {
    userId: 'string',
    channelId: 'string',
    keyword: 'string',
    createdAt: 'integer',
  }, { primary: ['userId', 'channelId', 'keyword'] });

  const userSearchCache: Record<string, { cache: any[]; timeoutId?: NodeJS.Timeout }> = {};
  const getChannelId = (session: Session) => session.guildId ? session.channelId : `private:${session.userId}`;

  ctx.command('漫展', '漫展查询和订阅管理')
    .subcommand('.查询 <keyword>', '查询漫展')
    .action(async ({ session }, keyword) => {
      if (!keyword) {
        await session.send('请提供查询关键词，例如：漫展 查询 南京');
        return;
      };

      if (userSearchCache[session.userId]) {
        clearTimeout(userSearchCache[session.userId].timeoutId);
        delete userSearchCache[session.userId];
      }

      try {
        const response = await ctx.http.get(config.apiUrl + '?msg=' + encodeURIComponent(keyword));
        if (response.code !== 200 || !response.data?.length) {
          await session.send('未找到相关漫展信息。');
          return;
        };

        userSearchCache[session.userId] = { cache: response.data };
        const message = response.data.map((item: any, i: number) => `${i + 1}. ${item.name} - ${item.address}`).join('\n');
        session.send(`找到以下漫展信息：\n${message}\n请输入序号查看详情，输入“0”取消。`);

        userSearchCache[session.userId].timeoutId = setTimeout(() => {
          delete userSearchCache[session.userId];
          session.send('超时未选择，请重新查询。');
        }, 15000);
      } catch (error) {
        ctx.logger.error('查询 API 失败:', error);
        session.send('查询失败，请稍后重试。');
      }
    });

  ctx.command('漫展', '漫展查询和订阅管理')
    .subcommand('.一键查询', '查询订阅的所有漫展')
    .action(async ({ session }) => {
      const subscriptions = await ctx.database.get('anime_convention', { userId: session.userId, channelId: getChannelId(session) });
      if (!subscriptions.length) {
        await session.send('你没有订阅任何漫展。');
        return;
      };

      const results = await Promise.all(subscriptions.map(async (sub) => {
        try {
          const response = await ctx.http.get(config.apiUrl + '?msg=' + encodeURIComponent(sub.keyword));
          return response.code === 200 ? response.data.map((item: any) => ({ ...item, keyword: sub.keyword })) : [];
        } catch {
          return [];
        }
      }));

      const allResults = results.flat();
      if (!allResults.length) {
        await session.send('未找到订阅的漫展信息。');
        return;
      };

      const message = allResults.map((item, i) => `${i + 1}. [${item.keyword}] ${item.name} - ${item.address}`).join('\n');
      session.send(`订阅关键词的漫展信息：\n${message}\n请输入序号查看详情，输入“0”取消。`);

      userSearchCache[session.userId] = { cache: allResults };
      userSearchCache[session.userId].timeoutId = setTimeout(() => delete userSearchCache[session.userId], 15000);
    });

  ctx.command('漫展', '漫展查询和订阅管理')
    .subcommand('.订阅 <keyword>', '订阅漫展')
    .action(async ({ session }, keyword) => {
      const channelId = getChannelId(session);
      await ctx.database.upsert('anime_convention', [{ userId: session.userId, channelId, keyword, createdAt: Date.now() }]);
      session.send(`已订阅「${keyword}」的漫展信息。`);
    });

  ctx.command('漫展', '漫展查询和订阅管理')
    .subcommand('.取消订阅 [keyword]', '取消订阅')
    .action(async ({ session }, keyword) => {
      const channelId = getChannelId(session);
      if (!keyword) {
        await session.send('确定取消所有订阅？（是/否）');
        if ((await session.prompt(10000))?.toLowerCase() === '是') {
          await ctx.database.remove('anime_convention', { userId: session.userId, channelId });
          await session.send('已取消所有订阅。');
          return;
        }
        await session.send('操作取消。');
        return;
      }

      const deleted = await ctx.database.remove('anime_convention', { userId: session.userId, channelId, keyword });
      session.send(deleted ? `已取消订阅「${keyword}」。` : `未找到「${keyword}」的订阅。`);
    });

  ctx.command('漫展', '漫展查询和订阅管理')
    .subcommand('.订阅列表', '查看订阅列表')
    .action(async ({ session }) => {
      const subscriptions = await ctx.database.get('anime_convention', { userId: session.userId, channelId: getChannelId(session) });
      if (!subscriptions.length) {
        await session.send('你没有订阅任何漫展。');
        return;
      }
      session.send('你订阅的漫展关键词：\n' + subscriptions.map((sub) => `- ${sub.keyword}`).join('\n'));
    });

  ctx.middleware(async (session, next) => {
    const userCache = userSearchCache[session.userId];
    if (!userCache?.cache) return next();

    const choice = parseInt(session.content?.trim() || '');
    if (isNaN(choice) || choice < 1 || choice > userCache.cache.length) {
      if (session.content === '0') {
        clearTimeout(userCache.timeoutId);
        delete userSearchCache[session.userId];
        await session.send('已取消操作。');
        return;
      }
      await session.send('无效选择，请输入正确的序号。');
      return;
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
      `参与方式: ${selectedItem.isOnline ? '线上' : '线下'}`;

    try {
      const img = await ctx.http.get(selectedItem.appLogoPicUrl, {
        headers: {
          refer: 'https://cp.allcpp.cn/',
        },
      });
      await session.send(`${h.image(img)}\n${result}`);
    } catch (error) {
      console.error('获取图片失败:', error);
      await session.send(result);
    }
    delete userSearchCache[session.userId];
  });
}