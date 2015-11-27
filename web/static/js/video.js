import Player from './player'

const Video = {
  init(socket, element) {
    if (!element) { return }

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

    msgContainer.addEventListener('click', event => {
      event.preventDefault()
      const seconds = event.target.getAttribute('data-seek')
      if (!seconds) { return }

      Player.seekTo(seconds)
    })

    videoChannel.on('new_annotation', (response) => {
      this.renderAnnotation(msgContainer, response)
    })

    videoChannel
      .join()
      .receive('ok', ({annotations}) => {
        this.scheduleMessages(msgContainer, annotations)
      })
      .receive('error', reason => console.log('join failed', reason))
  },

  renderAnnotation(msgContainer, {user, body, at}) {
    const template = document.createElement('div')
    template.innerHTML = `
    <a href="#" data-seek="${at}">
      [${this.formatTime(at)}] <b>${user.username}</b>: ${body}
    </a>
    `
    msgContainer.appendChild(template)
    msgContainer.scrollTop = msgContainer.scrollHeight
  },

  scheduleMessages(msgContainer, annotations) {
    setTimeout(() => {
      const ctime = Player.getCurrentTime()
      const remaining = this.renderAtTime(annotations, ctime, msgContainer)
      this.scheduleMessages(msgContainer, remaining)
    }, 1000)
  },

  renderAtTime(annotations, seconds, msgContainer) {
    return Array.filter(annotations, ann => {
      if (ann.at > seconds) {
        return true
      }
      this.renderAnnotation(msgContainer, ann)
      return false
    })
  },

  formatTime(at) {
    const date = new Date(null)
    date.setSeconds(at / 1000)
    return date.toISOString().substr(14, 5)
  }
}

export default Video
