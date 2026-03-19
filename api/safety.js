// api/safety.js
export const config = { maxDuration: 30 }; // 给足时间请求警察局接口

export default async function handler(req, res) {
    // 支持 GET (查询治安) 和 POST (提交投票)
    const { code, action, type } = req.method === 'POST' ? req.body : req.query;
    
    // 连接你的 Turso 数据库
    const dbUrl = process.env.TURSO_DATABASE_URL?.replace('libsql://', 'https://');
    const authToken = process.env.TURSO_AUTH_TOKEN;

    try {
        // 🌟 自动建表：如果数据库还没这张表，自动创建 (零维护成本)
        if (dbUrl && authToken) {
            await fetch(`${dbUrl}/v2/pipeline`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ requests: [{ type: "execute", stmt: { sql: "CREATE TABLE IF NOT EXISTS safety_votes (code TEXT PRIMARY KEY, safe INT DEFAULT 0, warning INT DEFAULT 0, danger INT DEFAULT 0)" } }, { type: "close" }] })
            });
        }

        // ================= ✍️ POST: 处理用户全局投票 =================
        if (req.method === 'POST' && action === 'vote') {
            let sql = "";
            if (type === 'safe') sql = "INSERT INTO safety_votes (code, safe) VALUES (?, 1) ON CONFLICT(code) DO UPDATE SET safe = safe + 1";
            if (type === 'warning') sql = "INSERT INTO safety_votes (code, warning) VALUES (?, 1) ON CONFLICT(code) DO UPDATE SET warning = warning + 1";
            if (type === 'danger') sql = "INSERT INTO safety_votes (code, danger) VALUES (?, 1) ON CONFLICT(code) DO UPDATE SET danger = danger + 1";

            await fetch(`${dbUrl}/v2/pipeline`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ requests: [{ type: "execute", stmt: { sql: sql, args: [{ type: "text", value: code }] } }, { type: "close" }] })
            });
            return res.status(200).json({ success: true });
        }

        // ================= 🔍 GET: 融合生成终极安全报告 =================
        if (req.method === 'GET') {
            // A. 直连荷兰警察局 (Politie.nl) 抓取该邮编近期真实警情
            let policeIncidents = 0;
            let policeNews = [];
            try {
                const polRes = await fetch(`https://api.politie.nl/v4/nieuws?query=${code}`, { headers: { 'Accept': 'application/json' }});
                const polData = await polRes.json();
                if (polData.nieuwsberichten) {
                    policeIncidents = polData.nieuwsberichten.length;
                    // 取出最新的 2 条警情标题 (案底)
                    policeNews = polData.nieuwsberichten.slice(0, 2).map(n => n.titel); 
                }
            } catch(e) { console.error("Politie API Error", e); }

            // B. 从 Turso 获取全网留学生真实打分
            let votes = { safe: 0, warning: 0, danger: 0 };
            if (dbUrl && authToken) {
                const dbRes = await fetch(`${dbUrl}/v2/pipeline`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ requests: [{ type: "execute", stmt: { sql: "SELECT safe, warning, danger FROM safety_votes WHERE code = ?", args: [{ type: "text", value: code }] } }, { type: "close" }] })
                });
                const dbData = await dbRes.json();
                const rows = dbData.results[0]?.response?.result?.rows;
                if (rows && rows.length > 0) {
                    votes = { safe: rows[0][0].value, warning: rows[0][1].value, danger: rows[0][2].value };
                }
            }

            return res.status(200).json({ success: true, policeIncidents, policeNews, votes });
        }
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
