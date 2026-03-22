// ============================================================================
// js/modules/share.js - 荷包管家：Canvas 高清引流海报生成引擎 (彻底修复版)
// ============================================================================

if (typeof window !== 'undefined') {
    window.App = window.App || {};

    const loadCanvasImage = (src) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "Anonymous"; // 解决跨域污染问题
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('图片加载失败'));
            img.src = src; 
        });
    };

    // 🌟 升级版换行：支持最大行数限制，超出会自动补“...”
    const wrapAndTruncateText = (ctx, text, x, y, maxWidth, lineHeight, maxLines) => {
        const words = text.split(''); 
        let line = '';
        let currentY = y;
        let lineCount = 0;
        
        for(let n = 0; n < words.length; n++) {
            const testLine = line + words[n];
            if (ctx.measureText(testLine).width > maxWidth && n > 0) {
                lineCount++;
                if (lineCount === maxLines - 1 && n < words.length - 1) {
                    ctx.fillText(line.substring(0, line.length - 2) + "...", x, currentY);
                    return true;
                }
                ctx.fillText(line, x, currentY);
                line = words[n];
                currentY += lineHeight;
            } else { line = testLine; }
        }
        ctx.fillText(line, x, currentY);
        return false;
    };

    const drawRoundRect = (ctx, x, y, width, height, radius, fill) => {
        ctx.beginPath(); ctx.moveTo(x + radius, y); ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius); ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height); ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius); ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y); ctx.closePath();
        if (fill) ctx.fill();
    };

    window.App.generateAndSharePoster = async function(postTitle, postPrice, postImg, postTag) {
        const toast = (window.App && window.App.showToast) ? window.App.showToast : (window.showToast || alert);
        toast("⏳ 正在为您绘制专属高信用海报...", "info");

        const email = localStorage.getItem('hebao_email') || '';
        const creditScore = parseInt(localStorage.getItem('hebao_credit')) || 100;
        const userName = localStorage.getItem('hp_name') || '新晋荷包蛋';

        try {
            const canvas = document.createElement('canvas');
            canvas.width = 800; canvas.height = 1000;
            const ctx = canvas.getContext('2d');

            // 1. 背景
            const bg = ctx.createLinearGradient(0, 0, 0, 1000);
            bg.addColorStop(0, '#FFFFFF'); bg.addColorStop(1, '#F8FAFC');
            ctx.fillStyle = bg; ctx.fillRect(0, 0, 800, 1000);

            // 2. 顶部 Logo
            ctx.fillStyle = '#111827'; ctx.font = 'bold 32px sans-serif';
            ctx.fillText('📦 荷包管家 · 集市', 40, 60);
            ctx.fillStyle = '#64748B'; ctx.font = '24px sans-serif';
            ctx.fillText('全员实名认证的安全二手社区', 40, 100);

            // 3. 绘制主图
            try {
                const finalImg = (!postImg || postImg === 'undefined') ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800' : postImg;
                const mainImg = await loadCanvasImage(finalImg);
                ctx.save();
                drawRoundRect(ctx, 40, 140, 720, 500, 24, false);
                ctx.clip();
                const scale = Math.max(720 / mainImg.width, 500 / mainImg.height);
                ctx.drawImage(mainImg, 40 + 360 - (mainImg.width/2)*scale, 140 + 250 - (mainImg.height/2)*scale, mainImg.width * scale, mainImg.height * scale);
                ctx.restore();
            } catch (e) { console.warn("主图失败", e); }

            // 4. 价格与标签
            ctx.fillStyle = '#EF4444'; ctx.font = 'bold 64px monospace';
            let pString = postPrice && postPrice !== '0.00' && postPrice !== '0' && postPrice !== '面议' ? `€${postPrice}` : '🤝 面议';
            ctx.fillText(pString, 40, 710);
            
            const priceWidth = ctx.measureText(pString).width;
            const tagX = 40 + priceWidth + 24;
            ctx.fillStyle = '#F3F4F6'; drawRoundRect(ctx, tagX, 670, 140, 48, 12, true);
            ctx.fillStyle = '#475569'; ctx.font = 'bold 22px sans-serif';
            ctx.fillText(postTag || '二手闲置', tagX + 22, 703);

            // 5. 标题与描述 (最多2行)
            ctx.fillStyle = '#111827'; ctx.font = 'bold 36px sans-serif';
            wrapAndTruncateText(ctx, postTitle || '出闲置好物', 40, 780, 520, 50, 2); 

            // 6. 左下角：发帖人信任背书
            ctx.fillStyle = '#111827'; ctx.font = 'bold 26px sans-serif';
            ctx.fillText(userName, 40, 930);

            let crBg = '#F0FDF4', crColor = '#047857', crText = `🟢 信用 ${creditScore}`;
            if (creditScore < 60) { crBg = '#FEF2F2'; crColor = '#DC2626'; crText = `🚫 极低 ${creditScore}`; }
            else if (creditScore < 100) { crBg = '#FFFBEB'; crColor = '#D97706'; crText = `⚠️ 预警 ${creditScore}`; }
            else if (creditScore >= 150) { crBg = '#FEFCE8'; crColor = '#B45309'; crText = `👑 极佳 ${creditScore}`; }
            
            ctx.fillStyle = crBg; drawRoundRect(ctx, 40, 950, 130, 30, 6, true);
            ctx.fillStyle = crColor; ctx.font = 'bold 16px sans-serif';
            ctx.fillText(crText, 50, 971);

            const domain = email.toLowerCase().split('@')[1] || '';
            let uniBg = '', uniColor = '', uniText = '';
            if (domain.includes('tudelft.nl')) { uniBg = '#E0F2FE'; uniColor = '#0EA5E9'; uniText = '🏛️ TUD 认证'; }
            else if (domain.includes('uva.nl')) { uniBg = '#FEE2E2'; uniColor = '#DC2626'; uniText = '❌ UvA 认证'; }
            // 🌟 核心修复点：将 endsOn 改回正确的 endsWith ！！
            else if (domain.endsWith('.edu') || domain.includes('student.')) { uniBg = '#FEF3C7'; uniColor = '#D97706'; uniText = '🎓 实名认证'; }

            if (uniText) {
                ctx.fillStyle = uniBg; drawRoundRect(ctx, 180, 950, 130, 30, 6, true);
                ctx.fillStyle = uniColor; ctx.font = 'bold 16px sans-serif';
                ctx.fillText(uniText, 190, 971);
            }

            // 7. 右下角：二维码引流
            try {
                const appUrl = encodeURIComponent("https://hebaogj.xyz");
                const qrImg = await loadCanvasImage(`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${appUrl}&margin=0`);
                ctx.drawImage(qrImg, 640, 840, 120, 120);
                ctx.fillStyle = '#64748B'; ctx.font = 'bold 14px sans-serif';
                ctx.fillText('扫码前往捡漏', 655, 980);
            } catch (e) { console.warn("二维码失败", e); }

            // 8. 调起手机原生分享或下载
            canvas.toBlob(async (blob) => {
                const file = new File([blob], `hebao-market-${Date.now()}.jpg`, { type: 'image/jpeg' });
                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    try {
                        await navigator.share({
                            title: '荷包管家二手集市',
                            text: `出闲置：${postTitle}`,
                            files: [file]
                        });
                        toast("🎉 海报生成成功！", "success");
                    } catch (err) {}
                } else {
                    const link = document.createElement('a');
                    link.download = `hebao-market-${Date.now()}.jpg`;
                    link.href = canvas.toDataURL('image/jpeg', 0.9);
                    link.click();
                    toast("📸 专属海报已保存到相册！", "success");
                }
            }, 'image/jpeg', 0.9);

        } catch (error) {
            console.error("海报失败:", error);
            toast("生成失败，请稍后重试", "error");
        }
    };
    console.log("🚢 [Hebao Core] 海报引流引擎重构完毕！");
}
