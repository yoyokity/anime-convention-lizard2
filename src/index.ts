import { Context, Schema, Session, h } from 'koishi';
import { ConventionApiResponse, ConventionEvent } from './type';

export const inject = ['database'];
export const name = 'anime-convention-lizard2';
export { usage } from './usage';

export const Config = Schema.object({
  apiUrl: Schema.string()
    .default('https://www.hhlqilongzhu.cn/api/manzhan_sou.php')
    .description('默认API请勿更改'),
});

declare module 'koishi' {
  interface Tables {
    anime_convention2: Subscription;
  }
}

export interface Subscription {
  channelId: string;
  keyword: string;
  createdAt: number;
}

export function apply(ctx: Context, config: { apiUrl: string }) {
  ctx.model.extend('anime_convention2', {
    channelId: 'string',
    keyword: 'string',
    createdAt: 'integer',
  }, { primary: ['channelId', 'keyword'] });
  const getChannelId = (session: Session) => session.guildId ? session.channelId : `private:${session.userId}`;

  ctx.command('漫展', '漫展查询和订阅管理')
    .subcommand('.缺省值 <keyword>', '设置查询的缺省值（取消则后面不要输入关键词）')
    .action(async ({ session }, keyword) => {
      if (!keyword) {
        const channelId = getChannelId(session);
        await ctx.database.remove('anime_convention2', { channelId: channelId });
        return '已取消缺省值。';
      } else {
        const channelId = getChannelId(session);
        await ctx.database.upsert('anime_convention2', [{ channelId, keyword, createdAt: Date.now() }], 'channelId');
        return `已设置「${keyword}」为查询的缺省值。`;
      }
    });

  ctx.command('漫展 <keyword>', '漫展查询')
    .option('year', '-y <value:number>', { fallback: 0 })
    .option('month', '-m <value:number>', { fallback: 0 })
    .action(async ({ session, options }, keyword) => {
      const channelId = getChannelId(session);
      const defaultKeyword = (await ctx.database.get('anime_convention2', { channelId: channelId }))[0]?.keyword ?? ''
      const year = options.year
      const month = options.month

      if (keyword) {
        return search(ctx, config, keyword, year, month)
      } else if (defaultKeyword) {
        return search(ctx, config, defaultKeyword, year, month)
      }

      return '请提供查询关键词，例如：漫展 查询 南京';
    });
}

/**
 * 查询漫展
 */
async function search(ctx: Context, config: { apiUrl: string }, keyword: string, year: number, month: number): Promise<h> {
  try {
    const response = await ctx.http.get<ConventionApiResponse>(config.apiUrl + '?msg=' + encodeURIComponent(keyword));
    if (response.code !== 200 || !response.data?.length) {
      return h.text('未找到相关漫展信息。');
    };

    //过滤年月
    response.data = response.data.filter(e => {
      const date = new Date(e.time)

      if (year && month){
        return date.getFullYear() === year && date.getMonth() + 1 === month
      }else if (year){
        return date.getFullYear() === year
      }else if (month){
        return date.getMonth() + 1 === month
      }else{
        return true
      }
    })

    if (!response.data?.length) {
      return h.text('未找到相关漫展信息。');
    };

    return createMessage(response.data)
  } catch (error) {
    ctx.logger.error('查询 API 失败:', error);
    return h.text('查询失败，请稍后重试。');
  }
}

function createMessage(data: ConventionEvent[]) {
  const child = []
  for (const e of data) {
    child.push(h('message',
      h.image(e.appLogoPicUrl),
      `【${e.name.trim()}】\n`,
      `时间：${formatTime(e.time)}\n`,
      `地点：${e.address.trim()} （${e.location.trim()}）\n\n`,

      `标签：${e.tag.trim().split('|').join(' ')}\n`,
      `想去的人数：${e.wannaGoCount}\n`,
      `社团数：${e.circleCount}\n`,
      `同人作品数：${e.doujinshiCount}\n`,
      `链接：${e.url}\n`,
    ))
  }
  const message = h('message', { forward: true }, child)
  return message
}

function formatTime(time: string) {
  const match = time.match(/\d{4}-\d{2}-\d{2}/)
  return match ? match[0] : time
}
