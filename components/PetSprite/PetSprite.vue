<template>
  <view
    v-if="visible"
    class="pet-sprite"
    @touchstart="onTouchStart"
    @touchmove.stop.prevent="onTouchMove"
    @touchend="onTouchEnd"
    @tap="onTap"
  >
    <image
      :src="petImg"
      mode="aspectFit"
      :class="['pet-img', petState]"
      :style="{ width: petSize + 'rpx', height: petSize + 'rpx' }"
      @error="onImgError"
    />
    <view v-if="bubbleText" class="pet-bubble">
      <text class="pet-bubble-text">{{ bubbleText }}</text>
    </view>
  </view>
</template>

<script>
// 三月七 Q 版桌宠：AI 生成的透明背景 PNG 素材，支持多表情 + 互动动作
// 素材：
//   /static/pet/march7-bust.png  待机眯眼微笑
//   /static/pet/march7-happy.png 开心睁眼笑
//   /static/pet/march7-silly.png 搞怪 wink 吐舌
//   /static/pet/march7-angry.png 生气嘟嘴
//   /static/pet/march7-blush.png 红温害羞捂脸
//   /static/pet/march7-cry.png   流泪大哭
//   /static/pet/march7-laugh.png 狂喜大笑捧腹
// 动作：wave 挥手 / spin 转圈圈 / blink 眨眼 / tongue 吐舌 / happy 弹跳 / roll 打滚
//        nod 点头 / shake 摇头 / surprise 惊讶 / dance 跳舞
//        angry 生气 / blush 红温 / cry 流泪 / laugh 大笑
export default {
  name: 'PetSprite',
  props: {
    // 固定显示尺寸（rpx）
    petSize: { type: Number, default: 150 },
    // 是否可拖拽（false 表示固定在原位互动）
    draggable: { type: Boolean, default: false }
  },
  data() {
    return {
      visible: true,
      petState: 'idle',
      bubbleText: '',
      bubbleTimer: null,
      isDragging: false,
      stateTimer: null,
      idleTimer: null,
      imgFailed: false,
      moodMessages: [
        '记一笔吧~',
        '今天花了多少？',
        '合理消费哦！',
        '又要剁手啦？',
        '省钱大作战！',
        '记得记账呀~',
        '钱包还好吗？'
      ],
      tapMessages: [
        '哎呀！别戳我~',
        '我在看着你呢',
        '戳我没用，去记账！',
        '嘿嘿，痒痒的~',
        '你好呀~',
        '别闹啦，快记账！'
      ],
      waveMessages: [
        '嗨~你好呀！',
        '嘿，来记账吧~',
        '哈喽！'
      ],
      blinkMessages: [
        '眨眨眼~',
        '看着你呢~',
        '嘿嘿~'
      ],
      tongueMessages: [
        '略略略~',
        '吐舌头！',
        '就不记账，略~'
      ],
      nodMessages: [
        '嗯嗯，没问题~',
        '好哒好哒~',
        '收到！'
      ],
      shakeMessages: [
        '不不不~',
        '才不要呢！',
        '别这样嘛~'
      ],
      surpriseMessages: [
        '哇！吓我一跳！',
        '哎呀！',
        '什么什么？'
      ],
      danceMessages: [
        '啦啦啦~',
        '开心到跳舞！',
        '今天心情好~'
      ],
      spinMessages: [
        '转圈圈~嘿嘿！',
        ' woo~好晕好晕！',
        '看我旋转！'
      ],
      angryMessages: [
        '哼！不理你了！',
        '气死我了！',
        '再不记账就生气了！',
        '哼，别惹我~'
      ],
      blushMessages: [
        '呀~好害羞！',
        '别、别看我啦！',
        '脸好烫...'
      ],
      cryMessages: [
        '呜呜呜...钱包空了',
        '又花超了...呜呜',
        '好想哭啊...',
        '呜，要吃土了'
      ],
      laughMessages: [
        '哈哈哈哈！',
        '笑死我了！',
        '今天好开心！哈哈！',
        '嘻嘻嘻嘻~'
      ]
    }
  },
  computed: {
    petImg() {
      if (this.imgFailed) return this.buildSvg()
      var s = this.petState
      // 开心类：happy / wave / nod / dance → 开心表情
      if (s === 'happy' || s === 'wave' || s === 'spin' || s === 'nod' || s === 'dance') return '/static/pet/march7-happy.png'
      // 搞怪类：roll / tongue / drag / shake / surprise → 搞怪表情
      if (s === 'roll' || s === 'tongue' || s === 'drag' || s === 'shake' || s === 'surprise') return '/static/pet/march7-silly.png'
      // 生气
      if (s === 'angry') return '/static/pet/march7-angry.png'
      // 红温害羞
      if (s === 'blush') return '/static/pet/march7-blush.png'
      // 流泪大哭
      if (s === 'cry') return '/static/pet/march7-cry.png'
      // 狂喜大笑
      if (s === 'laugh') return '/static/pet/march7-laugh.png'
      return '/static/pet/march7-bust.png'
    }
  },
  mounted() {
    this.startIdleBehavior()
  },
  beforeDestroy() {
    this.clearAllTimers()
  },
  methods: {
    // 素材加载失败时回退到 SVG 手绘形象
    onImgError() {
      this.imgFailed = true
    },
    buildSvg() {
      // ============ 渐变定义 ============
      var defs = '<defs>' +
        '<linearGradient id="hg" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0%" stop-color="#fff5f0"/>' +
        '<stop offset="55%" stop-color="#ffd6e8"/>' +
        '<stop offset="100%" stop-color="#ff9ec4"/>' +
        '</linearGradient>' +
        '<linearGradient id="cg" x1="0" y1="0" x2="1" y2="1">' +
        '<stop offset="0%" stop-color="#c4b5fd"/>' +
        '<stop offset="60%" stop-color="#93c5fd"/>' +
        '<stop offset="100%" stop-color="#7dd3fc"/>' +
        '</linearGradient>' +
        '<linearGradient id="bg" x1="0" y1="0" x2="1" y2="0">' +
        '<stop offset="0%" stop-color="#a5b4fc"/>' +
        '<stop offset="100%" stop-color="#f9a8d4"/>' +
        '</linearGradient>' +
        '<linearGradient id="eg" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0%" stop-color="#fb7185"/>' +
        '<stop offset="100%" stop-color="#38bdf8"/>' +
        '</linearGradient>' +
        '</defs>'

      var hair =
        '<path d="M24 40c-3-16 6-26 26-26s29 10 26 26c-2-5-7-7-12-5-2-4-5-6-10-5-3-3-6-4-7-8-2 4-4 5-7 8-5-1-8 1-10 5-5-2-8 0-11 5z" fill="url(#hg)" stroke="#f2a0c4" stroke-width="1"/>' +
        '<path d="M26 32c-2-4-2-8 0-12M34 26c-1-4 0-8 3-11M66 28c2-4 2-8 0-12M58 24c1-4-2-8-4-10" stroke="#f2a0c4" stroke-width="0.8" fill="none" stroke-linecap="round"/>'

      var bow =
        '<path d="M28 20c-5-3-9 0-9 5c0 4 4 7 9 5c1-2 1-8 0-10z" fill="url(#bg)" stroke="#a5b4fc" stroke-width="0.5"/>' +
        '<path d="M28 20c5-3 9 0 9 5c0 4-4 7-9 5c-1-2-1-8 0-10z" fill="url(#bg)" stroke="#a5b4fc" stroke-width="0.5"/>' +
        '<circle cx="28" cy="20" r="2" fill="#fbbf24"/>'

      var head = '<ellipse cx="50" cy="52" rx="20" ry="18" fill="#fff5ee" stroke="#f2c6d8" stroke-width="0.5"/>'

      var eyes
      if (this.petState === 'drag' || this.petState === 'blink') {
        eyes = '<circle cx="42" cy="50" r="3" fill="#3a2a4a"/><circle cx="58" cy="50" r="3" fill="#3a2a4a"/>'
      } else {
        eyes = '<ellipse cx="42" cy="50" rx="4.5" ry="5.5" fill="url(#eg)"/>' +
          '<circle cx="43.5" cy="48.5" r="1.8" fill="#fff"/>' +
          '<ellipse cx="58" cy="50" rx="4.5" ry="5.5" fill="url(#eg)"/>' +
          '<circle cx="59.5" cy="48.5" r="1.8" fill="#fff"/>'
      }

      var mouth
      if (this.petState === 'tongue') {
        mouth = '<path d="M46 56q4 3 8 0" stroke="#3a2a4a" stroke-width="1.6" fill="none" stroke-linecap="round"/>' +
          '<path d="M48 58q2 5 0 8" stroke="#fb7185" stroke-width="2.4" fill="none" stroke-linecap="round"/>'
      } else {
        mouth = '<path d="M46 56q4 3 8 0" stroke="#3a2a4a" stroke-width="1.6" fill="none" stroke-linecap="round"/>'
      }

      var blush = '<ellipse cx="35" cy="56" rx="3.5" ry="2.5" fill="#ffb3c1" opacity="0.5"/>' +
        '<ellipse cx="65" cy="56" rx="3.5" ry="2.5" fill="#ffb3c1" opacity="0.5"/>'

      var body
      if (this.petState === 'roll') {
        body = '<ellipse cx="50" cy="78" rx="22" ry="16" fill="url(#cg)" stroke="#7aa5f0" stroke-width="0.8"/>' +
          '<path d="M44 76h4M44 80h4M56 76h4M56 80h4" stroke="#fff" stroke-width="1" stroke-linecap="round" opacity="0.6"/>'
      } else {
        body = '<path d="M30 70c4-8 14-10 24-8c8 2 14 4 18 8c4 4 2 10-4 12c-6 2-20 3-28 1c-8-2-12-5-10-13z" fill="url(#cg)" stroke="#7aa5f0" stroke-width="0.8"/>' +
          '<path d="M40 64l6 4 6-4" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
          '<circle cx="50" cy="72" r="1.5" fill="#fbbf24"/><circle cx="50" cy="78" r="1.5" fill="#fbbf24"/>' +
          '<path d="M28 70c-5-2-9 1-10 4" stroke="#93c5fd" stroke-width="4" fill="none" stroke-linecap="round"/>' +
          '<path d="M72 70c5-2 9 1 10 4" stroke="#93c5fd" stroke-width="4" fill="none" stroke-linecap="round"/>' +
          '<path d="M34 84c-3 3-6 4-9 3" stroke="#7aa5f0" stroke-width="4" fill="none" stroke-linecap="round"/>' +
          '<path d="M66 84c3 3 6 4 9 3" stroke="#7aa5f0" stroke-width="4" fill="none" stroke-linecap="round"/>' +
          '<path d="M40 78h20v6c0 2-2 3-4 3h-12c-2 0-4-1-4-3v-6z" fill="#fff" stroke="#cbd5e1" stroke-width="0.6"/>'
      }

      var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">' +
        defs + hair + bow + head + eyes + mouth + blush + body +
        '</svg>'
      return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
    },
    show() { this.visible = true; this.startIdleBehavior() },
    hide() { this.visible = false; this.clearAllTimers() },
    onTap() {
      if (this.isDragging) return
      // 随机触发：挥手 / 转圈圈 / 眨眼 / 吐舌 / 弹跳 / 打滚 / 点头 / 摇头 / 惊讶 / 跳舞 / 生气 / 红温 / 流泪 / 大笑
      var actions = ['wave', 'spin', 'blink', 'tongue', 'happy', 'roll', 'nod', 'shake', 'surprise', 'dance', 'angry', 'blush', 'cry', 'laugh']
      var action = actions[Math.floor(Math.random() * actions.length)]
      this.performAction(action)
    },
    // 执行一个互动动作（对应表情 + 动画 + 文字）
    performAction(action) {
      var self = this
      var msgList
      if (action === 'wave') {
        this.setState('wave')
        msgList = this.waveMessages
      } else if (action === 'blink') {
        this.petState = 'blink'
        if (this.stateTimer) clearTimeout(this.stateTimer)
        msgList = this.blinkMessages
        this.stateTimer = setTimeout(function() { self.petState = 'idle' }, 1200)
      } else if (action === 'tongue') {
        this.setState('tongue')
        msgList = this.tongueMessages
      } else if (action === 'happy') {
        this.setState('happy')
        msgList = this.tapMessages
      } else if (action === 'roll') {
        this.setState('roll')
        msgList = this.tapMessages
      } else if (action === 'nod') {
        this.setState('nod')
        msgList = this.nodMessages
      } else if (action === 'shake') {
        this.setState('shake')
        msgList = this.shakeMessages
      } else if (action === 'surprise') {
        this.setState('surprise')
        msgList = this.surpriseMessages
      } else if (action === 'spin') {
        this.setState('spin')
        msgList = this.spinMessages
      } else if (action === 'dance') {
        this.setState('dance')
        msgList = this.danceMessages
      } else if (action === 'angry') {
        this.setState('angry')
        msgList = this.angryMessages
      } else if (action === 'blush') {
        this.setState('blush')
        msgList = this.blushMessages
      } else if (action === 'cry') {
        this.setState('cry')
        msgList = this.cryMessages
      } else if (action === 'laugh') {
        this.setState('laugh')
        msgList = this.laughMessages
      }
      if (msgList) {
        this.showBubble(msgList[Math.floor(Math.random() * msgList.length)])
      }
    },
    onTouchStart(e) {
      if (!this.draggable) return
      var touch = e.touches[0]
      this.touchStartX = touch.clientX
      this.touchStartY = touch.clientY
      this.isDragging = false
    },
    onTouchMove(e) {
      if (!this.draggable) return
      var touch = e.touches[0]
      var dx = touch.clientX - this.touchStartX
      var dy = touch.clientY - this.touchStartY
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        this.isDragging = true
        this.setState('drag')
      }
    },
    onTouchEnd() {
      if (this.isDragging) {
        this.setState('happy')
        this.showBubble('哎呀~')
        var self = this
        setTimeout(function() { self.setState('idle') }, 1500)
      }
      this.isDragging = false
    },
    setState(state) {
      this.petState = state
      if (this.stateTimer) clearTimeout(this.stateTimer)
      var self = this
      var durations = {
        happy: 2200, wave: 2400, spin: 2800, roll: 2600, tongue: 1800,
        nod: 1600, shake: 1600, surprise: 1400, dance: 2800,
        angry: 2600, blush: 2400, cry: 3000, laugh: 2600
      }
      if (durations[state]) {
        this.stateTimer = setTimeout(function() { self.petState = 'idle' }, durations[state])
      }
    },
    showBubble(text) {
      this.bubbleText = text
      if (this.bubbleTimer) clearTimeout(this.bubbleTimer)
      var self = this
      this.bubbleTimer = setTimeout(function() { self.bubbleText = '' }, 2500)
    },
    startIdleBehavior() {
      this.stopIdleBehavior()
      var self = this
      this.idleTimer = setInterval(function() {
        if (self.petState !== 'idle') return
        var rand = Math.random()
        if (rand < 0.12) {
          self.showBubble(self.moodMessages[Math.floor(Math.random() * self.moodMessages.length)])
        } else if (rand < 0.24) {
          // 空闲时随机做小动作
          var idleActions = ['wave', 'spin', 'blink', 'tongue', 'nod', 'shake', 'surprise', 'dance', 'angry', 'blush', 'cry', 'laugh']
          self.performAction(idleActions[Math.floor(Math.random() * idleActions.length)])
        }
      }, 4500)
    },
    stopIdleBehavior() {
      if (this.idleTimer) { clearInterval(this.idleTimer); this.idleTimer = null }
    },
    clearAllTimers() {
      this.stopIdleBehavior()
      if (this.stateTimer) clearTimeout(this.stateTimer)
      if (this.bubbleTimer) clearTimeout(this.bubbleTimer)
    }
  }
}
</script>

