// download-cards.js
const fs = require('fs');
const path = require('path');

// ⚙️ 配置区
const INPUT_FILE = './js/data/daily-cards.js';        // 你的原始源文件路径
const OUTPUT_FILE = './js/data/daily-cards-new.js';   // 替换完成后的新文件路径
const IMAGE_DIR = './images/cards';                   // 图片下载到本地的哪个目录

// 🌐 你的云存储域名 (记得最后要有斜杠) 
// 如果你想先在本地测试，可以写相对路径：'./images/cards/'
const MY_DOMAIN = 'https://your-oss-bucket.oss-eu-central-1.aliyuncs.com/cards/'; 

// 确保图片下载目录存在
if (!fs.existsSync(IMAGE_DIR)) {
    fs.mkdirSync(IMAGE_DIR, { recursive: true });
}

async function run() {
    console.log("🔍 开始读取配置文件...");
    let content = fs.readFileSync(INPUT_FILE, 'utf-8');
    
    // 正则表达式匹配 imgUrl
    const urlRegex = /imgUrl:\s*['"](https?:\/\/[^'"]+)['"]/g;
    const urls = [];
    let match;
    
    while ((match = urlRegex.exec(content)) !== null) {
        urls.push(match[1]);
    }

    console.log(`📦 共找到 ${urls.length} 张图片，准备开始下载...\n`);

    for (let i = 0; i < urls.length; i++) {
        const imgUrl = urls[i];
        try {
            // 1. 生成安全的文件名 (处理 URL 编码和非法字符)
            let rawName = decodeURIComponent(imgUrl.split('/').pop().split('?')[0]);
            rawName = rawName.replace(/[^a-zA-Z0-9.\-_]/g, '_'); // 过滤掉奇怪的符号
            const fileName = `card_${String(i + 1).padStart(2, '0')}_${rawName}`;
            
            const destPath = path.join(IMAGE_DIR, fileName);
            const newUrl = MY_DOMAIN + fileName;

            console.log(`⏳ [${i + 1}/${urls.length}] 下载中: ${fileName}`);
            
            // 2. 发起请求 (必须伪装 User-Agent，否则 Wikimedia 会报 403)
            const res = await fetch(imgUrl, {
                headers: { 
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' 
                }
            });
            
            if (!res.ok) throw new Error(`HTTP 报错: ${res.status}`);
            
            // 3. 写入本地硬盘
            const buffer = await res.arrayBuffer();
            fs.writeFileSync(destPath, Buffer.from(buffer));

            // 4. 在代码字符串中替换为你的新 URL
            content = content.replace(imgUrl, newUrl);

        } catch (err) {
            console.error(`❌ 下载失败 [${imgUrl}]: ${err.message}`);
        }
    }

    // 5. 保存新的 JS 文件
    fs.writeFileSync(OUTPUT_FILE, content, 'utf-8');
    console.log(`\n🎉 全部完成！`);
    console.log(`📂 图片已保存在: ${IMAGE_DIR}`);
    console.log(`📄 新的配置文件已生成: ${OUTPUT_FILE}`);
    console.log(`\n👉 下一步: 请将 ${IMAGE_DIR} 里的图片上传到你的云存储，然后把 ${OUTPUT_FILE} 重命名覆盖原来的文件即可！`);
}

// 执行脚本 (需要 Node.js v18 以上版本)
run();
