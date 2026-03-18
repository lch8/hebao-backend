// api/get-news.js
export const config = { runtime: 'edge' };

export default async function handler(req) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: { 'Access-Control-Allow-Origin': '*' }});
    
    try {
        // 1. 获取数据库钥匙
        let dbUrl = process.env.TURSO_DATABASE_URL;
        const authToken = process.env.TURSO_AUTH_TOKEN;
        
        if (!dbUrl || !authToken) {
            throw new Error('数据库环境变量未配置');
        }
        dbUrl = dbUrl.replace('libsql://', 'https://');

        // 2. 向数据库请求最新洗好的 10 条新闻 (🌟 核心修改：加入 detail_content)
        const response = await fetch(`${dbUrl}/v2/pipeline`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                requests: [
                    { 
                        type: "execute", 
                        stmt: { 
                            sql: "SELECT id, title, ai_summary, tag, tag_color, action_text, created_at, url, detail_content FROM pro_news ORDER BY id DESC LIMIT 10"
                        } 
                    },
                    { type: "close" }
                ]
            })
        });

        const result = await response.json();
        
        // 🚨 防爆盾
        if (result.results && result.results[0].type === 'error') {
            if (result.results[0].error.message.includes('no such table')) {
                return new Response(JSON.stringify({ success: true, data: [{ id: 999, time: '现在', tag: '系统', content: '暂无新闻，请先触发爬虫抓取！', hot: false }] }), { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }});
            }
            throw new Error(result.results[0].error.message);
        }

        const resData = result.results[0].response.result;
        const cols = resData.cols.map(c => c.name);
        
        // 3. 将数据库字段完美映射为前端需要的格式
        const realNews = resData.rows.map(row => {
            let obj = {};
            row.forEach((val, i) => obj[cols[i]] = val.value);
            
            let timeStr = '刚刚';
            if (obj.created_at) {
                const date = new Date(obj.created_at + 'Z'); 
                timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
            }

            return {
                id: obj.id,
                time: timeStr,
                tag: obj.tag || '🌍 速报',
                tagColor: obj.tag_color || '#EF4444',
                title: obj.title,
                content: `【${obj.title}】${obj.ai_summary || ''}`, 
                actionText: obj.action_text || '查看解读',
                url: obj.url || '#', 
                // 🌟 核心修改：取出 AI 深度洗稿的 HTML 结构，若空则给个兜底
                detailContent: obj.detail_content || '<div style="padding:20px; text-align:center; color:#6B7280;">情报官还在拼命码字中，暂无深度解读~</div>',
                hot: true 
            };
        });

        // 兜底
        if (realNews.length === 0) {
            realNews.push({ id: 0, time: '刚刚', tag: '📡 提示', content: '新闻源正在接入中，请稍后再来...', hot: false });
        }

        return new Response(JSON.stringify({ success: true, data: realNews }), { 
            status: 200, 
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
        
    } catch (error) {
        console.error("抓取真实新闻报错:", error);
        return new Response(JSON.stringify({ error: error.message }), { 
            status: 500, 
            headers: { 'Access-Control-Allow-Origin': '*' }
        });
    }
}