<style scoped>
.pet-sprite {
  position: relative;
  z-index: 10;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
}

.pet-img {
  transition: transform 0.3s ease;
  filter: drop-shadow(0 2rpx 6rpx rgba(0,0,0,0.08));
}

/* 待机：轻轻上下浮动 + 微微摇摆 */
.pet-img.idle {
  animation: pet-bob 2.4s ease-in-out infinite;
}

/* 挥手：大幅摇摆 */
.pet-img.wave {
  animation: pet-wave 0.45s ease-in-out 5;
}

/* 转圈圈：360°旋转 */
.pet-img.spin {
  animation: pet-spin 1.1s ease-in-out 2;
}

/* 眨眼：快速垂直缩放 */
.pet-img.blink {
  animation: pet-blink 0.35s ease-in-out 2;
}

/* 弹跳 */
.pet-img.happy {
  animation: pet-jump 0.5s ease-in-out 2;
}

/* 打滚：左右轻转 */
.pet-img.roll {
  animation: pet-swing 0.7s ease-in-out 4;
}

/* 吐舌：晃动 */
.pet-img.tongue {
  animation: pet-wiggle 0.3s ease-in-out 4;
}

/* 点头：上下点头 */
.pet-img.nod {
  animation: pet-nod 0.4s ease-in-out 3;
}

