import { useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import SockJS from "sockjs-client";
import Stomp from "stompjs";

const VideoRoom = () => {
    const { roomId } = useParams();
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState('');
    const videoRef = useRef(null);
    const stompClient = useRef(null);
    const [lastSyncState, setLastSyncState] = useState(null);
    const [lastSeekTime, setLastSeekTime] = useState(0); // Час останнього перемотування

    useEffect(() => {
        const socket = new SockJS('http://localhost:8080/ws');
        const client = Stomp.over(socket);

        client.connect({}, () => {
            stompClient.current = client;
            console.log('Connected to WebSocket');

            fetch(`http://localhost:8080/messages/${roomId}`)
                .then(response => response.json())
                .then(data => {
                    setMessages(data);
                });

            client.subscribe(`/topic/sync/${roomId}`, (message) => {
                const state = JSON.parse(message.body);
                console.log("Sync state received:", state);
                syncVideo(state);
            });

            const subscription = client.subscribe(`/topic/chat/${roomId}`, (message) => {
                const chatMessage = JSON.parse(message.body);
                console.log('Received message:', chatMessage);
                setMessages((prev) => [...prev, chatMessage]);
            });

            return () => {
                subscription.unsubscribe();
                client.disconnect(() => console.log('WebSocket disconnected'));
            };
        });
    }, [roomId]);

    const syncVideo = (state) => {
        const video = videoRef.current;

        if (
            !lastSyncState ||
            Math.abs(video.currentTime - state.currentTime) > 0.5 ||
            lastSyncState.paused !== state.paused
        ) {
            console.log(`Syncing video: ${state.paused ? "paused" : "playing"} at ${state.currentTime}`);
            if (Math.abs(video.currentTime - state.currentTime) > 0.5) {
                video.currentTime = state.currentTime;
            }
            if (state.paused && !video.paused) {
                video.pause();
            } else if (!state.paused && video.paused) {
                video.play();
            }
            setLastSyncState(state);
        }
    };

    const sendSync = (state) => {
        const currentTime = Date.now();
        if (currentTime - lastSeekTime >= 1000) {
            stompClient.current.send(
                `/app/sync/${roomId}`,
                {},
                JSON.stringify(state)
            );
            setLastSeekTime(currentTime);
        } else {
            console.log('Seeking too frequently, ignoring...');
        }
    };

    const sendMessage = () => {
        if (message.trim() !== '') {
            stompClient.current.send(
                `/app/chat/${roomId}`,
                {},
                JSON.stringify({
                    text: message,
                    username: "adsd"
                })
            );
            setMessage('');
        }
    };

    return (
        <div className="video-room">
            <h1>Room: {roomId}</h1>
            <video
                ref={videoRef}
                controls
                onPlay={() => sendSync({ currentTime: videoRef.current.currentTime, paused: false })}
                onPause={() => sendSync({ currentTime: videoRef.current.currentTime, paused: true })}
                onSeeked={() => sendSync({ currentTime: videoRef.current.currentTime, paused: videoRef.current.paused })}
            >
                <source src="/Spider.Man.2.2004.1080p.BluRay.x264.YIFY.mp4" type="video/mp4" />
                Your browser does not support the video tag.
            </video>

            <div className="chat">
                <h2>Chat</h2>
                <div className="messages">
                    {messages.map((msg, index) => (
                        <p key={index}>{msg.text}</p>
                    ))}
                </div>
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                />
            </div>
        </div>
    );
};

export { VideoRoom };
