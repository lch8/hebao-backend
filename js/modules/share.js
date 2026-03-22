// ============================================================================
// 🌟 荷包管家：Canvas 原生海报生成与全平台分享引擎 (带信用背书)
// ============================================================================
if (typeof window !== 'undefined') {
    window.App = window.App || {};

    const loadCanvasImage = (src) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('图片加载失败'));
            img.src = src; 
        });
    };

    const wrapText = (ctx, text, x, y, maxWidth, lineHeight) => {
        const words = text.split(''); 
        let line = '';
        let currentY = y;
        for(let n = 0; n < words.length; n++) {
            const testLine = line + words[n];
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && n > 0) {
                ctx.fillText(line, x, currentY);
                line = words[n];
                currentY += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, x, currentY);
        return currentY + lineHeight;
    };

    // 兼容老浏览器的圆角矩形
    const drawRoundRect = (ctx, x, y, width, height, radius, fill, stroke) => {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        if (fill) ctx.fill();
        if (stroke) ctx.stroke();
    };

    // 🌟 核心引擎：接收参数生成海报
    window.App.generateAndSharePoster = async function(postTitle, postPrice, postImg, postTag) {
        if (window.showToast) window.showToast("⏳ 正在绘制专属引流海报...", "info");

        // 从本地读取当前发帖人的真实数据！
        const email = localStorage.getItem('hebao_email') || '';
        const creditScore = parseInt(localStorage.getItem('hebao_credit')) || 100;
        const userName = localStorage.getItem('hp_name') || '新晋荷包蛋';

        try {
            const canvas = document.createElement('canvas');
            canvas.width = 800;
            canvas.height = 1000;
            const ctx = canvas.getContext('2d');

            // 1. 绘制背景
            const bgGradient = ctx.createLinearGradient(0, 0, 0, 1000);
            bgGradient.addColorStop(0, '#FFFFFF');
            bgGradient.addColorStop(1, '#F8FAFC');
            ctx.fillStyle = bgGradient;
            ctx.fillRect(0, 0, 800, 1000);

            // 2. 绘制顶部品牌
            ctx.fillStyle = '#111827';
            ctx.font = 'bold 32px sans-serif';
            ctx.fillText('📦 荷包管家 · 集市', 40, 60);
            ctx.fillStyle = '#64748B';
            ctx.font = '24px sans-serif';
            ctx.fillText('全员实名认证的安全二手社区', 40, 100);

            // 3. 绘制主图
            try {
                const mainImg = await loadCanvasImage(postImg || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800');
                ctx.save();
                drawRoundRect(ctx, 40, 140, 720, 500, 24, false, false);
                ctx.clip();
                const scale = Math.max(720 / mainImg.width, 500 / mainImg.height);
                const x = 40 + (720 / 2) - (mainImg.width / 2) * scale;
                const y = 140 + (500 / 2) - (mainImg.height / 2) * scale;
                ctx.drawImage(mainImg, x, y, mainImg.width * scale, mainImg.height * scale);
                ctx.restore();
            } catch (e) { console.warn("主图加载失败", e); }

            // 4. 绘制价格和标签
            ctx.fillStyle = '#EF4444';
            ctx.font = 'bold 56px monospace';
            ctx.fillText(`€${postPrice}`, 40, 710);

            ctx.fillStyle = '#F1F5F9';
            drawRoundRect(ctx, 40, 740, 120, 36, 8, true, false);
            ctx.fillStyle = '#475569';
            ctx.font = 'bold 20px sans-serif';
            ctx.fillText(postTag || '二手闲置', 55, 765);

            // 5. 绘制标题
            ctx.fillStyle = '#111827';
            ctx.font = 'bold 36px sans-serif';
            wrapText(ctx, postTitle || '出闲置好物', 40, 820, 500, 48);

            // ==========================================
            // 🌟 6. 核心：绘制左下角的“发帖人信任背书”
            // ==========================================
            ctx.fillStyle = '#111827';
            ctx.font = 'bold 24px sans-serif';
            ctx.fillText(userName, 40, 930);

            // 绘制信用分徽章 (根据分数变色)
            let crBg = '#F0FDF4', crColor = '#047857', crText = `🟢 信用 ${creditScore}`;
            if (creditScore < 60) { crBg = '#FEF2F2'; crColor = '#DC2626'; crText = `🚫 极低 ${creditScore}`; }
            else if (creditScore < 100) { crBg = '#FFFBEB'; crColor = '#D97706'; crText = `⚠️ 预警 ${creditScore}`; }
            else if (creditScore >= 150) { crBg = '#FEFCE8'; crColor = '#B45309'; crText = `👑 极佳 ${creditScore}`; }

            ctx.fillStyle = crBg;
            drawRoundRect(ctx, 40, 950, 130, 30, 6, true, false);
            ctx.fillStyle = crColor;
            ctx.font = 'bold 16px sans-serif';
            ctx.fillText(crText, 50, 971);

            // 绘制大学/名企徽章 (简易匹配)
            const domain = email.toLowerCase().split('@')[1] || '';
            let uniBg = '', uniColor = '', uniText = '';
            if (domain.includes('tudelft.nl')) { uniBg = '#E0F2FE'; uniColor = '#0EA5E9'; uniText = '🏛️ TUD 认证'; }
            else if (domain.includes('uva.nl')) { uniBg = '#FEE2E2'; uniColor = '#DC2626'; uniText = '❌ UvA 认证'; }
            else if (domain.includes('vu.nl')) { uniBg = '#DBEAFE'; uniColor = '#2563EB'; uniText = '🦅 VU 认证'; }
            else if (domain.includes('eur.nl')) { uniBg = '#D1FAE5'; uniColor = '#10B981'; uniText = '📈 EUR 认证'; }
            else if (domain.includes('wur.nl')) { uniBg = '#ECFCCB'; uniColor = '#65A30D'; uniText = '🌱 WUR 认证'; }
            else if (domain.includes('asml.com')) { uniBg = '#E2E8F0'; uniColor = '#0F172A'; uniText = '⚙️ ASML 认证'; }
            else if (domain.endsWith('.edu') || domain.includes('student.')) { uniBg = '#FEF3C7'; uniColor = '#D97706'; uniText = '🎓 实名校友'; }

            if (uniText) {
                ctx.fillStyle = uniBg;
                drawRoundRect(ctx, 180, 950, 130, 30, 6, true, false);
                ctx.fillStyle = uniColor;
                ctx.font = 'bold 16px sans-serif';
                ctx.fillText(uniText, 190, 971);
            }

            // 7. 绘制右下角二维码
            try {
                const appUrl = encodeURIComponent("https://hebaogj.xyz");
                const qrImg = await loadCanvasImage(`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${appUrl}&margin=0`);
                ctx.drawImage(qrImg, 640, 840, 120, 120);
                
                ctx.fillStyle = '#64748B';
                ctx.font = 'bold 14px sans-serif';
                ctx.fillText('扫码前往捡漏', 655, 980);
            } catch (e) { console.warn("二维码失败", e); }

            // 8. 导出与原生分享
            canvas.toBlob(async (blob) => {
                const file = new File([blob], `hebao-market-${Date.now()}.jpg`, { type: 'image/jpeg' });
                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    try {
                        await navigator.share({
                            title: '荷包管家二手集市',
                            text: `我在荷包管家出闲置：${postTitle}，只要 €${postPrice}！我是实名认证校友，快来捡漏！`,
                            files: [file]
                        });
                        if (window.showToast) window.showToast("🎉 分享海报生成成功！", "success");
                    } catch (err) { console.log("用户取消", err); }
                } else {
                    const link = document.createElement('a');
                    link.download = `hebao-market-${Date.now()}.jpg`;
                    link.href = canvas.toDataURL('image/jpeg', 0.9);
                    link.click();
                    if (window.showToast) window.showToast("📸 专属海报已保存到相册！", "success");
                }
            }, 'image/jpeg', 0.9);

        } catch (error) {
            console.error(error);
            if (window.showToast) window.showToast("生成失败，请稍后重试", "error");
        }
    };
}