/* 摇头：左右摇头 */
.pet-img.shake {
  animation: pet-shake 0.3s ease-in-out 5;
}

/* 惊讶：快速放大缩回 */
.pet-img.surprise {
  animation: pet-surprise 0.25s ease-out 2;
}

/* 跳舞：组合摇摆+弹跳 */
.pet-img.dance {
  animation: pet-dance 0.6s ease-in-out 4;
}

/* 生气：发抖+轻微跳动 */
.pet-img.angry {
  animation: pet-angry 0.15s ease-in-out infinite;
}

/* 红温：左右晃动+缩放 */
.pet-img.blush {
  animation: pet-blush 0.5s ease-in-out 4;
}

/* 流泪：微微下沉抖动 */
.pet-img.cry {
  animation: pet-cry 0.3s ease-in-out 6;
}

/* 大笑：上下弹跳+摇摆 */
.pet-img.laugh {
  animation: pet-laugh 0.35s ease-in-out 6;
}

/* 拖拽晃动 */
.pet-img.drag {
  animation: pet-wiggle 0.3s ease-in-out infinite;
}

@keyframes pet-bob {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  25% { transform: translateY(-5px) rotate(-2deg); }
  50% { transform: translateY(0) rotate(0deg); }
  75% { transform: translateY(-5px) rotate(2deg); }
}

