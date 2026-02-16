// 清理并重构整个文件
(function() {
    'use strict';
    
    // 配置
    const CONFIG = {
        API_KEY: 'KNFBZ-BQM66-SJWSD-MRR4K-5V3EZ-IZBMF',
        MAX_RETRIES: 6,
        RETRY_DELAY: 1500,
        TIMEOUT: 5000,
        DEFAULT_LOCATION: {
            lng: 108.063431,
            lat: 34.263566
        }
    };
    
    // 状态管理
    const state = {
        ipLocation: null,
        retryCount: 0,
        isFetching: false
    };
    
    // 欢迎语文本映射
    const welcomeMessages = {
        countries: {
            '日本': 'よろしく，一起去看樱花吗',
            '美国': 'Let us live in peace!',
            '英国': '想同你一起夜乘伦敦眼',
            '俄罗斯': '干了这瓶伏特加！',
            '法国': 'C\'est La Vie',
            '德国': 'Die Zeit verging im Fluge.',
            '澳大利亚': '一起去大堡礁吧！',
            '加拿大': '拾起一片枫叶赠予你'
        },
        provinces: {
            '北京市': '北——京——欢迎你~~~',
            '天津市': '讲段相声吧。',
            '河北省': '山势巍巍成壁垒，天下雄关。铁马金戈由此向，无限江山。',
            '山西省': '展开坐具长三尺，已占山河五百余。',
            '内蒙古自治区': '天苍苍，野茫茫，风吹草低见牛羊。',
            '辽宁省': '我想吃烤鸡架！',
            '吉林省': '状元阁就是东北烧烤之王。',
            '黑龙江省': '很喜欢哈尔滨大剧院。',
            '上海市': '众所周知，中国只有两个城市。',
            '浙江省': '东风渐绿西湖柳，雁已还人未南归。',
            '安徽省': '蚌埠住了，芜湖起飞。',
            '福建省': '井邑白云间，岩城远带山。',
            '江西省': '落霞与孤鹜齐飞，秋水共长天一色。',
            '山东省': '遥望齐州九点烟，一泓海水杯中泻。',
            '湖北省': '来碗热干面！',
            '湖南省': '74751，长沙斯塔克。',
            '广东省': '老板来两斤福建人。',
            '广西壮族自治区': '桂林山水甲天下。',
            '海南省': '朝观日出逐白浪，夕看云起收霞光。',
            '四川省': '康康川妹子。',
            '贵州省': '茅台，学生，再塞200。',
            '云南省': '玉龙飞舞云缠绕，万仞冰川直耸天。',
            '西藏自治区': '躺在茫茫草原上，仰望蓝天。',
            '陕西省': '来份臊子面加馍。',
            '甘肃省': '羌笛何须怨杨柳，春风不度玉门关。',
            '青海省': '牛肉干和老酸奶都好好吃。',
            '宁夏回族自治区': '大漠孤烟直，长河落日圆。',
            '新疆维吾尔自治区': '驼铃古道丝绸路，胡马犹闻唐汉风。',
            '台湾省': '我在这头，大陆在那头。',
            '香港特别行政区': '永定贼有残留地鬼嚎，迎击光非岁玉。',
            '澳门特别行政区': '性感荷官，在线发牌。'
        },
        cities: {
            '南京市': '这是我挺想去的城市啦。',
            '苏州市': '上有天堂，下有苏杭。',
            '郑州市': '豫州之域，天地之中。',
            '南阳市': '臣本布衣，躬耕于南阳。此南阳非彼南阳！',
            '驻马店市': '峰峰有奇石，石石挟仙气。嵖岈山的花很美哦！',
            '开封市': '刚正不阿包青天。',
            '洛阳市': '洛阳牡丹甲天下。'
        }
    };
    
    // 获取IP定位
    function fetchIpLocation() {
        if (state.isFetching) return;
        state.isFetching = true;
        
        return $.ajax({
            type: 'GET',
            url: 'https://apis.map.qq.com/ws/location/v1/ip',
            data: {
                key: CONFIG.API_KEY,
                output: 'jsonp'
            },
            dataType: 'jsonp',
            timeout: CONFIG.TIMEOUT,
            success: handleSuccess,
            error: handleError
        });
    }
    
    // 处理成功响应
    function handleSuccess(res) {
        state.isFetching = false;
        
        if (res && res.status === 0 && res.result && res.result.location) {
            state.ipLocation = res;
            showWelcome();
        } else {
            console.error('腾讯地图 API 返回错误:', res);
            handleRetry();
        }
    }
    
    // 处理错误
    function handleError(xhr, status, error) {
        state.isFetching = false;
        console.error('腾讯地图 API 请求失败:', status, error);
        handleRetry();
    }
    
    // 重试逻辑
    function handleRetry() {
        if (state.retryCount < CONFIG.MAX_RETRIES) {
            state.retryCount++;
            console.log(`腾讯地图 API 第 ${state.retryCount} 次重试...`);
            setTimeout(fetchIpLocation, CONFIG.RETRY_DELAY);
        } else {
            console.warn('腾讯地图 API 重试次数已达上限，使用默认位置');
            // 使用默认位置
            state.ipLocation = {
                result: {
                    location: { lng: 0, lat: 0 },
                    ad_info: { nation: '未知', province: '', city: '', district: '' },
                    ip: '0.0.0.0'
                }
            };
            showWelcome();
        }
    }
    
    // 计算距离
    function getDistance(e1, n1, e2, n2) {
        const R = 6371;
        const { sin, cos, asin, PI, hypot } = Math;
        
        const getPoint = (e, n) => {
            e *= PI / 180;
            n *= PI / 180;
            return { 
                x: cos(n) * cos(e), 
                y: cos(n) * sin(e), 
                z: sin(n) 
            };
        };
        
        const a = getPoint(e1, n1);
        const b = getPoint(e2, n2);
        const c = hypot(a.x - b.x, a.y - b.y, a.z - b.z);
        const r = asin(c / 2) * 2 * R;
        return Math.round(r);
    }
    
    // 获取时间问候语
    function getTimeGreeting() {
        const hour = new Date().getHours();
        
        if (hour >= 5 && hour < 11) return '<span>上午好</span>，一日之计在于晨！';
        if (hour >= 11 && hour < 13) return '<span>中午好</span>，该摸鱼吃午饭了。';
        if (hour >= 13 && hour < 15) return '<span>下午好</span>，懒懒地睡个午觉吧！';
        if (hour >= 15 && hour < 16) return '<span>三点几啦</span>，一起饮茶呀！';
        if (hour >= 16 && hour < 19) return '<span>夕阳无限好！</span>';
        if (hour >= 19 && hour < 24) return '<span>晚上好</span>，夜生活嗨起来！';
        return '夜深了，早点休息，少熬夜。';
    }
    
    // 获取位置描述
    function getLocationDesc(location) {
        const adInfo = location.result.ad_info;
        const nation = adInfo.nation;
        const province = adInfo.province;
        const city = adInfo.city;
        
        // 国外
        if (nation !== '中国') {
            return welcomeMessages.countries[nation] || '带我去你的国家逛逛吧。';
        }
        
        // 中国城市级别
        if (welcomeMessages.cities[city]) {
            return welcomeMessages.cities[city];
        }
        
        // 江苏省特殊处理
        if (province === '江苏省') {
            return welcomeMessages.cities[city] || '散装是必须要散装的。';
        }
        
        // 河南省特殊处理
        if (province === '河南省') {
            return welcomeMessages.cities[city] || '可否带我品尝河南烩面啦？';
        }
        
        // 省份级别
        return welcomeMessages.provinces[province] || '带我去你的城市逛逛吧！';
    }
    
    // 显示欢迎信息
    function showWelcome() {
        if (!state.ipLocation) {
            handleRetry();
            return;
        }
        
        const location = state.ipLocation;
        const result = location.result;
        const adInfo = result.ad_info;
        
        const lng = result.location?.lng || 0;
        const lat = result.location?.lat || 0;
        const dist = getDistance(CONFIG.DEFAULT_LOCATION.lng, CONFIG.DEFAULT_LOCATION.lat, lng, lat);
        
        let pos;
        if (adInfo.nation === '中国') {
            pos = `${adInfo.province} ${adInfo.city} ${adInfo.district}`.trim();
        } else {
            pos = adInfo.nation || '未知';
        }
        
        const ip = result.ip || '';
        const posDesc = getLocationDesc(location);
        const timeGreeting = getTimeGreeting();
        
        const welcomeInfo = document.getElementById('welcome-info');
        if (welcomeInfo) {
            welcomeInfo.innerHTML = `
                <b>
                    <center>🎉 欢迎信息 🎉</center>
                    &emsp;&emsp;欢迎来自 <span style="color:var(--theme-color)">${pos}</span> 的小伙伴，${timeGreeting}
                    您现在距离站长约 <span style="color:var(--theme-color)">${dist}</span> 公里，
                    当前的IP地址为： <span style="color:var(--theme-color)">${ip}</span>， ${posDesc}
                </b>
            `;
        }
    }
    
    // 初始化
    function init() {
        fetchIpLocation();
    }
    
    // 页面加载完成后执行
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // PJAX 支持
    document.addEventListener('pjax:complete', showWelcome);
    
})();

