import { Context, Schema } from 'koishi';
export declare const inject: string[];
export declare const name = "anime-convention-lizard";
export declare const usage = "\n## \u5F00\u7BB1\u5373\u7528\u7684\u6F2B\u5C55\u67E5\u8BE2\u63D2\u4EF6\n### \u7B80\u4ECB\n- anime-convention-lizard \u662F\u4E00\u6B3E\u9488\u5BF9\u6F2B\u5C55\u67E5\u8BE2\u4E0E\u8BA2\u9605\u7684 Koishi \u63D2\u4EF6\uFF0C\u5BF9\u63A5\u65E0\u5DEE\u522B\u540C\u4EBA\u7AD9/CPP\uFF0C\u901A\u8FC7\u7B80\u5355\u7684\u6307\u4EE4\u5FEB\u901F\u67E5\u8BE2\u57CE\u5E02\u6216\u4E3B\u9898\u76F8\u5173\u7684\u6F2B\u5C55\uFF0C\u5E76\u63D0\u4F9B\u8BA2\u9605\u4E0E\u7BA1\u7406\u529F\u80FD\u3002\n### \u529F\u80FD\u7279\u6027\n- \u6F2B\u5C55\u67E5\u8BE2\uFF1A\u6839\u636E\u57CE\u5E02\u6216\u5173\u952E\u8BCD\u67E5\u8BE2\u5373\u5C06\u4E3E\u529E\u7684\u6F2B\u5C55\u3002\n- \u8BA2\u9605\u7BA1\u7406\uFF1A\u8BA2\u9605\u7279\u5B9A\u5173\u952E\u8BCD\uFF0C\u83B7\u53D6\u5BF9\u5E94\u6F2B\u5C55\u7684\u6700\u65B0\u66F4\u65B0\u3002\n- \u4E00\u952E\u67E5\u8BE2\uFF1A\u5FEB\u901F\u6574\u5408\u6240\u6709\u8BA2\u9605\u5173\u952E\u8BCD\u7684\u6F2B\u5C55\u4FE1\u606F\u3002\n\n---\n<details>\n<summary>\u5982\u679C\u8981\u53CD\u9988\u5EFA\u8BAE\u6216\u62A5\u544A\u95EE\u9898</summary>\n\n\u53EF\u4EE5[\u70B9\u8FD9\u91CC](https://github.com/lizard0126/anime-convention-lizard/issues)\u521B\u5EFA\u8BAE\u9898~\n</details>\n<details>\n<summary>\u5982\u679C\u559C\u6B22\u6211\u7684\u63D2\u4EF6</summary>\n\n\u53EF\u4EE5[\u8BF7\u6211\u559D\u53EF\u4E50](https://ifdian.net/a/lizard0126)\uFF0C\u6CA1\u51C6\u5C31\u6709\u52A8\u529B\u66F4\u65B0\u65B0\u529F\u80FD\u4E86~\n</details>\n";
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
export declare const Config: Schema<Schemastery.ObjectS<{
    apiUrl: Schema<string, string>;
}>, Schemastery.ObjectT<{
    apiUrl: Schema<string, string>;
}>>;
export declare const searchApi = "?msg=";
export declare function apply(ctx: Context, config: Config): void;
