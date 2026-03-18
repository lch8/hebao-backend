// api/get-news.js
export const config = { runtime: 'edge' };

export default async function handler(req) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: { 'Access-Control-Allow-Origin': '*' }});
    
    try {
        let dbUrl = process.env.TURSO_DATABASE_URL;
        const authToken = process.env.TURSO_AUTH_TOKEN;
        
        if (!dbUrl || !authToken) throw new Error('数据库环境变量未配置');
        dbUrl = dbUrl.replace('libsql://', 'https://');

        const response = await fetch(`${dbUrl}/v2/pipeline`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                requests: [
                    { 
                        type: "execute", 
                        stmt: { 
                            // 🌟 核心修改：加上 detail_content 字段！
                            sql: "SELECT id, title, ai_summary, tag, tag_color, action_text, created_at, url, detail_content FROM pro_news ORDER BY id DESC LIMIT 10" 
                        } 
                    },
                    { type: "close" }
                ]
            })
        });

        const result = await response.json();
        
        if (result.results && result.results[0].type === 'error') {
            if (result.results[0].error.message.includes('no such table')) {
                return new Response(JSON.stringify({ success: true, data: [] }), { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }});
            }
            throw new Error(result.results[0].error.message);
        }

        const resData = result.results[0].response.result;
        const cols = resData.cols.map(c => c.name);
        
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
                // 🌟 核心修改：把 AI 深度排版的 HTML 传给前端。如果没有，给个兜底提示。
                detailContent: obj.detail_content || '<div style="padding:20px; text-align:center; color:#6B7280;">该新闻暂无深度解读~</div>',
                hot: true 
            };
        });

        if (realNews.length === 0) {
            realNews.push({ id: 0, time: '刚刚', tag: '📡 提示', content: '新闻源正在接入中...', hot: false });
        }

        return new Response(JSON.stringify({ success: true, data: realNews }), { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }});
        
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Access-Control-Allow-Origin': '*' }});
    }
}
