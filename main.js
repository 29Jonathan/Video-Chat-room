const APP_ID = "7ec8367dfb64493c9e4ed6d87b251276"
//let TOKEN = "007eJxTYBDMK5N2UCl+tfNs1FUTLtaXjQIXo/k/9PRFMJrZsV/cdVGBwcTY0sDcwNLczMTCzMQk1SjJxDjFLNUyyTLZxNDMPNkiPDUxrSGQkWF2phQjIwMEgvgsDLmJmXkMDABfXhvW"
let TOKEN = null;
const CHANNEL = "main"

let client;
let rtmClient;
let channel;
//let token = null; 
let uid = sessionStorage.getItem('uid')
if(!uid){
    uid = String(Math.floor(Math.random() * 10000))
    sessionStorage.setItem('uid', uid)
}
let displayFrame = document.getElementById('video-streams');
let localTracks = []
let remoteUsers = {}

let localScreenTracks;
let sharingScreen = false;

let joinAndDisplayLocalStream = async () => {
    rtmClient = AgoraRTM.createInstance(APP_ID)
    await rtmClient.login({uid, TOKEN})
    channel = rtmClient.createChannel(CHANNEL)
    await channel.join()
    channel.on('MemberJoined', handleMemberJoined)
    channel.on('MemberLeft', handleMemberLeft)
    channel.on('ChannelMessage', handleChannelMessage)
    addBotMessageToDom(`Welcome ${uid}!👋🏻`)

    client = AgoraRTC.createClient({mode:'rtc', codec:'vp8'})
    await client.join(APP_ID, CHANNEL, TOKEN, uid)
    client.on('user-published', handleUserJoined)
    client.on('user-left', handleUserLeft)
    localTracks = await AgoraRTC.createMicrophoneAndCameraTracks({}, {encoderConfig:{
        width:{min:640, ideal:1920, max:1920},
        height:{min:480, ideal:1080, max:1080}
    }}) 

    let player = `<div class="video-container" id="user-container-${uid}">
                        <div class="video-player" id="user-${uid}"></div>
                  </div>`
    document.getElementById('video-streams').insertAdjacentHTML('beforeend', player)

    localTracks[1].play(`user-${uid}`)
    
    await client.publish([localTracks[0], localTracks[1]])
}

let joinStream = async () => {
    await joinAndDisplayLocalStream()
    document.getElementById('join-btn').style.display = 'none'
    document.getElementById('stream-controls').style.display = 'flex'
}

let handleUserJoined = async (user, mediaType) => {
    remoteUsers[user.uid] = user 
    await client.subscribe(user, mediaType)

    if (mediaType === 'video'){
        let player = document.getElementById(`user-container-${user.uid}`)
        if (player != null){
            player.remove()
        }

        player = `<div class="video-container" id="user-container-${user.uid}">
                        <div class="video-player" id="user-${user.uid}"></div> 
                 </div>`
        document.getElementById('video-streams').insertAdjacentHTML('beforeend', player)

        user.videoTrack.play(`user-${user.uid}`)
    }

    if (mediaType === 'audio'){
        user.audioTrack.play()
    }
}

let handleUserLeft = async (user) => {
    delete remoteUsers[user.uid]
    document.getElementById(`user-container-${user.uid}`).remove()
}

let switchToCamera = async () => {
    let player = `<div class="video-container" id="user-container-${uid}">
                        <div class="video-player" id="user-${uid}"></div>
                  </div>`
    document.getElementById('video-streams').insertAdjacentHTML('beforeend', player)

    await localTracks[0].setMuted(true)
    await localTracks[1].setMuted(true)

    document.getElementById('mic-btn').innerText = 'Mic off'
    document.getElementById('mic-btn').style.backgroundColor = '#EE4B2B'
    document.getElementById('camera-btn').innerText = 'Camera off'
    document.getElementById('camera-btn').style.backgroundColor = '#EE4B2B'

    localTracks[1].play(`user-${uid}`)
    await client.publish([localTracks[1]])
}

let leaveAndRemoveLocalStream = async () => {
    for(let i = 0; localTracks.length > i; i++){
        localTracks[i].stop()
        localTracks[i].close()
    }

    await client.leave()
    document.getElementById('join-btn').style.display = 'block'
    document.getElementById('stream-controls').style.display = 'none'
    document.getElementById('video-streams').innerHTML = ''
}

let toggleMic = async (e) => {
    if (localTracks[0].muted){
        await localTracks[0].setMuted(false)
        e.target.innerText = 'Mic on'
        e.target.style.backgroundColor = 'cadetblue'
    }else{
        await localTracks[0].setMuted(true)
        e.target.innerText = 'Mic off'
        e.target.style.backgroundColor = '#EE4B2B'
    }
}

let toggleCamera = async (e) => {
    if(localTracks[1].muted){
        await localTracks[1].setMuted(false)
        e.target.innerText = 'Camera on'
        e.target.style.backgroundColor = 'cadetblue'
    }else{
        await localTracks[1].setMuted(true)
        e.target.innerText = 'Camera off'
        e.target.style.backgroundColor = '#EE4B2B'
    }
}

let toggleScreen = async (e) => {
    let screenButton = e.currentTarget
    let cameraButton = document.getElementById('camera-btn')

    if(!sharingScreen){
        sharingScreen = true

        e.target.innerText = 'Sharing'
        e.target.style.backgroundColor = '#EE4B2B'
        cameraButton.style.display = 'none'

        localScreenTracks = await AgoraRTC.createScreenVideoTrack()

        document.getElementById(`user-container-${uid}`).remove()

        let player = `<div class="video-container" id="user-container-${uid}">
                        <div class="video-player" id="user-${uid}"></div>
                  </div>`

        document.getElementById('video-streams').insertAdjacentHTML('beforeend', player)

        localScreenTracks.play(`user-${uid}`)

        await client.unpublish([localTracks[1]])
        await client.publish([localScreenTracks])

    }else{
        sharingScreen = false 
        e.target.innerText = 'Screen Share'
        e.target.style.backgroundColor = 'cadetblue'
        cameraButton.style.display = 'block'
        document.getElementById(`user-container-${uid}`).remove()
        await client.unpublish([localScreenTracks])

        switchToCamera()
    }
}

document.getElementById('join-btn').addEventListener('click', joinStream)
document.getElementById('leave-btn').addEventListener('click', leaveAndRemoveLocalStream)
document.getElementById('screen-btn').addEventListener('click', toggleScreen)
document.getElementById('mic-btn').addEventListener('click', toggleMic)
document.getElementById('camera-btn').addEventListener('click', toggleCamera)