/* 挥手：大幅左右摇摆 + 轻微上下 */
@keyframes pet-wave {
  0%, 100% { transform: rotate(0deg) translateY(0); }
  20% { transform: rotate(-15deg) translateY(-5px); }
  40% { transform: rotate(2deg) translateY(0); }
  60% { transform: rotate(15deg) translateY(-5px); }
  80% { transform: rotate(-2deg) translateY(0); }
}

/* 转圈圈：完整360°旋转 */
@keyframes pet-spin {
  0% { transform: rotate(0deg) scale(1); }
  25% { transform: rotate(90deg) scale(0.92); }
  50% { transform: rotate(180deg) scale(0.88); }
  75% { transform: rotate(270deg) scale(0.92); }
  100% { transform: rotate(360deg) scale(1); }
}

/* 眨眼：快速垂直缩放 */
@keyframes pet-blink {
  0%, 100% { transform: scale(1, 1); }
  40% { transform: scale(1, 0.55); }
  60% { transform: scale(1, 0.55); }
}

/* 弹跳 */
@keyframes pet-jump {
  0%, 100% { transform: translateY(0) scale(1); }
  40% { transform: translateY(-10px) scale(1.05); }
}

/* 打滚：左右轻转 */
@keyframes pet-swing {
  0% { transform: rotate(0deg) scale(1); }
  30% { transform: rotate(-12deg) scale(0.96); }
  70% { transform: rotate(12deg) scale(0.96); }
  100% { transform: rotate(0deg) scale(1); }
}

