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

    postButton.addEventListener('click', () => {
      const payload = {
        body: msgInput.value,
        at: Player.getCurrentTime()
      }
      videoChannel
        .push('new_annotation', payload)
        .receive('error', error => console.log(error))

      msgInput.value = ''
    })

    videoChannel.on('new_annotation', (response) => {
      this.renderAnnotation(msgContainer, response)
    })

    videoChannel
      .join()
      .receive('ok', ({annotations}) => {
        annotations.forEach(ann => this.renderAnnotation(msgContainer, ann))
      })
      .receive('error', reason => console.log('join failed', reason))
  },

  renderAnnotation(msgContainer, {user, body, at}) {
    const template = document.createElement('div')
    template.innerHTML = `<b>${user.username}</b>: ${body}`
    msgContainer.appendChild(template)
    msgContainer.scrollTop = msgContainer.scrollHeight
  }
}

export default Video
