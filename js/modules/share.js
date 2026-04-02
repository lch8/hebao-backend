// ============================================================================
// js/modules/share.js - 荷包管家：Canvas 高清引流海报引擎 (支持闲置/悬赏/搭子)
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

    const wrapAndTruncateText = (ctx, text, x, y, maxWidth, lineHeight, maxLines) => {
        const words = text.split(''); 
        let line = ''; let currentY = y; let lineCount = 0;
        for(let n = 0; n < words.length; n++) {
            const testLine = line + words[n];
            if (ctx.measureText(testLine).width > maxWidth && n > 0) {
                lineCount++;
                if (lineCount === maxLines - 1 && n < words.length - 1) {
                    ctx.fillText(line.substring(0, line.length - 2) + "...", x, currentY);
                    return true;
                }
                ctx.fillText(line, x, currentY);
                line = words[n]; currentY += lineHeight;
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

    window.App.generateAndSharePoster = async function(postTitle, postPrice, postImg, postTag, extraDesc = '') {
        const toast = (window.App && window.App.showToast) ? window.App.showToast : (window.showToast || alert);
        toast("⏳ 正在为您生成高颜值专属海报...", "info");

        const email = localStorage.getItem('hebao_email') || '';
        const dealCount = parseInt(localStorage.getItem('hebao_deal_count')) || 0;
        const userName = localStorage.getItem('hp_name') || '新晋荷包蛋';

        try {
            const canvas = document.createElement('canvas');
            canvas.width = 800; canvas.height = 1000;
            const ctx = canvas.getContext('2d');

            // 1. 绘制底层背景
            const bg = ctx.createLinearGradient(0, 0, 0, 1000);
            bg.addColorStop(0, '#FFFFFF'); bg.addColorStop(1, '#F8FAFC');
            ctx.fillStyle = bg; ctx.fillRect(0, 0, 800, 1000);

            // 2. 顶部品牌区
            ctx.fillStyle = '#111827'; ctx.font = 'bold 32px sans-serif';
            ctx.fillText('📦 荷包管家', 40, 60);
            ctx.fillStyle = '#64748B'; ctx.font = '24px sans-serif';
            ctx.fillText('留学生全员实名互助社区', 40, 100);

            // ==========================================
            // 🌟 3. 核心魔法：根据分类自动渲染不同风格的主视觉！
            // ==========================================
            const isHelp = postTag && postTag.includes('悬赏');
            const isPartner = postTag && postTag.includes('搭子');

            if (isHelp || isPartner) {
                // 👉 悬赏与搭子：渲染超大渐变色卡片 (不依赖图片)
                ctx.save();
                // 设置不同主题的渐变色
                const cardBg = ctx.createLinearGradient(40, 140, 760, 640);
                if (isHelp) {
                    cardBg.addColorStop(0, '#FDF4FF'); // 浅紫
                    cardBg.addColorStop(1, '#F3E8FF');
                } else {
                    cardBg.addColorStop(0, '#ECFCCB'); // 浅绿
                    cardBg.addColorStop(1, '#D9F99D');
                }
                ctx.fillStyle = cardBg;
                drawRoundRect(ctx, 40, 140, 720, 500, 24, true);

                // 绘制内部装饰大字/Emoji
                ctx.fillStyle = isHelp ? '#9333EA' : '#4D7C0F';
                ctx.font = 'bold 100px sans-serif';
                ctx.fillText(isHelp ? '🆘' : '🏕️', 80, 280);
                
                ctx.font = 'bold 48px sans-serif';
                ctx.fillText(isHelp ? '求助悬赏令' : '寻找搭子组局', 220, 260);

                // 把描述文字画进卡片里！
                ctx.fillStyle = isHelp ? '#7E22CE' : '#3F6212';
                ctx.font = 'bold 28px sans-serif';
                // 利用我们写好的换行引擎，在卡片内部排版
                wrapAndTruncateText(ctx, extraDesc || postTitle, 80, 350, 640, 45, 6); 
                ctx.restore();
            } else {
                // 👉 闲置物品：渲染图片
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
            }

            // ==========================================
            // 4. 下半部分排版 (价格与标题)
            // ==========================================
            ctx.fillStyle = isHelp ? '#9333EA' : '#EF4444'; // 悬赏用紫色强调金额
            ctx.font = 'bold 64px monospace';
            
            // 如果是搭子，价格通常为0，显示“AA制”或“具体商议”
            let pString = '';
            if (isPartner) pString = '🤝 期待加入';
            else pString = (postPrice && postPrice !== '0.00' && postPrice !== '0' && postPrice !== '面议') ? `€${postPrice}` : '🤝 面议';
            
            ctx.fillText(pString, 40, 710);
            
            const priceWidth = ctx.measureText(pString).width;
            const tagX = 40 + priceWidth + 24;
            ctx.fillStyle = '#F3F4F6'; drawRoundRect(ctx, tagX, 670, 140, 48, 12, true);
            ctx.fillStyle = '#475569'; ctx.font = 'bold 22px sans-serif';
            ctx.fillText(postTag || '二手闲置', tagX + 22, 703);

            // 标题
            ctx.fillStyle = '#111827'; ctx.font = 'bold 36px sans-serif';
            wrapAndTruncateText(ctx, postTitle || '快来帮帮我吧', 40, 780, 520, 50, 2); 

            // ==========================================
            // 5. 左下角：发帖人信任背书
            // ==========================================
            ctx.fillStyle = '#111827'; ctx.font = 'bold 26px sans-serif';
            ctx.fillText(userName, 40, 930);

            let crBg = '#ECFDF5', crColor = '#047857', crText = `🤝 ${dealCount} 单成交`;
            if (dealCount === 0)  { crBg = '#F3F4F6'; crColor = '#6B7280'; crText = `🤝 新手卖家`; }
            else if (dealCount >= 10) { crBg = '#FEFCE8'; crColor = '#B45309'; crText = `👑 ${dealCount} 单老司机`; }
            
            ctx.fillStyle = crBg; drawRoundRect(ctx, 40, 950, 130, 30, 6, true);
            ctx.fillStyle = crColor; ctx.font = 'bold 16px sans-serif';
            ctx.fillText(crText, 50, 971);

            const domain = email.toLowerCase().split('@')[1] || '';
            let uniBg = '', uniColor = '', uniText = '';
            if (domain.includes('tudelft.nl')) { uniBg = '#E0F2FE'; uniColor = '#0EA5E9'; uniText = '🏛️ TUD 认证'; }
            else if (domain.includes('uva.nl')) { uniBg = '#FEE2E2'; uniColor = '#DC2626'; uniText = '❌ UvA 认证'; }
            else if (domain.endsWith('.edu') || domain.includes('student.')) { uniBg = '#FEF3C7'; uniColor = '#D97706'; uniText = '🎓 实名校友'; }

            if (uniText) {
                ctx.fillStyle = uniBg; drawRoundRect(ctx, 180, 950, 130, 30, 6, true);
                ctx.fillStyle = uniColor; ctx.font = 'bold 16px sans-serif';
                ctx.fillText(uniText, 190, 971);
            }

            // 6. 右下角：二维码引流
            try {
                const appUrl = encodeURIComponent("https://hebaogj.xyz");
                const qrImg = await loadCanvasImage(`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${appUrl}&margin=0`);
                ctx.drawImage(qrImg, 640, 840, 120, 120);
                ctx.fillStyle = '#64748B'; ctx.font = 'bold 14px sans-serif';
                ctx.fillText('扫码前往加入', 655, 980);
            } catch (e) { console.warn("二维码失败", e); }

            // 7. 导出分享
            canvas.toBlob(async (blob) => {
                const file = new File([blob], `hebao-share-${Date.now()}.jpg`, { type: 'image/jpeg' });
                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    try {
                        await navigator.share({
                            title: '荷包管家请求支援',
                            text: `${postTitle}！快来加入荷包管家！`,
                            files: [file]
                        });
                        toast("🎉 海报生成成功！", "success");
                    } catch (err) {}
                } else {
                    const link = document.createElement('a');
                    link.download = `hebao-share-${Date.now()}.jpg`;
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
    console.log("🚢 [Hebao Core] 全场景海报引擎已就绪！");
}
