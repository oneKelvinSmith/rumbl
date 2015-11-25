/* global YT:false */

const Player = {
  player: null,

  init(domId, playerId) {
    window.onYouTubeIframeAPIReady = () => this.onIframeReady(domId, playerId)
    const youTubeScriptTag = document.createElement('script')
    youTubeScriptTag.src = '//www.youtube.com/iframe_api'
    document.head.appendChild(youTubeScriptTag)
  },

  onIframeReady(domId, playerId) {
    this.player = new YT.Player(domId, {
      height: '360',
      width: '420',
      videoId: playerId,
      events: {
        'onReady': event => this.onPlayerReady(event),
        'onStateChange': event => this.onPlayerStateChange(event)
      }
    })
  },

  onPlayerStateChange() {},

  onPlayerReady() {},

  getCurrentTime() {
    return Math.floor(this.player.getCurrentTime() * 1000)
  },

  seekTo(millsec) {
    return this.player.seekTo(millsec / 1000)
  }
}
export default Player
