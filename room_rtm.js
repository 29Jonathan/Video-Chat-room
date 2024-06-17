let handleMemberJoined = async (memberId) => {
    console.log('new member joined', memberId)

    let members = await channel.getMembers()

    addBotMessageToDom(`Welcome ${memberId}!👋🏻`)
}

let handleMemberLeft = async (memberId) => {
    console.log('handleMemberLeft() is called: ', memberId)
}

let getMembers = async () => {
    let members = await channel.getMembers()
    return members;
}

let handleChannelMessage = async (messageData, memberId) => {
    console.log('A new message was recevied')
    let data = JSON.parse(messageData.text)

    if (data.type === 'chat') {
        addMessageToDom(data.displayName, data.message)
    }
}

let sendMessage = async (e) => {
    e.preventDefault()
    
    let message = e.target.message.value

    if (!channel) {
        console.error('Channel is not initialized');
        return;
    }

    channel.sendMessage({text: JSON.stringify({'type':'chat', 'message': message, 'displayName': uid})})
    if(message[0] === '!')
        handleCommand(message)

    addMessageToDom(uid, message)
    e.target.reset()
}

let addMessageToDom = (uid, message) => {
    let messagesWrapper = document.getElementById('messages')

    let newMessage = `<div class="message__wrapper">
                            <div class="message__body">
                                <strong class="message__author">${uid}</strong>
                                <p class="message__text">${message}</p>
                            </div>
                        </div>`

    messagesWrapper.insertAdjacentHTML('beforeend', newMessage)

    let lastMessage = document.querySelector('.message__wrapper:last-child')
    if(lastMessage){
        lastMessage.scrollIntoView()
    }
}

let addBotMessageToDom = (botMessage) => {
    let messagesWrapper = document.getElementById('messages')

    let newMessage = `<div class="message__wrapper">
                            <div class="message__body__bot">
                                <strong class="message__author__bot">🤖 Jonathan Bot</strong>
                                <p class="message__text__bot">${botMessage}</p>
                            </div>
                        </div>`

    messagesWrapper.insertAdjacentHTML('beforeend', newMessage)

    let lastMessage = document.querySelector('.message__wrapper:last-child')
    if(lastMessage){
        lastMessage.scrollIntoView()
    }
}

let clearMessages = () => {
    let messagesWrapper = document.getElementById('messages')
    messagesWrapper.innerHTML = ''
}

let handleCommand = (command) => {
    if (command == '!help')
        addBotMessageToDom('Available commands: !help, !members-count, !members-list')
    else if (command == '!members-count')
        getMembers().then((members) => {
            addBotMessageToDom(`Number of members: ${members.length}`)
        })
    else if (command == '!members-list')
        getMembers().then((members) => {
            for (let i = 0; members.length > i; i++) {
                addBotMessageToDom(`${members[i]}\n`)
            }
        })
    else if (command == '!leave')
        document.getElementById('leave-btn').click()
    else if (command == '!mic')
        document.getElementById('mic-btn').click()
    else if (command == '!camera')
        document.getElementById('camera-btn').click()
    else if (command == '!clear')
        clearMessages()
    else if (command == '!time') {
        let now = new Date();
        let date = now.toLocaleDateString();
        let time = now.toLocaleTimeString();
        let dateTime = `${date} ${time}`;
        addBotMessageToDom(`Current date and time is: ${dateTime}`);
    }
    else if (command == '!fake-offline')
    {
        fakeOffline()
    }
    else if (command == '!fake-online')
    {

    }
    else
        addBotMessageToDom('Command not recognized. Type !help to see available commands')

}

let leaveChannel = async () => {
    await channel.leave()
    await rtmClient.logout()
}

window.addEventListener('beforeunload', leaveChannel)
let messageForm = document.getElementById('message__form')
messageForm.addEventListener('submit', sendMessage)