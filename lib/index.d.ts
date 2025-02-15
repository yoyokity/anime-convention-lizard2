import { Context, Schema } from 'koishi';
export declare const inject: string[];
export declare const name = "anime-convention-lizard";
export declare const usage = "\n# \uD83C\uDF89 \u5F00\u7BB1\u5373\u7528\u7684\u6F2B\u5C55\u67E5\u8BE2\u63D2\u4EF6\n\n## \u7B80\u4ECB\n- **anime-convention-lizard** \u662F\u4E00\u6B3E\u9488\u5BF9\u6F2B\u5C55\u67E5\u8BE2\u4E0E\u8BA2\u9605\u7684 Koishi \u63D2\u4EF6\uFF0C\u5BF9\u63A5\u65E0\u5DEE\u522B\u540C\u4EBA\u7AD9/CPP\uFF0C\u901A\u8FC7\u7B80\u5355\u7684\u6307\u4EE4\u5FEB\u901F\u67E5\u8BE2\u57CE\u5E02\u6216\u4E3B\u9898\u76F8\u5173\u7684\u6F2B\u5C55\uFF0C\u5E76\u63D0\u4F9B\u8BA2\u9605\u4E0E\u7BA1\u7406\u529F\u80FD\u3002\n\n---\n\n<details>\n<summary><strong><span style=\"font-size: 1.3em; color: #2a2a2a;\">\u4F7F\u7528\u65B9\u6CD5</span></strong></summary>\n\n### \u901A\u8FC7\u5173\u952E\u8BCD\u67E5\u8BE2\u6F2B\u5C55\n#### \u793A\u4F8B\uFF1A\n<pre style=\"background-color: #f4f4f4; padding: 10px; border-radius: 4px; border: 1px solid #ddd;\">\u6F2B\u5C55 \u67E5\u8BE2 \u5357\u4EAC // \u67E5\u8BE2\u5357\u4EAC\u7684\u6F2B\u5C55</pre>\n<pre style=\"background-color: #f4f4f4; padding: 10px; border-radius: 4px; border: 1px solid #ddd;\">\u6F2B\u5C55 \u67E5\u8BE2 \u4E1C\u65B9 // \u67E5\u8BE2\u4E0E\u4E1C\u65B9\u76F8\u5173\u7684\u6F2B\u5C55</pre>\n\n### \u4E00\u952E\u67E5\u8BE2\u6240\u6709\u8BA2\u9605\u7684\u6F2B\u5C55\n#### \u793A\u4F8B\uFF1A\n<pre style=\"background-color: #f4f4f4; padding: 10px; border-radius: 4px; border: 1px solid #ddd;\">\u6F2B\u5C55 \u4E00\u952E\u67E5\u8BE2 // \u67E5\u8BE2\u6240\u6709\u5DF2\u8BA2\u9605\u5173\u952E\u8BCD\u7684\u6F2B\u5C55</pre>\n\n### \u8BA2\u9605\u6F2B\u5C55\u5173\u952E\u8BCD\n#### \u793A\u4F8B\uFF1A\n<pre style=\"background-color: #f4f4f4; padding: 10px; border-radius: 4px; border: 1px solid #ddd;\">\u6F2B\u5C55 \u8BA2\u9605 \u5357\u4EAC // \u8BA2\u9605\u5357\u4EAC\u7684\u6F2B\u5C55</pre>\n<pre style=\"background-color: #f4f4f4; padding: 10px; border-radius: 4px; border: 1px solid #ddd;\">\u6F2B\u5C55 \u8BA2\u9605 \u4E1C\u65B9 // \u8BA2\u9605\u4E0E\u4E1C\u65B9\u76F8\u5173\u7684\u6F2B\u5C55</pre>\n\n### \u53D6\u6D88\u8BA2\u9605\u6F2B\u5C55\u5173\u952E\u8BCD\n#### \u793A\u4F8B\uFF1A\n<pre style=\"background-color: #f4f4f4; padding: 10px; border-radius: 4px; border: 1px solid #ddd;\">\u6F2B\u5C55 \u53D6\u6D88\u8BA2\u9605 \u5357\u4EAC // \u53D6\u6D88\u8BA2\u9605\u5357\u4EAC\u7684\u6F2B\u5C55</pre>\n<pre style=\"background-color: #f4f4f4; padding: 10px; border-radius: 4px; border: 1px solid #ddd;\">\u6F2B\u5C55 \u53D6\u6D88\u8BA2\u9605 // \u53D6\u6D88\u6240\u6709\u8BA2\u9605</pre>\n\n### \u67E5\u770B\u5F53\u524D\u8BA2\u9605\u5217\u8868\n#### \u793A\u4F8B\uFF1A\n<pre style=\"background-color: #f4f4f4; padding: 10px; border-radius: 4px; border: 1px solid #ddd;\">\u6F2B\u5C55 \u8BA2\u9605\u5217\u8868 // \u67E5\u770B\u5F53\u524D\u8BA2\u9605\u7684\u5173\u952E\u8BCD\u5217\u8868</pre>\n</details>\n\n<details>\n<summary><strong><span style=\"font-size: 1.3em; color: #2a2a2a;\">\u5982\u679C\u8981\u53CD\u9988\u5EFA\u8BAE\u6216\u62A5\u544A\u95EE\u9898</span></strong></summary>\n\n<strong>\u53EF\u4EE5[\u70B9\u8FD9\u91CC](https://github.com/lizard0126/javbus-lizard/issues)\u521B\u5EFA\u8BAE\u9898~</strong>\n</details>\n\n<details>\n<summary><strong><span style=\"font-size: 1.3em; color: #2a2a2a;\">\u5982\u679C\u559C\u6B22\u6211\u7684\u63D2\u4EF6</span></strong></summary>\n\n<strong>\u53EF\u4EE5[\u8BF7\u6211\u559D\u53EF\u4E50](https://ifdian.net/a/lizard0126)\uFF0C\u6CA1\u51C6\u5C31\u6709\u52A8\u529B\u66F4\u65B0\u65B0\u529F\u80FD\u4E86~</strong>\n</details>\n";
export declare const Config: Schema<Schemastery.ObjectS<{
    apiUrl: Schema<string, string>;
}>, Schemastery.ObjectT<{
    apiUrl: Schema<string, string>;
}>>;
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
export declare function apply(ctx: Context, config: {
    apiUrl: string;
}): void;