/* 晃动 */
@keyframes pet-wiggle {
  0%, 100% { transform: rotate(-6deg); }
  50% { transform: rotate(6deg); }
}

/* 点头：上下点头 */
@keyframes pet-nod {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(3px) rotate(0deg); }
}

/* 摇头：左右摇头 */
@keyframes pet-shake {
  0%, 100% { transform: translateX(0) rotate(0deg); }
  25% { transform: translateX(-5px) rotate(-5deg); }
  75% { transform: translateX(5px) rotate(5deg); }
}

/* 惊讶：快速放大缩回 */
@keyframes pet-surprise {
  0% { transform: scale(1); }
  40% { transform: scale(1.15); }
  100% { transform: scale(1); }
}

/* 跳舞：组合摇摆+弹跳 */
@keyframes pet-dance {
  0% { transform: translateY(0) rotate(0deg); }
  25% { transform: translateY(-6px) rotate(-8deg); }
  50% { transform: translateY(0) rotate(0deg); }
  75% { transform: translateY(-6px) rotate(8deg); }
  100% { transform: translateY(0) rotate(0deg); }
}

/* 生气：发抖 */
@keyframes pet-angry {
  0%, 100% { transform: translateX(0) rotate(0deg); }
  25% { transform: translateX(-2px) rotate(-1deg); }
  75% { transform: translateX(2px) rotate(1deg); }
}

