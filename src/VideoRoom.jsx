import { useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

const VideoRoom = () => {
   // Artem is a glue guzler homeless fuck Zehahahahhaah

   const { roomId } = useParams();
   const [messages, setMessages] = useState([]);
   const [message, setMessage] = useState("");
   const videoRef = useRef(null);
   const stompClient = useRef(null);

   const [seekval, setSeekval] = useState(0);

   const [isDisabled, setIsDisabled] = useState(false);

   useEffect(() => {
      const client = new Client({
         webSocketFactory: () => new SockJS("http://localhost:8080/ws"),
         onConnect: () => {
            console.log("Connected to WebSocket");
            stompClient.current = client;

            fetch(`http://localhost:8080/messages/${roomId}`)
               .then((response) => response.json())
               .then((data) => {
                  setMessages(data);
               });

            client.subscribe(`/topic/sync/${roomId}`, (message) => {
               const state = JSON.parse(message.body);
               console.log("Sync state received:", state);
               syncVideo(state);
               setIsDisabled(false);
               setSeekval(state.currentTime)
            });

            client.subscribe(`/topic/chat/${roomId}`, (message) => {
               const chatMessage = JSON.parse(message.body);
               console.log("Received message:", chatMessage);
               setMessages((prev) => [...prev, chatMessage]);
            });
         },
         onStompError: (frame) => {
            console.error("Broker error:", frame.headers["message"]);
            console.error("Details:", frame.body);
         }
      });

      client.activate();

      return () => {
         client.deactivate();
      };
   }, [roomId]);

   const syncVideo = (state) => {
      const video = videoRef.current;
      console.log("yoo nig");

      console.log(
         `Syncing video: ${state.paused ? "paused" : "playing"} at ${
            state.currentTime
         }`
      );
      video.currentTime = state.currentTime;
      if (state.paused) video.pause();
      if (!state.paused) video.play();
   };

   const sendSync = (state) => {
      stompClient.current.publish({
         destination: `/app/sync/${roomId}`,
         body: JSON.stringify(state)
      });
   };

   const sendMessage = () => {
      if (message.trim() !== "") {
         stompClient.current.publish({
            destination: `/app/chat/${roomId}`,
            body: JSON.stringify({
               text: message,
               username: "adsd"
            })
         });
         setMessage("");
      }
   };



   // Video player handlers shirorororororo
   const onPlay = () => {
      setIsDisabled(true);
      sendSync({
         currentTime: videoRef.current.currentTime,
         paused: false
      });
   };

   const onPause = () => {
      setIsDisabled(true);

      sendSync({
         currentTime: videoRef.current.currentTime,
         paused: true
      });
   };

   const onSeek = (time) => {
      setIsDisabled(true);
      sendSync({
         currentTime: time,
         paused: videoRef.current.paused
      });
   };



   // Ui Dereshishsishissi
   return (
      <div className="video-room">
         <h1>Room: {roomId}</h1>
         <div className="flex flex-col gap-2 p-3 border border-black">
            <video className="videvo" ref={videoRef}>
               <source src="/SQS2Ep1.mp4" type="video/mp4" />
               Your browser does not support the video tag.
            </video>
            {isDisabled ? (
               <p>Loading...</p>
            ) : (
               <>
                  {videoRef.current && (
                     <input
                        className="w-[500px]"
                        type="range"
                        min={0}
                        value={seekval}
                        max={videoRef.current.duration}
                        onInput={({ target }) => onSeek(target.value)}
                     />
                  )}
               </>
            )}
         </div>

         <div className="flex gap-2 p-4">
            {isDisabled ? (
               <p>Loading...</p>
            ) : (
               <>
                  <button
                     onClick={onPlay}
                     className="border-black border px-2 rounded-xl"
                  >
                     play
                  </button>
                  <button
                     onClick={onPause}
                     className="border-black border px-2 rounded-xl"
                  >
                     pause
                  </button>
               </>
            )}
         </div>

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
               onKeyPress={(e) => e.key === "Enter" && sendMessage()}
            />
         </div>
      </div>
   );
};

export { VideoRoom };
