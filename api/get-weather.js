// api/get-weather.js
export default async function handler(req, res) {
    // 接收前端传来的坐标，默认兜底阿姆斯特丹
    const lat = req.query.lat || '52.3676';
    const lon = req.query.lon || '4.9041';

    try {
        // 🚀 直连 Buienradar 官方隐藏的雷达数据流接口
        const response = await fetch(`https://gpsgadget.buienradar.nl/data/raintext?lat=${lat}&lon=${lon}`, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const text = await response.text();

        // Buienradar 数据格式长这样："077|11:05 \n 000|11:10" (数值|时间)
        const lines = text.trim().split('\n');
        
        let isRainingSoon = false;
        let rainMsg = '放心骑 (未来2h无雨)';
        let rainLevel = 0; // 0=无雨, 1=毛毛雨, 2=中雨, 3=大雨

        for (let i = 0; i < lines.length; i++) {
            if (!lines[i]) continue;
            const [valStr, time] = lines[i].split('|');
            const val = parseInt(valStr, 10);
            
            if (val > 0) {
                isRainingSoon = true;
                // 💡 Buienradar 官方解密公式：降雨量(mm/h) = 10 ^ ((测算值 - 109) / 32)
                const mmPerHour = Math.pow(10, (val - 109) / 32);
                
                if (mmPerHour > 2.5) rainLevel = Math.max(rainLevel, 3); // 大雨
                else if (mmPerHour > 0.5) rainLevel = Math.max(rainLevel, 2); // 中雨
                else rainLevel = Math.max(rainLevel, 1); // 毛毛雨

                // 极其精准的播报逻辑
                if (i === 0) {
                    rainMsg = '正在下雨 ☔️';
                } else if (i <= 6) { // 30分钟内 (每5分钟一条数据)
                    rainMsg = `注意！${time} 开始下雨`;
                    break;
                } else if (i <= 12) { // 1小时内
                    rainMsg = `1小时内有雨 (${time})`;
                    break;
                } else {
                    rainMsg = `2小时内有雨 (${time})`;
                    break;
                }
            }
        }

        return res.status(200).json({
            success: true,
            isRainingSoon,
            rainMsg,
            rainLevel
        });

    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
