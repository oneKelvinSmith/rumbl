import Player from './player'

const Video = {
  init(socket, element) {
    if (!element) {
      return
    }

    const msgContainer = document.getElementById('msg-container')
    const msgInput = document.getElementById('msg-input')
    const postButton = document.getElementById('msg-submit')
    const videoId = element.getAttribute('data-id')
    const playerId = element.getAttribute('data-player-id')

    Player.init(element.id, playerId)

    socket.connect()
    const videoChannel = socket.channel('videos:' + videoId)
  }
}
export default Video