/* 红温：左右晃+缩放 */
@keyframes pet-blush {
  0%, 100% { transform: rotate(0deg) scale(1); }
  25% { transform: rotate(-5deg) scale(1.03); }
  75% { transform: rotate(5deg) scale(1.03); }
}

/* 流泪：微微下沉抖动 */
@keyframes pet-cry {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(2px) rotate(-1deg); }
}

/* 大笑：弹跳+摇摆 */
@keyframes pet-laugh {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  25% { transform: translateY(-6px) rotate(-5deg); }
  50% { transform: translateY(0) rotate(0deg); }
  75% { transform: translateY(-6px) rotate(5deg); }
}

/* 对话气泡：显示在桌宠右侧，渐变背景 + 弹性动画 */
.pet-bubble {
  position: absolute;
  top: 25%;
  left: 102%;
  transform: translateX(0);
  background: linear-gradient(135deg, #fff 0%, #f0f4ff 100%);
  border: 2rpx solid rgba(167,139,250,0.15);
  border-radius: 20rpx;
  padding: 8rpx 18rpx;
  box-shadow: 0 4rpx 20rpx rgba(139,92,246,0.12), 0 1rpx 4rpx rgba(0,0,0,0.04);
  white-space: nowrap;
  animation: bubble-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  z-index: 20;
  max-width: 260rpx;
}

.pet-bubble::after {
  content: '';
  position: absolute;
  top: 45%;
  right: 100%;
  transform: translateY(-50%);
  border: 8rpx solid transparent;
  border-right-color: #fff;
}

.pet-bubble-text {
  font-size: 19rpx;
  color: #4b5563;
  display: block;
  font-weight: 500;
}

@keyframes bubble-pop {
  0% { transform: translateX(15px) scale(0.3); opacity: 0; }
  60% { transform: translateX(-2px) scale(1.05); opacity: 1; }
  100% { transform: translateX(0) scale(1); opacity: 1; }
}
</style>